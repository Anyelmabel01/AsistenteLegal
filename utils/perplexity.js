/**
 * Cliente básico para la API de Perplexity AI usando fetch
 */

// Constantes de configuración
const API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '';
const API_BASE_URL = 'https://api.perplexity.ai';

/**
 * Genera una respuesta usando el modelo de Perplexity
 * @param {Array} messages - Los mensajes en formato ChatGPT [{role: 'user', content: 'Hola'}, ...]
 * @returns {Promise<string>} La respuesta generada
 */
export async function generateCompletion(messages) {
  try {
    // Asegurarse de que los roles se alternen correctamente
    let validatedMessages = [];
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Primero agregar mensajes del sistema (si hay)
    if (systemMessages.length > 0) {
      validatedMessages.push(...systemMessages);
    }
    
    // Luego agregar los demás mensajes, asegurando alternancia
    let expectedRole = 'user'; // Comenzamos esperando un mensaje de usuario
    
    // Si el primer mensaje no es de usuario, agregamos uno artificial
    if (nonSystemMessages.length > 0 && nonSystemMessages[0].role !== 'user') {
      validatedMessages.push({
        role: 'user',
        content: 'Hola, ¿puedes ayudarme?'
      });
      expectedRole = 'assistant';
    }
    
    for (const msg of nonSystemMessages) {
      // Si el rol actual no coincide con el esperado y no es el primero
      if (msg.role !== expectedRole && validatedMessages.length > systemMessages.length) {
        // Insertar un mensaje de transición adecuado
        validatedMessages.push({
          role: expectedRole,
          content: expectedRole === 'assistant' ? 'Entiendo.' : '¿Puedes continuar?'
        });
      }
      
      validatedMessages.push(msg);
      expectedRole = msg.role === 'user' ? 'assistant' : 'user';
    }
    
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // También disponibles: sonar-medium-chat, sonar-small-online, etc.
        messages: validatedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    // Verificar si la respuesta es OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error en la API: ${response.status}`);
    }

    const data = await response.json();
    
    // Validar la estructura de la respuesta
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    
    throw new Error('Respuesta inesperada de la API de Perplexity');

  } catch (error) {
    console.error('Error al generar respuesta con Perplexity:', error);
    throw new Error('No se pudo generar una respuesta. Por favor, intenta de nuevo.');
  }
}

/**
 * Analiza un documento legal
 * @param {string} documentText - El texto del documento a analizar
 * @param {string} documentType - El tipo de documento (jurisprudencia, ley, contrato, demanda)
 * @returns {Promise<string>} El análisis del documento
 */
export async function analyzeDocument(documentText, documentType) {
  // Limitar el texto si es demasiado largo
  const maxLength = 25000; // Reducido para asegurar que cabe dentro de los límites del contexto
  const truncatedText = documentText.length > maxLength 
    ? documentText.substring(0, maxLength) + "... [texto truncado por longitud]" 
    : documentText;

  // Crear un prompt basado en el tipo de documento
  let systemPrompt = '';
  
  switch (documentType) {
    case 'jurisprudencia':
      systemPrompt = 'Eres un asistente legal especializado en analizar jurisprudencia. Proporciona un análisis completo que incluya: resumen del caso, hechos relevantes, fundamentos jurídicos, decisión y su relevancia o precedente.';
      break;
    case 'ley':
      systemPrompt = 'Eres un asistente legal especializado en analizar leyes y normativas. Proporciona un análisis completo que incluya: resumen de la normativa, ámbito de aplicación, disposiciones clave, obligaciones y derechos establecidos, y posibles implicaciones prácticas.';
      break;
    case 'contrato':
      systemPrompt = 'Eres un asistente legal especializado en analizar contratos. Proporciona un análisis completo que incluya: tipo de contrato, partes involucradas, obligaciones principales, cláusulas relevantes, posibles riesgos o ambigüedades, y recomendaciones.';
      break;
    case 'demanda':
      systemPrompt = 'Eres un asistente legal especializado en analizar demandas. Proporciona un análisis completo que incluya: partes involucradas, pretensiones, fundamentos de hecho y de derecho, posibles fortalezas y debilidades, y estrategias de defensa o respuesta.';
      break;
    default:
      systemPrompt = 'Eres un asistente legal especializado. Proporciona un análisis completo del documento legal presentado.';
  }

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Analiza detalladamente el siguiente documento legal de tipo ${documentType}:\n\n${truncatedText}`
    }
  ];

  try {
    return await generateCompletion(messages);
  } catch (error) {
    console.error('Error al analizar el documento:', error);
    throw new Error('No se pudo analizar el documento. Por favor, intenta de nuevo.');
  }
}

/**
 * Genera embeddings para un texto utilizando Perplexity
 * @param {string} text - El texto para generar embeddings
 * @returns {Promise<number[]|null>} - Vector de embedding o null si hay error
 */
export async function generateEmbedding(text) {
  console.warn('La generación de embeddings con Perplexity no está implementada en esta versión.');
  return null;
} 