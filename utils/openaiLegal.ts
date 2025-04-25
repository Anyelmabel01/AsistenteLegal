import OpenAI from 'openai';
import { supabase } from '../src/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Inicializa el cliente OpenAI
const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Validación básica
if (!openaiApiKey) {
  console.error('Error: Missing environment variable NEXT_PUBLIC_OPENAI_API_KEY');
}

// Crea la instancia de OpenAI
const openai = openaiApiKey 
  ? new OpenAI({ 
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true // Para permitir uso en cliente
    })
  : null;

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type CaseContext = {
  title: string;
  description: string;
  status: string;
  documentContent?: string;
  analysis?: string;
};

/**
 * Genera un análisis legal especializado utilizando GPT-4
 * @param messages - El historial de mensajes de la conversación
 * @param caseContext - Contexto del caso legal
 * @returns Respuesta del asistente y referencias legales identificadas
 */
export async function generateLegalAnalysis(
  messages: Message[], 
  caseContext: CaseContext | null
) {
  if (!openai) {
    console.error('OpenAI client not initialized.');
    return { 
      assistantResponse: 'Lo siento, no puedo procesar tu solicitud en este momento.', 
      references: [] 
    };
  }

  try {
    // Construir un prompt con enfoque legal panameño
    const legalSystemPrompt = `Eres un asistente legal especializado en derecho panameño. Tu objetivo es proporcionar información precisa y útil relacionada con casos legales en Panamá.

${caseContext ? `CONTEXTO DEL CASO:
Título: ${caseContext.title}
Descripción: ${caseContext.description}
Estado: ${caseContext.status}
${caseContext.analysis ? `Análisis previo: ${caseContext.analysis}` : ''}
` : 'No hay contexto específico del caso disponible.'}

Instrucciones:
1. Proporciona respuestas basadas en la legislación panameña vigente.
2. Si mencionas leyes, códigos o jurisprudencia, incluye referencias específicas.
3. Si no estás seguro de una respuesta, indícalo claramente y sugiere alternativas o fuentes de información.
4. Mantén un tono profesional y objetivo.
5. Identifica posibles estrategias legales cuando sea apropiado.
6. Cuando menciones plazos o fechas importantes, sé específico y destácalos.

NOTA IMPORTANTE: Este sistema proporcionará referencias e información general, pero no reemplaza el consejo legal profesional personalizado.`;

    // Sistema de búsqueda semántica (ficticio por ahora, pero preparado para integrarse con pgvector)
    let relevantLegalReferences: string[] = [];
    
    if (caseContext && caseContext.documentContent) {
      // Intenta extraer términos clave del documento para buscar referencias relevantes
      const keyTermsPrompt = `
      Analiza el siguiente texto de un documento legal:
      "${caseContext.documentContent.substring(0, 1500)}${caseContext.documentContent.length > 1500 ? '...' : ''}"
      
      Identifica 3-5 términos o conceptos legales clave mencionados en este texto que sean relevantes para buscar legislación panameña aplicable. Solo responde con los términos separados por comas.`;
      
      try {
        const keyTermsResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: keyTermsPrompt }],
          max_tokens: 100,
          temperature: 0.3,
        });
        
        const keyTerms = keyTermsResponse.choices[0]?.message?.content || '';
        
        // En un entorno real, aquí es donde se conectaría a pgvector para buscar
        // referencias legales basadas en los términos clave
        // Por ahora, simularemos algunas referencias relevantes
        if (keyTerms.includes('contrato') || caseContext.description.includes('contrato')) {
          relevantLegalReferences.push("Código Civil de Panamá, Art. 1105-1162 sobre obligaciones contractuales");
        }
        
        if (keyTerms.includes('propiedad') || caseContext.description.includes('propiedad')) {
          relevantLegalReferences.push("Código Civil de Panamá, Art. 337-445 sobre el derecho de propiedad");
        }
        
        if (keyTerms.includes('laboral') || caseContext.description.includes('laboral')) {
          relevantLegalReferences.push("Código de Trabajo de Panamá, Art. 1-12 sobre principios generales");
          relevantLegalReferences.push("Ley 44 de 1995 que modifica el Código de Trabajo");
        }
        
        if (keyTerms.includes('familia') || caseContext.description.includes('familia')) {
          relevantLegalReferences.push("Código de la Familia, Ley No. 3 del 17 de mayo de 1994");
        }
        
        // Añadir estas referencias como contexto
        if (relevantLegalReferences.length > 0) {
          const referencesContext = `Referencias legales potencialmente relevantes para este caso:\n${relevantLegalReferences.join('\n')}`;
          legalSystemPrompt + `\n\n${referencesContext}`;
        }
      } catch (error) {
        console.error('Error extracting key terms:', error);
      }
    }

    // Preparar los mensajes para la API
    const augmentedMessages = [
      { role: 'system' as const, content: legalSystemPrompt },
      ...messages
    ];

    // Llamar a la API de OpenAI para obtener la respuesta
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: augmentedMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Procesar la respuesta
    const assistantResponse = response.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    // Extraer referencias adicionales de la respuesta del asistente
    const extractedReferences = await extractLegalReferences(assistantResponse);
    
    // Combinar referencias encontradas en el análisis previo con las nuevas
    const allReferences = Array.from(new Set([...relevantLegalReferences, ...extractedReferences]));

    return {
      assistantResponse,
      references: allReferences
    };
  } catch (error) {
    console.error("Error generating legal analysis:", error);
    return {
      assistantResponse: "Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.",
      references: []
    };
  }
}

