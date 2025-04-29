// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import OpenAI from 'https://deno.land/x/openai@v4.52.7/mod.ts';

console.log("Generate Answer Function Initialized");

// Configuración de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Initialize Perplexity client
const perplexityClient = new OpenAI({
  baseURL: 'https://api.perplexity.ai',
  apiKey: Deno.env.get('PERPLEXITY_API_KEY'),
});

// Define the structure for the context items (matching SearchResult from frontend)
interface ContextItem {
    id: number;
    document_id: string;
    content: string;
    similarity: number;
}

serve(async (req: Request) => {
  // Check for POST method and authorization header
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let supabaseClient: SupabaseClient; // Client might be needed for future enhancements (e.g., logging)
  try {
    // @ts-ignore
    supabaseClient = createClient(
      // @ts-ignore
      supabaseUrl,
      // @ts-ignore
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );
  } catch (err: any) {
     console.error('Error initializing Supabase client:', err);
     // Depending on use case, we might continue without a client if only Perplexity is needed
     // return new Response(JSON.stringify({ error: 'Failed to initialize Supabase client' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { query, context } = await req.json();

    if (!query || typeof query !== 'string') {
      throw new Error('Missing or invalid "query" in request body');
    }
    if (!context || !Array.isArray(context) || context.length === 0) {
        throw new Error('Missing or invalid "context" (retrieved documents) in request body');
    }

    console.log(`Received query: "${query.substring(0, 50)}..." with ${context.length} context items.`);

    // 1. Construct the prompt for the LLM
    // Combine the user's query with the retrieved context
    const contextText = context.map((item: ContextItem) => `- ${item.content.replace(/\n/g, ' ')}`).join('\n');

    const systemPrompt = `Eres un asistente legal experto en la legislación panameña. Responde la pregunta del usuario basándote ÚNICAMENTE en el contexto proporcionado. Si la respuesta no se encuentra en el contexto, indica que no tienes información suficiente en los documentos proporcionados para responder. No inventes información. Sé conciso y directo. Contexto:
${contextText}

Pregunta: ${query}`;

    console.log("Sending request to Perplexity Chat Completions...");

    // 2. Call Perplexity API (Chat Completions)
    try {
      const response = await perplexityClient.chat.completions.create({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Perplexity API did not return a valid response.');
      }

      console.log("Received answer from Perplexity.");
      return new Response(JSON.stringify({ response: response.choices[0].message.content }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (llmError: any) {
      console.error('Error calling Perplexity Chat Completions:', llmError);
      return new Response(JSON.stringify({ error: 'Error al generar respuesta', details: llmError.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
})

/* To invoke locally:

  1. Run `supabase start`
  2. Make an HTTP request (ensure context items match SearchResult structure):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-answer' \
    --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{
      "query": "¿Cuál es la pena por robo en Panamá?",
      "context": [
        {"id": 1, "document_id": "uuid-abc", "content": "El Código Penal de Panamá establece que el hurto simple...", "similarity": 0.88},
        {"id": 5, "document_id": "uuid-def", "content": "...la sanción por robo agravado puede ser de 5 a 10 años...", "similarity": 0.85}
      ]
    }'

*/ 