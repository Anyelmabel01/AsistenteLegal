// supabase/functions/scrape-gaceta-oficial/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// Import Supabase client library (make sure it's managed, e.g., via esm.sh or import map)
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
// Import Deno DOM
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

console.log(`Function 'scrape-gaceta-oficial' up and running!`);

const GACETA_URL = 'https://www.gacetaoficial.gob.pa/';

// --- Helper: Get Supabase Admin Client ---
function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Required to use service_role key
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
// -----------------------------------------

async function scrapeGaceta(): Promise<{ title: string, date: string, url: string } | null> {
  console.log(`Fetching HTML from ${GACETA_URL}...`);
  const res = await fetch(GACETA_URL);
  if (!res.ok) {
    console.error(`Failed to fetch ${GACETA_URL}: ${res.status} ${res.statusText}`);
    throw new Error(`Failed to fetch ${GACETA_URL}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (!doc) {
    console.error("Failed to parse HTML document");
    throw new Error("Failed to parse HTML document");
  }

  // --- Use ACTUAL selectors based on inspection --- 
  const linkElement = doc.querySelector('div.noGaceta h2.upper a');
  const dateElement = doc.querySelector('div.noGaceta h2.upper + span');

  if (!linkElement || !dateElement) {
    console.error("Could not find the required elements using selectors.");
    console.error(`Link element found: ${!!linkElement}`);
    console.error(`Date element found: ${!!dateElement}`);
    // Consider logging parts of the doc.body.innerHTML if debugging is needed
    // console.error("Document Body Snippet:", doc.body?.innerHTML.substring(0, 500)); 
    return null; // Indicate failure to find elements
  }

  // Cast linkElement to Element to access getAttribute
  const linkEl = linkElement as Element;
  const title = linkEl.textContent?.trim();
  const relativeUrl = linkEl.getAttribute('href');
  const dateText = dateElement.textContent?.trim();

  if (title && dateText && relativeUrl) {
      // Resolve relative URL to absolute URL
      const absoluteUrl = new URL(relativeUrl, GACETA_URL).toString();
      console.log(`Found Gaceta: ${title}, Date: ${dateText}, URL: ${absoluteUrl}`);
      return {
          title, // e.g., "GACETA 30262"
          date: dateText, // e.g., "martes 22 de abril de 2025"
          url: absoluteUrl
      };
  } else {
      console.error("Failed to extract text content or href from elements.");
      console.error(`Title: ${title}, Date: ${dateText}, Relative URL: ${relativeUrl}`);
      return null; // Indicate failure to extract data
  }
}

serve(async (req) => {
  try {
    // NOTE: This function is intended to be run by a schedule (Cron Job),
    // but we can invoke it for testing.

    console.log("Scraping Gaceta Oficial...");

    const latestGaceta = await scrapeGaceta();

    if (!latestGaceta) {
       return new Response(JSON.stringify({ error: "Scraping failed to find or extract Gaceta info." }), {
        headers: { "Content-Type": "application/json" },
        status: 500, 
      });
    }

    // --- Step 1: Compare with last run --- 
    const supabaseAdmin = getSupabaseAdminClient();

    // Check if this Gaceta URL already exists in our table
    console.log(`Checking database for existing entry: ${latestGaceta.url}`);
    const { data: existingGaceta, error: selectError } = await supabaseAdmin
      .from('processed_gacetas')
      .select('url')
      .eq('url', latestGaceta.url)
      .maybeSingle(); // Returns one row or null

    if (selectError) {
      console.error("Database error checking for existing Gaceta:", selectError);
      throw selectError; // Propagate error
    }

    if (existingGaceta) {
      console.log(`Gaceta ${latestGaceta.title} (${latestGaceta.url}) already processed. No action needed.`);
      // Return success, as no *new* work was needed
      return new Response(JSON.stringify({ message: "No new Gaceta found.", latestGaceta }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // --- If we reach here, it's a NEW Gaceta ---
    console.log(`New Gaceta found: ${latestGaceta.title}`);

    // --- Step 2: Process new document (Download, Upload, Invoke Embeddings) ---
    let processingSuccessful = false; // Default to false
    const storageBucket = 'gacetas-pdf'; // MAKE SURE THIS BUCKET EXISTS
    // Sanitize title for use as filename (replace invalid chars)
    const safeFilename = latestGaceta.title.replace(/[^a-z0-9_\-\.]/gi, '_') + '.pdf';
    const storagePath = `public/${safeFilename}`; // Path within the bucket

    try {
      // 1. Download PDF
      console.log(`Downloading PDF from ${latestGaceta.url}...`);
      const pdfResponse = await fetch(latestGaceta.url);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
      const pdfBlob = await pdfResponse.blob();
      console.log(`PDF downloaded successfully (${(pdfBlob.size / 1024).toFixed(2)} KB).`);

      // 2. Upload PDF to Supabase Storage
      console.log(`Uploading PDF to Storage bucket '${storageBucket}' at path '${storagePath}'...`);
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(storageBucket)
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true, // Overwrite if exists (optional, consider if needed)
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      console.log("PDF uploaded successfully:", uploadData);

      // 3. Invoke generate-embeddings function
      console.log(`Invoking 'generate-embeddings' function for path: ${storagePath}`);
      // Pass relevant info - adjust payload as needed by generate-embeddings
      const { data: functionData, error: functionError } = await supabaseAdmin.functions.invoke(
        'generate-embeddings', // Ensure this function name is correct
        {
          body: {
            storagePath: storagePath, // Pass the path to the uploaded file
            bucketName: storageBucket,
            gacetaTitle: latestGaceta.title,
            gacetaUrl: latestGaceta.url,
            // Add any other metadata generate-embeddings might need
          }
        }
      );

      if (functionError) {
        console.error("Error invoking generate-embeddings function:", functionError);
        // Decide how to handle: maybe still mark as processed but log error?
        // For now, we'll consider it a processing failure if invocation fails.
        throw functionError;
      }
      console.log("'generate-embeddings' function invoked successfully:", functionData);

      processingSuccessful = true; // Mark as successful only if all steps pass

    } catch (processingError) {
      console.error(`Error processing new Gaceta ${latestGaceta.title}:`, processingError);
      // processingSuccessful remains false
      // Consider adding more robust error handling/retries if needed
    }
    // ------------------------------------------------------------------------

    // --- Step 3: Update last run status (only if new and processed successfully) ---
    if (processingSuccessful) { // Only record if processing steps were successful
      console.log(`Recording new Gaceta in database: ${latestGaceta.url}`);
      const { error: insertError } = await supabaseAdmin
        .from('processed_gacetas')
        .insert({
          url: latestGaceta.url,
          title: latestGaceta.title,
          gaceta_date: latestGaceta.date, // Ensure column name matches table definition
        });

      if (insertError) {
        console.error("Database error inserting new Gaceta record:", insertError);
        // Decide if this should be a fatal error for the function run
        // For now, we'll log it but still return success for the scraping part
      }
    }
    // ------------------------------------------------------------------------

    // Final success response for finding and initiating processing of a new Gaceta
    const responseData = {
      message: "New Gaceta found and processing initiated (or logged).",
      latestGaceta: latestGaceta
    };

    console.log("Scraping finished.");

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in scrape-gaceta-oficial function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500, 
    });
  }
});

/* 
// Example using deno-dom (ensure you manage imports correctly, maybe via import_map.json)
// Moved actual implementation above
*/ 