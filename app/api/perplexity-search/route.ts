import { NextRequest, NextResponse } from 'next/server';

// Asegúrate de tener tu clave API de Perplexity en las variables de entorno
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/search';

export async function POST(req: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    console.error('Error: PERPLEXITY_API_KEY no está configurada en las variables de entorno del servidor.');
    return NextResponse.json(
      { error: 'Error de configuración del servidor: La clave API no está disponible.' },
      { status: 500 }
    );
  }

  try {
    // 1. Obtener la consulta del cuerpo de la solicitud del cliente
    const { query, model = 'sonar-medium-online', systemPrompt } = await req.json();

    if (!query) {
      console.error('Error: La consulta (query) es requerida.');
      return NextResponse.json({ error: 'La consulta (query) es requerida.' }, { status: 400 });
    }

    // DEBUG: Imprimir los primeros 5 caracteres de la clave API (¡Eliminar después!)
    console.log('DEBUG: Primeros 5 chars de PERPLEXITY_API_KEY:', PERPLEXITY_API_KEY?.substring(0, 5));

    // 2. Preparar y realizar la llamada a la API de Perplexity desde el servidor
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        query: query,
        // Revisar la documentación de Perplexity /search para otros parámetros relevantes
        // como system_prompt, max_tokens, etc., si los necesitas.
        // Los 'messages' no suelen usarse en la API de búsqueda.
      }),
    });

    // 3. Manejar la respuesta de Perplexity
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error desde la API de Perplexity (${response.status}): ${errorText}`);
      // Devolver un error genérico o el error específico si es seguro hacerlo
      return NextResponse.json(
        { error: `Error al contactar el servicio de búsqueda (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 4. Devolver la respuesta de Perplexity al cliente
    // Extraemos solo la parte relevante de la respuesta si es necesario
    // La API de Perplexity devuelve un array 'choices' con la respuesta del asistente
    const assistantMessage = data.choices?.[0]?.message?.content;
    // Nota: La API search de Perplexity puede no devolver 'sources' directamente en esta estructura.
    // Revisa la documentación de Perplexity para la estructura exacta de la respuesta de 'search'.
    // Si necesitas 'sources', tendrás que adaptar cómo se extraen de 'data'.
    // Por ahora, solo devolvemos el contenido principal.

    if (!assistantMessage) {
       console.error('Respuesta inesperada de Perplexity:', data);
       return NextResponse.json({ error: 'Respuesta inesperada del servicio de búsqueda.' }, { status: 500 });
    }

    // Devolvemos una estructura similar a la que esperabas antes
    return NextResponse.json({ content: assistantMessage, sources: [] }); // Placeholder para sources

  } catch (error) {
    console.error('Error interno en la ruta API /api/perplexity-search:', error);
    // Asegurarse de no filtrar información sensible en el error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 });
  }
} 