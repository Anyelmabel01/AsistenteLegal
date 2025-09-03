interface PerplexityOptions {
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateCompletion(
  prompt: string, 
  options: PerplexityOptions = {}
): Promise<string> {
  const {
    modelName = 'llama-3.1-sonar-small-128k-online',
    maxTokens = 1000,
    temperature = 0.7
  } = options;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  const baseUrl = process.env.PERPLEXITY_API_BASE_URL || 'https://api.perplexity.ai';

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY no está configurada');
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal especializado en derecho panameño. Proporciona análisis jurídicos precisos, claros y bien estructurados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status} - ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No se recibió respuesta del modelo');
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error en generateCompletion:', error);
    throw new Error(`Error al generar respuesta: ${error.message}`);
  }
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  // Por ahora, retornamos null ya que Perplexity no ofrece embeddings
  // En el futuro, esto podría implementarse con otro servicio
  console.warn('generateEmbedding no está implementado con Perplexity');
  return null;
}

export async function generateWebSearchCompletion(
  query: string, 
  options: PerplexityOptions & { 
    systemPrompt?: string; 
    attachedPdfText?: string; 
    hasPDF?: boolean; 
  } = {}
): Promise<{ content: string; sources: any[] }> {
  const {
    modelName = 'llama-3.1-sonar-small-128k-online',
    systemPrompt = 'Eres un asistente legal especializado en derecho panameño. Proporciona análisis jurídicos precisos, claros y bien estructurados.',
    attachedPdfText,
    hasPDF
  } = options;

  let userContent = query;
  
  // Si hay texto de PDF, agregarlo al contexto
  if (hasPDF && attachedPdfText && typeof attachedPdfText === 'string' && attachedPdfText.trim().length > 0) {
    userContent = `Contexto del Documento PDF Adjunto:
---
${attachedPdfText}
---

Consulta del Usuario:
${query}`;
  }

  try {
    const response = await fetch('/api/perplexity-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: userContent,
        model: modelName,
        systemPrompt,
        attachedPdfText,
        hasPDF
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor proxy.' }));
      throw new Error(errorData.error || `Error ${response.status} desde el servidor proxy.`);
    }

    const data = await response.json();
    
    if (!data || typeof data.content !== 'string' || !Array.isArray(data.sources)) {
      throw new Error('Respuesta inválida recibida del servidor.');
    }
    
    return data;

  } catch (error: any) {
    console.error('Error en generateWebSearchCompletion:', error);
    
    // Fallback a generateCompletion normal
    try {
      const fallbackContent = await generateCompletion(userContent, options);
      return {
        content: fallbackContent + '\n\n*Nota: Esta respuesta se generó sin acceso a búsqueda web en tiempo real.*',
        sources: []
      };
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      throw new Error('No se pudo generar una respuesta. Por favor, intenta de nuevo.');
    }
  }
}

export async function analyzeDocument(
  documentText: string, 
  documentType: string
): Promise<string> {
  // Limitar el texto si es demasiado largo
  const maxLength = 25000;
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

  try {
    const content = await generateCompletion(
      `Analiza detalladamente el siguiente documento legal de tipo ${documentType}:\n\n${truncatedText}`,
      {
        modelName: 'llama-3.1-sonar-small-128k-online',
        temperature: 0.3
      }
    );
    
    return content;
  } catch (error: any) {
    console.error('Error al analizar el documento:', error);
    throw new Error('No se pudo analizar el documento. Por favor, intenta de nuevo.');
  }
}