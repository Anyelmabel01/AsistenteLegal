/**
 * Cliente básico para la API de Perplexity AI usando fetch
 */

// utils/perplexity.js
// import { streamText } from 'ai';
// import { perplexity } from '../src/lib/perplexity'; // Ajusta la ruta según tu estructura
const API_KEY = process.env.PERPLEXITY_API_KEY || ''; // Clave API (solo servidor)
const API_BASE_URL = process.env.PERPLEXITY_API_BASE_URL || 'https://api.perplexity.ai';

// Prompt del sistema predeterminado para el asistente legal
const DEFAULT_SYSTEM_PROMPT = `Eres un asistente legal inteligente con conocimientos profundos en derecho panameño. Tu tarea es analizar documentos legales, responder preguntas complejas y redactar textos jurídicos con razonamiento lógico y fundamentado.

INSTRUCCIONES GENERALES:
1. Analiza los textos/documentos legales que te presenten con detalle y precisión.
2. Responde con un análisis detallado, explicando las bases legales, posibles interpretaciones y riesgos.
3. Si te piden redactar un documento, hazlo con precisión jurídica, claridad y estilo formal.
4. Adopta el rol de un abogado experto que asesora a un cliente, anticipando posibles dudas y ofreciendo recomendaciones.
5. Usa terminología legal específica y evita respuestas genéricas o superficiales.
6. Si la pregunta es ambigua, pide aclaraciones antes de responder.
7. Proporciona ejemplos o referencias legales cuando sea posible.
8. Prioriza el razonamiento deductivo para interpretar leyes y el razonamiento analógico para aplicar precedentes.

METODOLOGÍA PARA ANALIZAR CASOS:
Cuando recibas un caso o consulta, sigue estos pasos:
1. Identifica y resume los hechos relevantes del caso, destacando la información clave.
2. Determina el problema o conflicto jurídico principal, y si existen problemas secundarios, también identifícalos.
3. Aplica las normas legales, principios y jurisprudencia pertinentes para analizar el caso.
4. Evalúa las posibles alternativas o soluciones, señalando ventajas, desventajas y riesgos de cada una.
5. Propón la solución más adecuada, explicando claramente el fundamento legal y práctico.
6. Redacta las respuestas con claridad, precisión jurídica y un lenguaje formal, como lo haría un abogado asesor.
7. Incluye referencias legales, artículos de ley o precedentes relevantes para fundamentar el análisis.`;

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
      } else {
        // Si no hay mensaje de sistema, usar el predeterminado
        validatedMessages.push({
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT
        });
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
 * Genera una respuesta usando búsqueda web en tiempo real a través del backend proxy
 * @param {string} query - La consulta del usuario
 * @param {Object} options - Opciones adicionales como modelo, systemPrompt, etc.
 * @returns {Promise<{content: string, sources: Array}>} Respuesta y fuentes
 */
export async function generateWebSearchCompletion(query, options = {}) {
  try {
    const { 
      model = 'sonar',
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      attachedPdfText = null,
      hasPDF = false
    } = options;
    
    // Log para depuración mejorado
    console.log('[utils/perplexity] generateWebSearchCompletion recibió:', {
      queryLength: query?.length || 0,
      model,
      hasPDF: Boolean(hasPDF),
      attachedPdfTextPresente: attachedPdfText !== null && attachedPdfText !== undefined,
      attachedPdfTextTipo: typeof attachedPdfText,
      attachedPdfTextLongitud: typeof attachedPdfText === 'string' ? attachedPdfText.length : 0,
      attachedPdfTextEjemplo: typeof attachedPdfText === 'string' && attachedPdfText.length > 0 
        ? `${attachedPdfText.substring(0, 50)}...` 
        : 'no disponible',
      optionsKeys: Object.keys(options)
    });
    
    // Validar formato del texto del PDF
    let validPdfText = typeof attachedPdfText === 'string' && attachedPdfText.trim().length > 0 
      ? attachedPdfText 
      : null;
    
    // Si el texto del PDF es muy grande, reducirlo para evitar problemas de transmisión
    // (Una limitación habitual para payloads JSON es alrededor de 4-10MB)
    const MAX_PDF_TEXT_LENGTH = 500000; // Aproximadamente 500KB de texto
    
    if (validPdfText && validPdfText.length > MAX_PDF_TEXT_LENGTH) {
      console.warn(`[utils/perplexity] ⚠️ El texto del PDF es muy grande (${validPdfText.length} caracteres), se reducirá`);
      
      // Extraer los primeros y últimos párrafos para mantener contexto
      const paragraphs = validPdfText.split('\n\n');
      const firstParagraphs = paragraphs.slice(0, 50).join('\n\n');
      const lastParagraphs = paragraphs.slice(-50).join('\n\n');
      
      validPdfText = `${firstParagraphs}\n\n[...El documento es demasiado extenso (${validPdfText.length} caracteres). 
Se han extraído las partes más relevantes...]\n\n${lastParagraphs}`;
      
      console.log(`[utils/perplexity] 📄 Texto del PDF reducido a ${validPdfText.length} caracteres`);
    }
    
    // Establecer la bandera hasPDF basada en si hay texto válido
    const validHasPdf = validPdfText !== null;
    
    // Siempre incluir estos campos en la solicitud, incluso si son null
    const requestBody = {
      query: query,
      model: model,
      systemPrompt: systemPrompt,
      attachedPdfText: validPdfText,
      hasPDF: validHasPdf
    };
    
    // Log de confirmación si hay texto de PDF válido
    if (validPdfText) {
      console.log('[utils/perplexity] Incluyendo texto de PDF en la solicitud ✅', { 
        longitud: validPdfText.length,
        primerosCaracteres: validPdfText.substring(0, 100) + '...',
        hasPDF: validHasPdf
      });
    }
    
    // Verificar las claves en el cuerpo de la solicitud
    console.log('[utils/perplexity] Claves en el cuerpo de la solicitud:', Object.keys(requestBody));
    
    // Log completo para depuración 
    console.log('[utils/perplexity] 📨 ENVIANDO BODY COMPLETO:', JSON.stringify({
      queryLength: query?.length || 0,
      modelType: typeof model,
      systemPromptLength: systemPrompt?.length || 0,
      attachedPdfTextLength: validPdfText?.length || 0,
      hasPDF: validHasPdf,
      bodyKeys: Object.keys(requestBody),
      pdfSample: validPdfText ? validPdfText.substring(0, 100) + '...' : null
    }));
    
    // Llamar a nuestra ruta API de backend con fetch
    const response = await fetch('/api/perplexity-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      // Intentar obtener un mensaje de error más específico del backend
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor proxy.' }));
      throw new Error(errorData.error || `Error ${response.status} desde el servidor proxy.`);
    }
    
    // El backend ya debería devolver la estructura { content: string, sources: Array }
    const data = await response.json();
    
    // Validar la respuesta del backend
    if (!data || typeof data.content !== 'string' || !Array.isArray(data.sources)) {
       console.error('Respuesta inesperada del backend proxy:', data);
       throw new Error('Respuesta inválida recibida del servidor.');
    }
    
    return data; // Devolver directamente la respuesta del backend

  } catch (error) {
    console.error('Error en generateWebSearchCompletion (llamada a proxy):', error);
    // Mantener el fallback si la llamada al proxy falla
    try {
      const fallbackContent = await generateCompletion([
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        { role: 'user', content: `No pudimos realizar la búsqueda en tiempo real, pero intentaré responder con un razonamiento jurídico detallado: ${query}` }
      ], { model: options.model || 'sonar-pro' });
      
      return {
        content: fallbackContent + '\n\n*Nota: Esta respuesta se generó sin acceso a búsqueda web en tiempo real.*',
        sources: []
      };
    } catch (fallbackError) {
      console.error('Error en fallback de generateWebSearchCompletion:', fallbackError);
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
      systemPrompt = 'Eres un asistente legal especializado en analizar jurisprudencia. Proporciona un análisis completo que incluya: resumen del caso, hechos relevantes, fundamentos jurídicos, decisión y su relevancia o precedente. Explica detalladamente tu razonamiento y cómo los distintos elementos legales se conectan entre sí. Presenta argumentos lógicos y cita la normativa relevante.';
      break;
    case 'ley':
      systemPrompt = 'Eres un asistente legal especializado en analizar leyes y normativas. Proporciona un análisis completo que incluya: resumen de la normativa, ámbito de aplicación, disposiciones clave, obligaciones y derechos establecidos, y posibles implicaciones prácticas. Desarrolla un razonamiento jurídico paso a paso, explicando la intención del legislador y cómo se relaciona con el ordenamiento jurídico.';
      break;
    case 'contrato':
      systemPrompt = 'Eres un asistente legal especializado en analizar contratos. Proporciona un análisis completo que incluya: tipo de contrato, partes involucradas, obligaciones principales, cláusulas relevantes, posibles riesgos o ambigüedades, y recomendaciones. Detalla el razonamiento jurídico detrás de cada punto, explicando las implicaciones legales y cómo se relacionan con la normativa aplicable.';
      break;
    case 'demanda':
      systemPrompt = 'Eres un asistente legal especializado en analizar demandas. Proporciona un análisis completo que incluya: partes involucradas, pretensiones, fundamentos de hecho y de derecho, posibles fortalezas y debilidades, y estrategias de defensa o respuesta. Desarrolla un razonamiento jurídico detallado que explique la viabilidad de la demanda y cite jurisprudencia relacionada.';
      break;
    default:
      systemPrompt = 'Eres un asistente legal especializado. Proporciona un análisis completo del documento legal presentado con un razonamiento jurídico detallado, citando leyes y jurisprudencia relevante. Explica las implicaciones legales y ofrece diferentes perspectivas cuando sea apropiado.';
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