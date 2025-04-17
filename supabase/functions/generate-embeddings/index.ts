// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.52.7/mod.ts';

console.log("Hello from Functions!")

// Utility function for splitting text (simple example)
function splitTextIntoChunks(text: string, chunkSize = 1000, chunkOverlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - chunkOverlap; // Move index forward with overlap
    if (i >= text.length) break; // Avoid infinite loop on short texts
     // Ensure next chunk starts correctly after overlap, prevent going past end
    if (i + chunkSize > text.length && i < text.length) {
        i = Math.max(0, text.length - chunkSize); // Adjust start for the last chunk if overlap causes issues
    }

  }
   // Handle edge case where the loop might exit slightly before the very end with overlap logic
   if (chunks.length > 0 && text.length > (i - (chunkSize - chunkOverlap))) {
     const lastChunkStartIndex = Math.max(0, text.length - chunkSize);
     if (text.slice(lastChunkStartIndex) !== chunks[chunks.length -1]) { // Avoid duplicate last chunk
        chunks.push(text.slice(lastChunkStartIndex));
     }
   }
  return chunks.filter(chunk => chunk.trim() !== ''); // Remove empty chunks
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

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
    // Create Supabase client with user's auth token
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
  } catch (error) {
     console.error('Error creating Supabase client:', error);
     return new Response(JSON.stringify({ error: 'Failed to initialize Supabase client' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { document_id } = await req.json();
    if (!document_id) {
      throw new Error('Missing document_id in request body');
    }

    console.log(`Processing document_id: ${document_id}`);

    // 1. Fetch document metadata (implicitly checks ownership via RLS)
    const { data: docData, error: docError } = await supabaseClient
      .from('documents')
      .select('id, file_path, user_id') // Select user_id for logging/potential checks
      .eq('id', document_id)
      .single();

    if (docError) {
      console.error('Error fetching document:', docError);
      throw new Error(`Document not found or access denied: ${docError.message}`);
    }
    if (!docData) {
        throw new Error('Document data is null after fetch.');
    }

    console.log(`Document found: ${docData.id}, Path: ${docData.file_path}`);

    // 2. *** PLACEHOLDER: Fetch PDF from Storage and Extract Text ***
    // This part needs implementation using a Deno-compatible PDF library
    // Example: Download file content
    // const { data: fileData, error: downloadError } = await supabaseClient.storage
    //   .from('legal_documents')
    //   .download(docData.file_path);
    // if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);
    // const fileContent = await fileData.arrayBuffer();
    // --- Add PDF parsing logic here --- 
    // const documentText = parsePdf(fileContent); // Replace with actual parsing

    // Using placeholder text for now
    const documentText = "Este es un texto de ejemplo largo para el documento PDF que necesita ser procesado y dividido en múltiples trozos para generar embeddings. La Constitución de Panamá establece la estructura del gobierno. El Código Penal define los delitos y las penas. La jurisprudencia interpreta las leyes en casos específicos. Este asistente usará RAG para buscar en estos textos. Segundo trozo de ejemplo: El proceso de RAG implica buscar documentos relevantes y luego usar un LLM para generar una respuesta basada en esos documentos y la pregunta original. Tercer trozo: La búsqueda semántica usa vectores de embeddings para encontrar texto con significado similar, no solo coincidencias exactas de palabras.";
    console.log('Using placeholder text for processing.');

    // --- Update the document with extracted text (optional, if needed elsewhere) ---
    // await supabaseClient.from('documents').update({ extracted_text: documentText, status: 'processing_text' }).eq('id', document_id);

    // 3. Split text into chunks
    const chunks = splitTextIntoChunks(documentText); // Use default chunk size
    if (chunks.length === 0) {
        throw new Error('No text chunks generated from the document.');
    }
    console.log(`Split document into ${chunks.length} chunks.`);

    // 4. Generate embeddings for each chunk
    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002', // Or use a newer/different model if preferred
          input: chunk,
        });
        if (response.data && response.data.length > 0) {
             embeddings.push({
                document_id: document_id,
                content: chunk,
                embedding: response.data[0].embedding,
             });
        } else {
             console.warn('OpenAI API did not return embedding for chunk:', chunk.substring(0, 50) + '...');
        }
      } catch (embeddingError) {
         console.error('Error getting embedding for chunk:', chunk.substring(0, 50) + '...', embeddingError);
         // Decide: stop processing? skip chunk? For now, we skip.
      }
    }

    if (embeddings.length === 0) {
        throw new Error('Failed to generate any embeddings for the document chunks.');
    }
    console.log(`Generated ${embeddings.length} embeddings.`);

    // 5. Insert embeddings into the database
    // Use service role client ONLY IF necessary for bypassing RLS on this internal table,
    // otherwise, continue with user client if RLS allows insertion.
    // Assuming RLS allows user to insert embeddings for their own docs:
    const { error: insertEmbeddingsError } = await supabaseClient
      .from('document_embeddings')
      .insert(embeddings); // Batch insert

    if (insertEmbeddingsError) {
      console.error('Error inserting embeddings:', insertEmbeddingsError);
      throw new Error(`Failed to store embeddings: ${insertEmbeddingsError.message}`);
    }
    console.log(`Successfully inserted ${embeddings.length} embeddings.`);

    // 6. Update document status to 'processed'
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', document_id);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      // Log error but don't necessarily fail the whole process if embeddings were saved
    }
    console.log(`Updated document status to processed for: ${document_id}`);

    return new Response(JSON.stringify({ message: `Successfully processed document ${document_id} and generated ${embeddings.length} embeddings.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    // Attempt to update document status to 'error' if document_id was retrieved
    try {
        const body = await req.json(); // Re-parse to get ID for error update
        if (body.document_id && supabaseClient) {
            await supabaseClient.from('documents').update({ status: 'error' }).eq('id', body.document_id);
        }
    } catch (updateErr) {
        console.error('Failed to update document status to error:', updateErr);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-embeddings' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
