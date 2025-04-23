// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import OpenAI from 'https://deno.land/x/openai@v4.52.7/mod.ts';

console.log("Generate Answer Function Initialized");

// Initialize OpenAI client
const openai = new OpenAI({
  // @ts-ignore
  apiKey: Deno.env.get('OPENAI_API_KEY'),
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
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
  } catch (error) {
     console.error('Error creating Supabase client:', error);
     // Depending on use case, we might continue without a client if only OpenAI is needed
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

    const systemPrompt = `Eres un asistente legal experto en la legislación panameña. Responde la pregunta del usuario basándote ÚNICAMENTE en el contexto proporcionado. Si la respuesta no se encuentra en el contexto, indica que no tienes información suficiente en los documentos proporcionados para responder. No inventes información. Sé conciso y directo. Contexto:`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Contexto:
${contextText}

Pregunta: ${query}` }
    ];

    console.log("Sending request to OpenAI Chat Completions...");

    // 2. Call OpenAI API (Chat Completions)
    let generatedAnswer = '';
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Or use 'gpt-4' if available/preferred
        messages: messages,
        temperature: 0.2, // Lower temperature for more factual answers
        max_tokens: 500, // Adjust as needed
      });

      if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
        throw new Error('OpenAI API did not return a valid response.');
      }
      generatedAnswer = response.choices[0].message.content.trim();
      console.log("Received answer from OpenAI.");

    } catch (llmError) {
        console.error('Error calling OpenAI Chat Completions:', llmError);
        throw new Error(`Failed to generate answer using LLM: ${llmError.message}`);
    }

    // 3. Return the generated answer
    return new Response(JSON.stringify({ answer: generatedAnswer }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
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