import { generateText } from 'ai';
import { perplexity } from '@ai-sdk/perplexity'; // Mantenemos el proveedor para generateText

// Constantes para la llamada directa a la API de embeddings
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_BASE_URL = process.env.PERPLEXITY_API_BASE_URL || 'https://api.perplexity.ai';

// Función para generar embedding usando fetch directamente
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || typeof text !== 'string' || text.trim() === '' || !PERPLEXITY_API_KEY) {
    if (!PERPLEXITY_API_KEY) console.error('Error: PERPLEXITY_API_KEY no está configurada.');
    return null;
  }

  try {
    const response = await fetch(`${PERPLEXITY_API_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Usar el modelo de embedding que tenías en utils/perplexity.js
        // Puedes ajustarlo si Perplexity tiene otros modelos ahora
        model: 'embed-english', 
        input: text.replace(/\n/g, ' '), // Reemplazar saltos de línea como medida de precaución
        encoding_format: 'float', // Asegurarse de pedir floats
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error en la API de Embeddings:', response.status, errorData);
      throw new Error(errorData.error?.message || `Error en la API de Embeddings: ${response.status}`);
    }

    const data = await response.json();
    
    // Validar la estructura de la respuesta
    if (data && data.data && data.data.length > 0 && data.data[0].embedding) {
      return data.data[0].embedding;
    } else {
      console.error('Respuesta inesperada de la API de Embeddings:', data);
      throw new Error('Estructura de respuesta de embeddings inesperada');
    }

  } catch (error: any) {
    console.error('Error al generar embedding (fetch directo):', error);
    return null;
  }
}

// Función para generar texto usando AI SDK
export async function generateCompletion(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    modelName?: string; // Añadir opción para nombre de modelo
  } = {}
): Promise<string | null> {
  if (!prompt) return null;

  const {
    maxTokens = 500,
    temperature = 0.7,
    systemPrompt,
    modelName = 'sonar-pro', // Modelo por defecto
  } = options;

  try {
    // Usar generateText de la librería 'ai'
    const { text: completionText } = await generateText({
      model: perplexity(modelName as any), // Usar el proveedor de Perplexity
      system: systemPrompt, // Pasar el system prompt aquí
      prompt: prompt,
      maxTokens: maxTokens,
      temperature: temperature,
    });

    return completionText;
  } catch (error: any) {
    console.error('Error al generar texto con AI SDK:', error);
    return null;
  }
}

// Función para analizar un documento legal con Perplexity usando AI SDK
export async function analyzeDocument(
  documentText: string,
  documentType: string
): Promise<any | null> {
  if (!documentText) return null;

  // Definir un prompt específico según el tipo de documento
  let systemPrompt = 'Eres un asistente legal especializado en derecho panameño.';
  
  if (documentType === 'jurisprudencia') {
    systemPrompt += ' Analiza esta jurisprudencia e identifica los principales elementos: tribunal, fecha, hechos relevantes, fundamentos legales, decisión y relevancia. Responde en formato JSON.';
  } else if (documentType === 'ley') {
    systemPrompt += ' Analiza esta ley e identifica su objetivo, ámbito de aplicación, definiciones clave, obligaciones, prohibiciones y sanciones relevantes. Responde en formato JSON.';
  } else {
    systemPrompt += ' Analiza este documento legal e identifica sus elementos principales, partes relevantes y posibles implicaciones. Responde en formato JSON.';
  }

  try {
    const maxLength = 8000; 
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + '... [texto truncado]' 
      : documentText;

    // Usar generateText para obtener el análisis
    const analysisText = await generateCompletion(truncatedText, {
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.3,
      modelName: 'sonar-pro', // Modelo adecuado para análisis
    });

    if (!analysisText) return null;

    try {
      // Intentar parsear como JSON, ya que lo pedimos en el prompt
      return JSON.parse(analysisText);
    } catch (parseError: any) {
      console.error('Error al parsear análisis JSON (fallback a texto):', parseError);
      // Si falla el parseo (porque el modelo no devolvió JSON válido), devolver el texto plano
      return { analysis: analysisText }; 
    }
  } catch (error: any) {
    console.error('Error al analizar documento con AI SDK:', error);
    return null;
  }
}

// Ya no necesitamos exportar la instancia del cliente
// export default perplexity; 