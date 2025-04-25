import OpenAI from 'openai';

// Inicializa el cliente OpenAI con la clave API desde variables de entorno
const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Validación básica
if (!openaiApiKey) {
  console.error('Error: Missing environment variable NEXT_PUBLIC_OPENAI_API_KEY');
}

// Crea y exporta la instancia de OpenAI
const openai = openaiApiKey 
  ? new OpenAI({ 
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true // Para permitir uso en cliente
    })
  : null;

// Log si no se pudo inicializar
if (!openai) {
  console.error('OpenAI client could not be initialized due to missing API key.');
}

/**
 * Genera embeddings para un texto utilizando el modelo text-embedding-3-small
 * @param {string} text - El texto para generar embeddings
 * @returns {Promise<number[]|null>} - Vector de embedding o null si hay error
 */
export async function generateEmbedding(text) {
  if (!openai) return null;
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

/**
 * Genera una respuesta utilizando el modelo GPT-4, aceptando historial de mensajes.
 * @param {Array<{role: string, content: string}>} messages - El historial de mensajes (ej: [{role: 'user', content: 'Hola'}, {role: 'assistant', content: 'Hola! Cómo estás?'}])
 * @param {object} options - Opciones adicionales (maxTokens, temperature)
 * @returns {Promise<string|null>} - Respuesta generada o null si hay error
 */
export async function generateCompletion(messages, options = {}) {
  if (!openai) {
      console.error('OpenAI client not initialized.');
      return null;
  }
  if (!messages || messages.length === 0) {
      console.error('No messages provided for completion.');
      return null;
  }
  
  try {
    // Asegurarse que el formato es correcto para la API
    const formattedMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));

    const response = await openai.chat.completions.create({
      model: "gpt-4", // O el modelo que prefieras (gpt-3.5-turbo, gpt-4-turbo, etc.)
      messages: formattedMessages, // Pasar el array de mensajes
      max_tokens: options.maxTokens || 500, // Ajusta según necesidad
      temperature: options.temperature || 0.7, // Ajusta según necesidad
    });
    
    // Verificar si hay una respuesta válida
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }
    console.error('Invalid response structure from OpenAI API:', response);
    return null;

  } catch (error) {
    console.error("Error generating completion:", error);
    // Podrías querer manejar diferentes tipos de errores aquí (ej: rate limits, auth)
    return null;
  }
}

export default openai; 