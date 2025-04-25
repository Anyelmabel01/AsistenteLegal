import { supabase } from '../supabaseClient';
import { generateEmbedding } from './openai';

/**
 * Sube un documento al storage de Supabase y registra su metadata en la base de datos
 * @param {File} file - Archivo a subir
 * @param {string} documentType - Tipo de documento legal
 * @param {string} source - Fuente del documento
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, documentId?: string, error?: string}>}
 */
export async function uploadDocument(file, documentType, source, userId) {
  try {
    // Determinar el bucket según el tipo de documento o fuente
    // Usar los nombres correctos de los buckets definidos en las migraciones
    let bucketName = 'legal_documents'; // Bucket principal para documentos de usuario
    if (source === 'Organo Judicial') {
      bucketName = 'organo_judicial_pdf'; // Bucket específico para PDFs del Órgano Judicial
    }

    // Generar un nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    // Asegúrate de que el path incluya el user_id si las políticas lo requieren (como en legal_documents)
    const filePath = bucketName === 'legal_documents' 
      ? `${userId}/${fileName}` 
      : `${fileName}`; // Para organo_judicial_pdf, el path podría ser más simple si las policies lo permiten

    // Subir el archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      // Proporcionar un mensaje de error más detallado
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Error al subir archivo al bucket '${bucketName}': ${uploadError.message}`);
    }

    // Crear registro en la tabla de documentos
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: file.name, // Guardar nombre original
        file_path: filePath, // Guardar path usado en storage
        document_type: documentType,
        source: source,
        status: 'pending' // El estado cambiará después con el procesamiento
      })
      .select()
      .single();

    if (documentError) {
      console.error('Supabase insert document error:', documentError);
      // Considerar eliminar el archivo subido si falla el registro en DB
      // await supabase.storage.from(bucketName).remove([filePath]);
      throw new Error(`Error al registrar documento en la base de datos: ${documentError.message}`);
    }

    console.log('Document uploaded and registered:', documentData.id);
    return {
      success: true,
      documentId: documentData.id
    };
  } catch (error) {
    console.error('Error en uploadDocument:', error);
    return {
      success: false,
      error: error.message // Devolver el mensaje de error específico
    };
  }
}

/**
 * Procesa el texto extraído de un documento y genera embeddings
 * @param {string} documentId - ID del documento
 * @param {string} extractedText - Texto extraído del documento
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function processDocumentText(documentId, extractedText) {
  try {
    // Actualizar el documento con el texto extraído
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        extracted_text: extractedText,
        status: 'processing'
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Error al actualizar documento: ${updateError.message}`);
    }

    // Dividir el texto en chunks para procesar
    const chunks = splitTextIntoChunks(extractedText);
    
    // Generar y guardar embeddings para cada chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      
      if (embedding) {
        const { error: embeddingError } = await supabase
          .from('document_embeddings')
          .insert({
            document_id: documentId,
            content: chunk,
            embedding: embedding
          });

        if (embeddingError) {
          console.error(`Error al guardar embedding: ${embeddingError.message}`);
        }
      }
    }

    // Marcar el documento como procesado
    const { error: finalUpdateError } = await supabase
      .from('documents')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (finalUpdateError) {
      throw new Error(`Error al finalizar procesamiento: ${finalUpdateError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error en processDocumentText:', error);
    
    // Marcar el documento con error
    await supabase
      .from('documents')
      .update({ 
        status: 'error'
      })
      .eq('id', documentId);
      
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Divide el texto en chunks más pequeños para procesamiento
 * @param {string} text - Texto completo
 * @param {number} maxChunkSize - Tamaño máximo de cada chunk
 * @returns {string[]} - Array de chunks
 */
function splitTextIntoChunks(text, maxChunkSize = 1000) {
  if (!text) return []; // Handle null or empty text
  // Dividir en párrafos
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // Si añadir este párrafo excede el tamaño máximo, guardar el chunk actual
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    // Añadir el párrafo al chunk actual
    if (currentChunk.length > 0) {
      currentChunk += '\n\n';
    }
    currentChunk += paragraph;

    // If a single paragraph is larger than maxChunkSize, split it further
    while (currentChunk.length > maxChunkSize) {
        let splitPoint = currentChunk.lastIndexOf(' ', maxChunkSize); // Try splitting at space
        if (splitPoint === -1 || splitPoint === 0) { // If no space or at the beginning, force split
            splitPoint = maxChunkSize;
        }
        chunks.push(currentChunk.substring(0, splitPoint).trim());
        currentChunk = currentChunk.substring(splitPoint).trim();
    }
  }

  // Añadir el último chunk si no está vacío
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Recupera documentos del usuario
 * @param {string} userId - ID del usuario
 * @param {object} options - Opciones de filtrado
 * @returns {Promise<{success: boolean, documents?: any[], error?: string}>}
 */
export async function getUserDocuments(userId, options = {}) {
  if (!userId) return { success: false, error: 'User ID is required' };
  try {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);
    
    // Aplicar filtros si existen
    if (options.documentType) {
      query = query.eq('document_type', options.documentType);
    }
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    // Ordenar por fecha de creación (más reciente primero)
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase get documents error:', error);
      throw new Error(`Error al recuperar documentos: ${error.message}`);
    }
    
    return {
      success: true,
      documents: data || [] // Return empty array if data is null
    };
  } catch (error) {
    console.error('Error en getUserDocuments:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Realiza una búsqueda semántica en documentos usando embeddings
 * @param {string} queryText - Texto de búsqueda
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @param {number} threshold - Umbral de similitud mínimo
 * @returns {Promise<{success: boolean, results?: any[], error?: string}>}
 */
export async function semanticSearch(queryText, userId, limit = 5, threshold = 0.7) {
  if (!userId) return { success: false, error: 'User ID is required' };
  if (!queryText) return { success: false, error: 'Query text is required' };

  try {
    // Generar embedding para la consulta
    const embedding = await generateEmbedding(queryText);
    
    if (!embedding) {
      throw new Error('No se pudo generar embedding para la consulta');
    }
    
    // Realizar búsqueda por similitud de vectores usando la función RPC
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId // Asegúrate que el parámetro coincide con la definición SQL
    });
    
    if (error) {
      console.error('Supabase RPC match_documents error:', error);
      throw new Error(`Error en búsqueda semántica: ${error.message}`);
    }
    
    return {
      success: true,
      results: data || [] // Return empty array if data is null
    };
  } catch (error) {
    console.error('Error en semanticSearch:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 