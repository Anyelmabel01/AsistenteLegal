import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Cambiamos completamente el enfoque para usar una versión más adecuada para Node.js
import { Readable } from 'stream';
import { generateCompletion } from '@/lib/perplexity';

// Declarar variables que usaremos tras la carga dinámica
let pdfjsLib: any = null;

// Función para cargar dinámicamente pdfjs cuando sea necesario
async function loadPdfjsLib() {
  if (pdfjsLib) return pdfjsLib; // Ya está cargado
  
  try {
    // Usar una versión específica para Node.js
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
    pdfjsLib = pdfjs;
    
    // Desactivar el worker para entornos Node.js
    if (typeof window === 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    
    return pdfjsLib;
  } catch (error) {
    console.error('Error cargando pdfjs-dist:', error);
    throw new Error('No se pudo cargar la biblioteca PDF.js');
  }
}

// Helper para convertir ReadableStream a Buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  console.log('API Route /api/process-document llamada');
  const supabase = createClient();

  try {
    // 1. Autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear cuerpo (incluyendo modos y modelo)
    const body = await req.json();
    const { inputText, attachments, searchMode, researchMode, selectedModel } = body;
    console.log('Datos recibidos (modos no usados para LLM en backend):', { inputText, attachments, searchMode, researchMode, selectedModel });

    if (!inputText && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Se requiere texto o adjuntos' }, { status: 400 });
    }
    if (typeof searchMode === 'undefined' || typeof researchMode === 'undefined' || !selectedModel) {
       return NextResponse.json({ error: 'Faltan parámetros: searchMode, researchMode o selectedModel' }, { status: 400 });
    }

    let combinedContent = inputText || '';
    const extractedTexts: string[] = [];

    // 3. Procesar documentos adjuntos 
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.type === 'document' && attachment.filePath) {
          console.log(`Procesando documento: ${attachment.filePath}`);
          try {
            // MODIFICACIÓN: En lugar de procesar PDFs, simplemente añadimos un texto descriptivo
            extractedTexts.push(`[Documento adjunto: ${attachment.name}]`);
            console.log(`Procesamiento de PDFs desactivado temporalmente para el documento ${attachment.name}`);

            /* CÓDIGO COMENTADO - a implementar más adelante cuando se solucione el problema con pdfjs-dist
            // Cargar pdfjs-dist dinámicamente
            try {
              pdfjsLib = await loadPdfjsLib();
            } catch (pdfLoadError) {
              console.error('Error al cargar pdfjs-dist:', pdfLoadError);
              extractedTexts.push(`[No se pudo procesar el documento ${attachment.name}: error de biblioteca PDF]`);
              continue;
            }
            
            const { data: blobData, error: downloadError } = await supabase.storage
              .from('attachments')
              .download(attachment.filePath);
              
            if (downloadError) throw new Error(`No se pudo descargar ${attachment.name}: ${downloadError.message}`);
            if (!blobData) throw new Error(`Archivo ${attachment.name} vacío o no encontrado.`);
            
            // Convertir Blob a ArrayBuffer, luego a Uint8Array para pdfjs-dist
            const arrayBuffer = await blobData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            console.log(`Datos para pdfjs-dist - Path: ${attachment.filePath}, Tipo: Uint8Array, Longitud: ${uint8Array?.length}`);

            if (!uint8Array || uint8Array.length === 0) {
              throw new Error(`Uint8Array vacío o inválido para ${attachment.name}`);
            }
            
            // Cargar el documento PDF desde el array de bytes
            const loadingTask = pdfjsLib.getDocument({ 
              data: uint8Array,
              disableWorker: true // Añadimos esta opción para evitar el uso del worker
            });
            const pdfDocument = await loadingTask.promise;
            console.log(`PDF ${attachment.name} cargado, páginas: ${pdfDocument.numPages}`);

            // Limitar el número de páginas para evitar PDFs demasiado grandes
            const maxPages = 30;
            const pagesToProcess = Math.min(pdfDocument.numPages, maxPages);
            
            if (pdfDocument.numPages > maxPages) {
              console.warn(`PDF ${attachment.name} tiene ${pdfDocument.numPages} páginas. Procesando solo las primeras ${maxPages}.`);
            }

            let fullText = '';
            // Iterar sobre cada página para extraer texto (con límite)
            for (let i = 1; i <= pagesToProcess; i++) {
              const page = await pdfDocument.getPage(i);
              const textContent = await page.getTextContent();
              // Concatenar el texto de todos los items de la página
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
                
              // Filtrar texto sin sentido (muy largo sin espacios)
              const cleanPageText = pageText
                .replace(/\s+/g, ' ') // Normalizar espacios
                .trim();
                
              fullText += cleanPageText + '\n\n';
              
              // Verificar el tamaño durante el proceso
              if (fullText.length > 20000) {
                console.warn(`Texto extraído muy largo (>20k). Truncando extracción en página ${i} de ${pagesToProcess}`);
                fullText += `\n\n[PDF truncado: el documento es demasiado grande. Se procesaron ${i} de ${pdfDocument.numPages} páginas]`;
                break;
              }
            }
            
            // Asegurar que el texto final no sea demasiado grande
            const maxTextLength = 15000;
            if (fullText.length > maxTextLength) {
              fullText = fullText.substring(0, maxTextLength) + `\n\n[Texto truncado. Documento original: ${attachment.name} - ${pdfDocument.numPages} páginas]`;
            }
            
            extractedTexts.push(fullText.trim());
            console.log(`Texto extraído de ${attachment.name} (longitud: ${fullText.length} chars)`);
            */

          } catch (error: any) {
            console.error(`Error procesando el PDF ${attachment.name}:`, error);
            extractedTexts.push(`[Error al procesar el documento ${attachment.name}: ${error.message}]`);
          }
        } else if (attachment.type === 'image') {
             extractedTexts.push(`[Imagen adjunta: ${attachment.name}]`);
        } else if (attachment.type === 'audio') {
             extractedTexts.push(`[Audio adjunto: ${attachment.name}]`);
        }
      }
      
      // Solo añadir textos extraídos si hay alguno
      if (extractedTexts.length > 0) {
        combinedContent += '\n\n--- Contenido de Documentos Adjuntos ---\n' + extractedTexts.join('\n\n---\n');
      }
    }

    console.log('Contenido combinado final listo para LLM (primeros 500 chars):', combinedContent.substring(0, 500));

    // 4. Llamar a generateCompletion (única opción ahora)
    let assistantResponseContent: string | null = null; // Guardará solo el texto de la respuesta
    try {
      // Truncar el contenido para evitar problemas con textos demasiado largos
      const maxPromptLength = 6000; // Limitar a ~6000 caracteres
      const truncatedContent = combinedContent.length > maxPromptLength 
        ? combinedContent.substring(0, maxPromptLength) + "\n\n[Texto truncado debido a limitaciones de tamaño]" 
        : combinedContent;
        
      console.log('Llamando a generateCompletion (backend):', { model: selectedModel, promptLength: truncatedContent.length });
      
      // Primero intentar con Perplexity
      assistantResponseContent = await generateCompletion(truncatedContent, { 
          modelName: selectedModel, // Pasar el nombre del modelo a las opciones
          maxTokens: 800, // Limitar tokens para evitar timeouts
          temperature: 0.7  // Mantener temperatura estándar
      });

      if (!assistantResponseContent) {
        throw new Error('El LLM no devolvió respuesta.');
      }
    } catch (llmError: any) {
      console.error('Error llamando al LLM:', llmError);
      
      // Extraer mensaje de error más detallado
      let errorMessage = llmError.message || 'Error desconocido';
      let statusCode = 500;
      
      // Verificar si es un error de autenticación o configuración
      if (errorMessage.includes('API_KEY') || 
          errorMessage.includes('authentication') || 
          errorMessage.includes('unauthorized')) {
        statusCode = 401;
        errorMessage = 'Error de autenticación con el proveedor de LLM. Verifique la configuración del API key.';
      }
      
      // Verificar si es un error de conexión o respuesta HTML
      if (errorMessage.includes('<!DOCTYPE') || 
          errorMessage.includes('HTML') || 
          errorMessage.includes('no es JSON válido')) {
        console.error('Detectada respuesta HTML del proveedor LLM. Usando respuesta fallback.');
        
        // FALLBACK: Proporcionar una respuesta básica cuando el servicio de Perplexity no está disponible
        const extractedInfo = extractedTexts.length > 0 
          ? "He detectado contenido en los documentos adjuntos, pero no puedo analizarlos en detalle en este momento."
          : "";
          
        // Crear una respuesta de fallback útil
        assistantResponseContent = `Lo siento, estoy experimentando problemas de conexión con mi servicio de IA en este momento.

${extractedInfo}

Puedo sugerirle:
1. Intentar de nuevo en unos minutos
2. Verificar que su pregunta sea clara y específica
3. Si el problema persiste, contacte al administrador del sistema para verificar la configuración de la API

Gracias por su paciencia.`;

        // Continuar el flujo normal con esta respuesta en lugar de retornar error
        return NextResponse.json({
          content: assistantResponseContent,
          sources: [],
          model: "fallback", // Indicar que usamos fallback
        }, { status: 200 });
      }
      
      // Si llegamos aquí, es otro tipo de error que debemos reportar
      return NextResponse.json({ 
        error: 'Error al generar respuesta del asistente', 
        details: errorMessage 
      }, { status: statusCode });
    }

    // 5. Devolver la respuesta REAL del LLM (solo contenido)
    console.log('Respuesta del LLM obtenida:', assistantResponseContent);
    return NextResponse.json({
      // Devolver solo la estructura mínima esperada por el frontend ahora
      content: assistantResponseContent,
      sources: [], // No tenemos sources de generateCompletion
      model: selectedModel, // Devolver el modelo usado
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error en /api/process-document:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
} 