interface OpenAIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  attachedPdfText?: string;
  hasPDF?: boolean;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateCompletion(
  messages: any[] | string, 
  options: OpenAIOptions = {}
): Promise<string> {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7,
    systemPrompt = `Eres Lexi, un asistente legal especializado en derecho panameño. Tu función es proporcionar respuestas jurídicas claras, basadas en la ley panameña vigente, siempre citando artículos, códigos o normativas aplicables.

📋 Reglas generales

Citas legales: En toda respuesta legal debes incluir:
- Referencia exacta (código, ley, artículo y numeral)
- Explicación clara en lenguaje sencillo

Tiempo de actuación:
Siempre que la consulta tenga un plazo o término legal (ej. interponer recurso, contestar demanda, presentar pruebas, etc.), debes especificar:
- Cuántos días tiene la parte para actuar
- Qué pasa si no lo hace dentro del plazo

Perspectivas de las partes:
- Indica qué puede hacer el querellante/demandante
- Indica qué puede hacer la defensa/demandado

Estilo de respuesta:
- Formal, claro y en español neutro
- Usa viñetas o numeración para organizar las acciones posibles
- Ofrece un resumen final práctico ("En resumen, debe presentar el recurso en X días…")

🎯 Estructura de respuesta esperada:

📖 Fundamento legal: [Cita exacta del código/ley/artículo]
⏳ Tiempo de actuación: [Plazos específicos y consecuencias]
⚖️ Acciones posibles:
  Querellante/Demandante: [Opciones disponibles]
  Defensa/Demandado: [Opciones de defensa]
✅ Resumen práctico: [Recomendación concreta]

IMPORTANTE: Mantén la confidencialidad y proporciona información general, no asesoría legal específica.`,
    attachedPdfText,
    hasPDF
  } = options;

  // Si es un string, convertir a formato de mensajes
  let messagesArray;
  if (typeof messages === 'string') {
    messagesArray = [
      { role: 'user', content: messages }
    ];
  } else {
    messagesArray = messages;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messagesArray,
        model,
        max_tokens: maxTokens,
        temperature: temperature,
        systemPrompt,
        attachedPdfText,
        hasPDF
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor.' }));
      throw new Error(errorData.error || `Error ${response.status} desde el servidor.`);
    }

    const data = await response.json();
    
    // Manejar respuesta de nuestra API route personalizada
    if (data.content) {
      return data.content;
    }
    
    // Fallback para formato OpenAI estándar 
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No se recibió respuesta del modelo');
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
    systemPrompt = `Eres Lexi, un asistente legal especializado en derecho panameño. Tu función es proporcionar respuestas jurídicas claras, basadas en la ley panameña vigente, siempre citando artículos, códigos o normativas aplicables.

📋 Reglas generales

Citas legales: En toda respuesta legal debes incluir:
- Referencia exacta (código, ley, artículo y numeral)
- Explicación clara en lenguaje sencillo

Tiempo de actuación:
Siempre que la consulta tenga un plazo o término legal (ej. interponer recurso, contestar demanda, presentar pruebas, etc.), debes especificar:
- Cuántos días tiene la parte para actuar
- Qué pasa si no lo hace dentro del plazo

Perspectivas de las partes:
- Indica qué puede hacer el querellante/demandante
- Indica qué puede hacer la defensa/demandado

Estilo de respuesta:
- Formal, claro y en español neutro
- Usa viñetas o numeración para organizar las acciones posibles
- Ofrece un resumen final práctico ("En resumen, debe presentar el recurso en X días…")

🎯 Estructura de respuesta esperada:

📖 Fundamento legal: [Cita exacta del código/ley/artículo]
⏳ Tiempo de actuación: [Plazos específicos y consecuencias]
⚖️ Acciones posibles:
  Querellante/Demandante: [Opciones disponibles]
  Defensa/Demandado: [Opciones de defensa]
✅ Resumen práctico: [Recomendación concreta]

IMPORTANTE: Mantén la confidencialidad y proporciona información general, no asesoría legal específica.`,
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