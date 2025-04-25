// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import OpenAI from 'https://deno.land/x/openai@v4.52.7/mod.ts';

console.log("Search Documents Function Initialized");

// Initialize OpenAI client
const openai = new OpenAI({
  // @ts-ignore
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// --- Constants --- (Adjust as needed)
const MATCH_THRESHOLD = 0.75; // Minimum similarity score
const MATCH_COUNT = 5;      // Max number of matching documents to return

serve(async (req: Request) => {
  // Check for POST method and authorization header
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let supabaseClient: SupabaseClient;
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
     return new Response(JSON.stringify({ error: 'Failed to initialize Supabase client' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      throw new Error('Missing or invalid "query" in request body');
    }
    console.log(`Received query: "${query.substring(0, 50)}..."`);

    // 1. Generate embedding for the user query
    console.log('Generating embedding for query...');
    let queryEmbedding: number[];
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query.replace(/\n/g, ' '),
      });
      if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
          throw new Error('OpenAI API did not return a valid embedding.');
      }
      queryEmbedding = response.data[0].embedding;
      console.log(`Generated query embedding (length: ${queryEmbedding.length})`);
    } catch (embeddingError) {
        console.error('Error generating query embedding:', embeddingError);
        throw new Error(`Failed to generate embedding for query: ${embeddingError.message}`);
    }

    // 2. Call the database function to find matching documents
    console.log('Calling match_documents function...');
    const { data: documents, error: matchError } = await supabaseClient.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
    });

    if (matchError) {
        console.error('Error calling match_documents:', matchError);
        throw new Error(`Database search failed: ${matchError.message}`);
    }

    console.log(`Found ${documents ? documents.length : 0} matching documents.`);

    // 3. Return the matching documents
    return new Response(JSON.stringify({ documents }), {
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
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search-documents' \
    --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"query":"tu pregunta aquí"}'

*/ 