/**
 * Extrae referencias legales mencionadas en un texto
 * @param text - El texto para analizar
 * @returns Lista de referencias legales
 */
async function extractLegalReferences(text: string): Promise<string[]> {
  if (!openai) return [];
  
  try {
    const extractionPrompt = `
    Del siguiente texto, extrae todas las referencias legales mencionadas (leyes, códigos, artículos, jurisprudencia, etc.). 
    Devuelve solo la lista de referencias, una por línea, sin añadir ningún otro texto o explicación:
    
    "${text}"
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: extractionPrompt }],
      max_tokens: 250,
      temperature: 0.1,
    });
    
    const extractedText = response.choices[0]?.message?.content || '';
    
    // Convertir el texto de respuesta en un array de referencias
    const references = extractedText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^-\s*/, '').trim());
    
    return references;
  } catch (error) {
    console.error("Error extracting legal references:", error);
    return [];
  }
}

/**
 * Genera embeddings para un texto utilizando OpenAI
 * @param text Texto para generar embeddings
 * @returns Vector de embeddings
 */
async function generateEmbeddings(text: string): Promise<number[] | null> {
  if (!openai) return null;
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

/**
 * Busca semánticamente en la base de datos de documentos legales usando pgvector
 * @param query Consulta para buscar
 * @param limit Número máximo de resultados
 * @returns Lista de referencias legales relevantes
 */
async function semanticSearchLegal(query: string, limit = 5): Promise<string[]> {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return getFallbackReferences(query);
  }
  
  try {
    // 1. Generar embeddings para la consulta
    const embeddings = await generateEmbeddings(query);
    
    if (!embeddings) {
      console.error("Could not generate embeddings for query");
      return getFallbackReferences(query);
    }
    
    // 2. Buscar documentos similares usando pgvector
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embeddings,
      match_threshold: 0.5,
      match_count: limit
    });
    
    if (error) {
      console.error("Error searching documents:", error);
      return getFallbackReferences(query);
    }
    
    // 3. Formatear y devolver referencias
    const references = documents.map((doc: any) => {
      return `${doc.title} - ${doc.type === 'law' ? 'Ley' : 'Jurisprudencia'} (${doc.reference})`;
    });
    
    return references.length > 0 ? references : getFallbackReferences(query);
    
  } catch (error) {
    console.error("Error in semantic search:", error);
    return getFallbackReferences(query);
  }
}

/**
 * Devuelve referencias basadas en palabras clave cuando falla la búsqueda semántica
 * @param query Consulta original
 * @returns Lista de referencias básicas
 */
function getFallbackReferences(query: string): string[] {
  const references: string[] = [];
  
  if (query.includes('contrato') || query.includes('acuerdo')) {
    references.push("Código Civil de Panamá, Art. 1105-1162 sobre obligaciones contractuales");
  }
  
  if (query.includes('propiedad') || query.includes('inmueble') || query.includes('tierra')) {
    references.push("Código Civil de Panamá, Art. 337-445 sobre el derecho de propiedad");
    references.push("Ley 80 de 2009 sobre titulación de tierras");
  }
  
  if (query.includes('trabajo') || query.includes('laboral') || query.includes('empleo')) {
    references.push("Código de Trabajo de Panamá, Art. 1-12 sobre principios generales");
    references.push("Ley 44 de 1995 que modifica el Código de Trabajo");
  }
  
  if (query.includes('familia') || query.includes('matrimonio') || query.includes('divorcio')) {
    references.push("Código de la Familia, Ley No. 3 del 17 de mayo de 1994");
  }
  
  if (query.includes('penal') || query.includes('delito') || query.includes('crimen')) {
    references.push("Código Penal de Panamá, Ley 14 de 2007");
    references.push("Código Procesal Penal de Panamá, Ley 63 de 2008");
  }
  
  return references.slice(0, 5);
}

export default {
  generateLegalAnalysis,
  extractLegalReferences,
  semanticSearchLegal
}; 