interface OpenAIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateCompletion(
  prompt: string, 
  options: OpenAIOptions = {}
): Promise<string> {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7,
    systemPrompt = 'Eres un asistente legal especializado en derecho panameño. Proporciona análisis jurídicos precisos, claros y bien estructurados.'
  } = options;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor.' }));
      throw new Error(errorData.error || `Error ${response.status} desde el servidor.`);
    }

    const data: OpenAIResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No se recibió respuesta del modelo');
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error en generateCompletion:', error);
    throw new Error(`Error al generar respuesta: ${error.message}`);
  }
}

export async function generateWebSearchCompletion(
  query: string, 
  options: OpenAIOptions & { 
    systemPrompt?: string; 
    attachedPdfText?: string; 
    hasPDF?: boolean; 
  } = {}
): Promise<{ content: string; sources: any[] }> {
  const {
    model = 'gpt-3.5-turbo',
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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        model,
        attachedPdfText,
        hasPDF
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor.' }));
      throw new Error(errorData.error || `Error ${response.status} desde el servidor.`);
    }

    const data = await response.json();
    
    if (!data || typeof data.content !== 'string') {
      throw new Error('Respuesta inválida recibida del servidor.');
    }
    
    return {
      content: data.content,
      sources: data.sources || []
    };

  } catch (error: any) {
    console.error('Error en generateWebSearchCompletion:', error);
    throw new Error(`Error al contactar el servicio de chat: ${error.message}`);
  }
}

import { getPromptByContext } from './prompts';

export async function analyzeDocument(
  documentText: string, 
  documentType: string
): Promise<string> {
  // Limitar el texto si es demasiado largo
  const maxLength = 25000;
  const truncatedText = documentText.length > maxLength 
    ? documentText.substring(0, maxLength) + "... [texto truncado por longitud]" 
    : documentText;

  try {
    const content = await generateCompletion(
      `Analiza detalladamente el siguiente documento legal de tipo ${documentType}:\n\n${truncatedText}`,
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        systemPrompt: getPromptByContext('analisis-documento')
      }
    );
    
    return content;
  } catch (error: any) {
    console.error('Error al analizar el documento:', error);
    throw new Error('No se pudo analizar el documento. Por favor, intenta de nuevo.');
  }
}