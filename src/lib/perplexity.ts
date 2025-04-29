import { OpenAI } from 'openai';

// Inicializar el cliente de Perplexity con la clave API
const perplexity = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
  dangerouslyAllowBrowser: true, // Para uso en cliente, en producción considera usar solo en servidor
});

// Función para generar embedding
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text) return null;

  try {
    const response = await perplexity.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    // Retornar el embedding
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error al generar embedding:', error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return null;
  }
}

// Función para generar texto usando Perplexity
export async function generateCompletion(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<string | null> {
  if (!prompt) return null;

  const { maxTokens = 500, temperature = 0.7, systemPrompt } = options;

  try {
    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ];

    console.log('Sending request to Perplexity API with config:', {
      model: 'sonar-pro',
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    });

    const completion = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: messages as any, // Type cast to avoid TypeScript issues
      max_tokens: maxTokens,
      temperature: temperature,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error al generar texto:', error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return null;
  }
}

// Función para analizar un documento legal con Perplexity
export async function analyzeDocument(
  documentText: string,
  documentType: string
): Promise<any | null> {
  if (!documentText) return null;

  // Definir un prompt específico según el tipo de documento
  let systemPrompt = 'Eres un asistente legal especializado en derecho panameño.';
  
  if (documentType === 'jurisprudencia') {
    systemPrompt += ' Analiza esta jurisprudencia e identifica los principales elementos: tribunal, fecha, hechos relevantes, fundamentos legales, decisión y relevancia.';
  } else if (documentType === 'ley') {
    systemPrompt += ' Analiza esta ley e identifica su objetivo, ámbito de aplicación, definiciones clave, obligaciones, prohibiciones y sanciones relevantes.';
  } else {
    systemPrompt += ' Analiza este documento legal e identifica sus elementos principales, partes relevantes y posibles implicaciones.';
  }

  try {
    // Limitar el texto si es muy largo
    const maxLength = 8000; // Establecer un límite razonable para evitar exceder tokens
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + '... [texto truncado]' 
      : documentText;

    const analysisText = await generateCompletion(truncatedText, {
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.3, // Temperatura baja para respuestas más precisas
    });

    if (!analysisText) return null;

    // Intentar convertir el análisis a un objeto estructurado
    try {
      // Si el texto devuelto está en formato JSON, parsearlo
      if (analysisText.trim().startsWith('{') && analysisText.trim().endsWith('}')) {
        return JSON.parse(analysisText);
      }
      
      // Si no es JSON, devolver el texto como está
      return { analysis: analysisText };
    } catch (parseError) {
      console.error('Error al parsear análisis:', parseError);
      return { analysis: analysisText };
    }
  } catch (error) {
    console.error('Error al analizar documento:', error);
    return null;
  }
}

export default perplexity; 