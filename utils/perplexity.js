/**
 * Cliente básico para la API de Perplexity AI usando fetch
 */

// Constantes de configuración
const API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '';
const API_BASE_URL = 'https://api.perplexity.ai';

/**
 * Genera una respuesta usando el modelo de Perplexity
 * @param {Array} messages - Los mensajes en formato ChatGPT [{role: 'user', content: 'Hola'}, ...]
 * @param {Object} options - Opciones adicionales (modelo, temperatura, etc)
 * @returns {Promise<string>} La respuesta generada
 */
export async function generateCompletion(messages, options = {}) {
  try {
    // Opciones con valores por defecto
    const { 
      model = 'sonar-pro',
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = null 
    } = options;
    
    // Asegurarse de que los roles se alternen correctamente
    let validatedMessages = [];
    
    // Agregar mensaje del sistema si está presente
    if (systemPrompt) {
      validatedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      // Extraer mensajes de sistema existentes
      const systemMessages = messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        validatedMessages.push(...systemMessages);
      }
    }
    
    // Filtrar mensajes que no sean del sistema
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Asegurar alternancia de mensajes
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
      if (msg.role !== expectedRole && validatedMessages.length > (systemPrompt ? 1 : 0)) {
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
        model: model,
        messages: validatedMessages,
        temperature: temperature,
        max_tokens: maxTokens,
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
 * Genera una respuesta usando búsqueda web en tiempo real
 * @param {string} query - La consulta del usuario
 * @param {Object} options - Opciones adicionales como modelo, systemPrompt, etc.
 * @returns {Promise<{content: string, sources: Array}>} Respuesta y fuentes
 */
export async function generateWebSearchCompletion(query, options = {}) {
  try {
    const { 
      model = 'sonar-pro', 
      systemPrompt = 'Eres un asistente legal especializado. Proporciona respuestas precisas basadas en información actualizada.',
      maxTokens = 2000,
      temperature = 0.7
    } = options;
    
    // API para búsqueda web con Perplexity
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        focus: 'law', // Enfoque en información legal
        model: model,
        system_prompt: systemPrompt,
        max_tokens: maxTokens,
        temperature: temperature,
        include_citation_sources: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error en la API de búsqueda: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Procesar fuentes para formato más usable
    const sources = data.citations || [];
    const formattedSources = sources.map(source => ({
      title: source.title || 'Fuente sin título',
      url: source.url || '',
      snippet: source.snippet || '',
      search_date: new Date().toISOString()
    }));
    
    // Si no hay respuesta válida
    if (!data.answer || typeof data.answer !== 'string') {
      throw new Error('La API de Perplexity no devolvió una respuesta válida');
    }
    
    return {
      content: data.answer,
      sources: formattedSources
    };
  } catch (error) {
    console.error('Error en búsqueda web con Perplexity:', error);
    // Si falla la búsqueda, intentar con el método estándar sin web
    try {
      const fallbackContent = await generateCompletion([
        { role: 'system', content: 'Eres un asistente legal, responde con la información que tienes disponible. Indica cuando no estés seguro de algo.' },
        { role: 'user', content: `No pudimos realizar la búsqueda en tiempo real, pero intentaré responder: ${query}` }
      ], { model: options.model || 'sonar-pro' });
      
      return {
        content: fallbackContent + '\n\n*Nota: Esta respuesta se generó sin acceso a búsqueda web en tiempo real.*',
        sources: []
      };
    } catch (fallbackError) {
      throw new Error('No se pudo generar una respuesta. Por favor, intenta de nuevo.');
    }
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
    return await generateCompletion(messages, {
      model: 'sonar-pro', // Mejor modelo para análisis legal
      temperature: 0.3 // Temperatura baja para respuestas más precisas
    });
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
  try {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'embed-english',
        input: text
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error en la API: ${response.status}`);
    }

    const data = await response.json();
    
    // Validar la estructura de la respuesta
    if (data && data.data && data.data.length > 0 && data.data[0].embedding) {
      return data.data[0].embedding;
    } else {
      throw new Error('Estructura de respuesta de embeddings inesperada');
    }
  } catch (error) {
    console.error('Error al generar embedding con Perplexity:', error);
    return null;
  }
} 