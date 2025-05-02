import { NextRequest, NextResponse } from 'next/server';

// Asegúrate de tener tu clave API de Perplexity en las variables de entorno
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export async function POST(req: NextRequest) {
  // Configurar cabeceras CORS para permitir solicitudes desde localhost
  const response = NextResponse.next();
  const origin = req.headers.get('origin') || '';
  
  const headers = {
    'Access-Control-Allow-Origin': origin, // Permitir solicitudes desde el origen de la solicitud
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!PERPLEXITY_API_KEY) {
    console.error('Error: PERPLEXITY_API_KEY no está configurada en las variables de entorno del servidor.');
    return NextResponse.json(
      { error: 'Error de configuración del servidor: La clave API no está disponible.' },
      { status: 500, headers }
    );
  }

  try {
    // 1. Obtener la consulta del cuerpo de la solicitud del cliente
    const { query, model = 'sonar', systemPrompt } = await req.json();
    // --- DEBUG LOG --- 
    console.log('Recibido en /api/perplexity-search:', { query, model, systemPrompt }); // Log de lo recibido
    // --- FIN DEBUG LOG ---

    if (!query) {
      // --- DEBUG LOG --- 
      console.error('Error: La consulta (query) es requerida. Query recibida:', query); // Log específico del error
      // --- FIN DEBUG LOG ---
      return NextResponse.json({ error: 'La consulta (query) es requerida.' }, { status: 400, headers });
    }

    // 2. Preparar y realizar la llamada a la API de Perplexity desde el servidor
    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt || 'Eres un asistente legal especializado. Proporciona respuestas precisas basadas en información actualizada.'
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    };

    console.log('Enviando solicitud a Perplexity API con payload:', JSON.stringify(payload).substring(0, 200) + '...');

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // 3. Manejar la respuesta de Perplexity
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error desde la API de Perplexity (${response.status}): ${errorText}`);
      // Devolver un error genérico o el error específico si es seguro hacerlo
      return NextResponse.json(
        { error: `Error al contactar el servicio de búsqueda (${response.status})` },
        { status: response.status, headers }
      );
    }

    const data = await response.json();
    console.log('Respuesta de Perplexity:', JSON.stringify(data).substring(0, 200) + '...');

    // 4. Extraer la respuesta del asistente
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
       console.error('Respuesta inesperada de Perplexity:', data);
       return NextResponse.json({ error: 'Respuesta inesperada del servicio de búsqueda.' }, { status: 500, headers });
    }

    // 5. Devolver la respuesta estructurada
    return NextResponse.json({ 
      content: assistantMessage, 
      sources: data.choices?.[0]?.message?.tool_calls || [] 
    }, { headers });

  } catch (error) {
    console.error('Error interno en la ruta API /api/perplexity-search:', error);
    // Asegurarse de no filtrar información sensible en el error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500, headers });
  }
}

// Manejador OPTIONS para las solicitudes preflight de CORS
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 