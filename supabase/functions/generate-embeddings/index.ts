// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// @ts-ignore - May show errors in some editors if Deno LSP isn't configured
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore
import { serve } from 'std/http/server.ts'
// @ts-ignore
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.4.120/build/pdf.mjs';
// @ts-ignore
import OpenAI from 'https://deno.land/x/openai@v4.52.7/mod.ts';

// IMPORTANT: Set these environment variables in your Supabase project's function settings
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
// const openaiApiKey = Deno.env.get("OPENAI_API_KEY"); // <-- Comentado/Eliminado
const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY"); // <-- Añadido

// Check if necessary environment variables are set
if (!supabaseUrl || !supabaseAnonKey || !perplexityApiKey) { // <-- Usar perplexityApiKey
  console.error(
    "Missing environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or PERPLEXITY_API_KEY" // <-- Mensaje actualizado
  );
  // Optionally, throw an error or return a specific response during deployment/startup
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
// const openai = new OpenAI({ apiKey: openaiApiKey }); // <-- Comentado/Eliminado
const perplexityClient = new OpenAI({ // <-- Nueva instancia para Perplexity
  apiKey: perplexityApiKey, 
  baseURL: "https://api.perplexity.ai" // <-- Añadir URL base de Perplexity
});

// Configure PDF.js worker source (required for esm.sh usage)
// Use a CDN link compatible with Deno/Edge Runtime
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

console.log("Generate Embeddings Function Initialized (v2 - Service Role)");

// --- Helper Functions ---

async function downloadPdf(bucketName: string, storagePath: string): Promise<ArrayBuffer> {
  console.log(`Downloading PDF from bucket '${bucketName}' at path '${storagePath}'...`);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(storagePath);

  if (error) {
    console.error("Error downloading PDF:", error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
  if (!data) {
    throw new Error("No data received for PDF download.");
  }
  console.log("PDF downloaded successfully.");
  return await data.arrayBuffer();
}

async function extractTextFromPdf(pdfData: ArrayBuffer): Promise<string> {
  console.log("Extracting text from PDF...");
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" "); // Type assertion needed if types are strict
    fullText += pageText + "\n"; // Add newline between pages
  }
  console.log(`Text extracted (${fullText.length} characters).`);
  return fullText;
}

// Simple chunking function (adjust MAX_CHUNK_SIZE as needed)
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    let currentChunk = "";
    const sentences = text.split(/(?<=[.!?])\s+/); // Split by sentence endings

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk);
            }
            // Handle sentences longer than maxChunkSize (split them further if necessary)
            if (sentence.length <= maxChunkSize) {
                 currentChunk = sentence;
            } else {
                 // Basic split for oversized sentences
                 let remainingSentence = sentence;
                 while(remainingSentence.length > 0) {
                     chunks.push(remainingSentence.substring(0, maxChunkSize));
                     remainingSentence = remainingSentence.substring(maxChunkSize);
                 }
                 currentChunk = ""; // Reset chunk after handling long sentence
            }
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    console.log(`Text split into ${chunks.length} chunks.`);
    return chunks;
}


async function generateEmbeddings(textChunks: string[]): Promise<Array<{ chunk: string; embedding: number[] }>> {
  console.log(`Generating embeddings for ${textChunks.length} chunks...`);
  const embeddings = [];
  const embeddingModel = "text-embedding-3-small"; // <-- Modelo de Perplexity

  for (const chunk of textChunks) {
      try {
          const response = await perplexityClient.embeddings.create({ // <-- Usar perplexityClient
              model: embeddingModel,
              input: chunk,
              encoding_format: "float" // <-- Añadir formato float
          });
          if (response.data && response.data.length > 0 && response.data[0].embedding) { // <-- Verificar embedding
              embeddings.push({ chunk: chunk, embedding: response.data[0].embedding });
          } else {
               console.warn(`No embedding generated for chunk: "${chunk.substring(0, 50)}..."`);
          }
      } catch (error: any) { // <-- Añadir tipo any
          console.error(`Error generating embedding for chunk: "${chunk.substring(0,50)}..."`, error);
          // Decide how to handle errors: skip chunk, retry, or fail the function?
          // For now, we skip the chunk with an error
      }
  }
   console.log(`Generated ${embeddings.length} embeddings.`);
  return embeddings;
}

async function storeEmbeddings(
    gacetaUrl: string,
    embeddingsData: Array<{ chunk: string; embedding: number[] }>
): Promise<void> {
    console.log(`Storing ${embeddingsData.length} embeddings in the database...`);

    // Assumes a table 'gaceta_embeddings' exists with columns:
    // id (uuid, pk), gaceta_url (text), content (text), embedding (vector)
    const recordsToInsert = embeddingsData.map(data => ({
        gaceta_url: gacetaUrl,
        content: data.chunk,
        embedding: data.embedding,
    }));

    // Insert in batches if necessary, Supabase client might handle this, but check limits
    const { error } = await supabase
        .from("gaceta_embeddings") // Your table name here!
        .insert(recordsToInsert);

    if (error) {
        console.error("Error storing embeddings:", error);
        throw new Error(`Failed to store embeddings: ${error.message}`);
    }
    console.log("Embeddings stored successfully.");
}


// --- Main Request Handler ---

serve(async (req: Request) => {
  // 1. Ensure this is a POST request
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Parse request body
    const { storagePath, bucketName, gacetaTitle, gacetaUrl } = await req.json();

    // Basic validation
    if (!storagePath || !bucketName || !gacetaUrl) {
       console.error("Missing required parameters in request body.");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: storagePath, bucketName, gacetaUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log(`Received request for Gaceta: ${gacetaTitle || 'No Title'}, URL: ${gacetaUrl}`);


    // 3. Download PDF from Storage
    const pdfData = await downloadPdf(bucketName, storagePath);

    // 4. Extract text from PDF
    const text = await extractTextFromPdf(pdfData);
    if (!text || text.trim().length === 0) {
        console.warn("No text could be extracted from the PDF.");
        // Decide how to proceed: store nothing, log error, etc.
        // For now, we'll return success but note the issue.
         return new Response(
            JSON.stringify({ message: "Processed, but no text extracted from PDF.", gacetaUrl }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    // 5. Chunk the text
    const textChunks = chunkText(text); // Uses default chunk size

    // 6. Generate Embeddings
    const embeddingsData = await generateEmbeddings(textChunks);
    if (embeddingsData.length === 0) {
        console.warn("No embeddings could be generated for the extracted text.");
        // Return success but note the issue
        return new Response(
            JSON.stringify({ message: "Processed, but no embeddings generated.", gacetaUrl }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    // 7. Store Embeddings in Database
    await storeEmbeddings(gacetaUrl, embeddingsData);

    // 8. Return success response
    console.log(`Successfully processed Gaceta: ${gacetaUrl}`);
    return new Response(
      JSON.stringify({ message: "Gaceta processed and embeddings stored successfully.", gacetaUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) { // <-- Añadir tipo any
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-embeddings' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

