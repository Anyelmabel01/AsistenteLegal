import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

console.log(`Function 'scrape-organo-judicial' up and running!`);

const ORGANO_JUDICIAL_URL = 'https://www.organojudicial.gob.pa/fallos/jurisprudencia';

// --- Helper: Get Supabase Admin Client ---
function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
// -----------------------------------------

// Type definition for the fallo/jurisprudencia
interface Fallo {
  title: string;
  date: string;
  url: string;
  tribunal: string;
  descripcion?: string;
}

async function scrapeFallos(): Promise<Fallo[]> {
  console.log(`Fetching HTML from ${ORGANO_JUDICIAL_URL}...`);
  const res = await fetch(ORGANO_JUDICIAL_URL);
  if (!res.ok) {
    console.error(`Failed to fetch ${ORGANO_JUDICIAL_URL}: ${res.status} ${res.statusText}`);
    throw new Error(`Failed to fetch ${ORGANO_JUDICIAL_URL}: ${res.status} ${res.statusText}`);
  }
  
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (!doc) {
    console.error("Failed to parse HTML document");
    throw new Error("Failed to parse HTML document");
  }

  // Localizar los elementos que contienen los fallos (ajustar selectores según el sitio)
  const falloElements = doc.querySelectorAll('.fallo-item, .jurisprudencia-item, article.fallo'); // Ajustar según inspección del sitio
  
  if (!falloElements || falloElements.length === 0) {
    console.error("No se encontraron elementos de fallos. Puede ser necesario actualizar los selectores.");
    return [];
  }
  
  console.log(`Encontrados ${falloElements.length} fallos para procesar.`);
  
  const fallos: Fallo[] = [];
  
  // Procesar cada elemento de fallo encontrado
  falloElements.forEach((element) => {
    try {
      // Estos selectores deberán ajustarse según la estructura real del sitio
      const titleElement = element.querySelector('h3, .title');
      const dateElement = element.querySelector('.date, .fecha');
      const linkElement = element.querySelector('a[href*="pdf"], a.download');
      const tribunalElement = element.querySelector('.tribunal, .corte');
      const descripcionElement = element.querySelector('.descripcion, .resumen');
      
      if (!titleElement || !linkElement) {
        console.log("Elemento de fallo incompleto, saltando...");
        return; // Skip this item
      }
      
      const title = titleElement.textContent?.trim() || 'Sin título';
      const date = dateElement?.textContent?.trim() || 'Fecha desconocida';
      const tribunal = tribunalElement?.textContent?.trim() || 'Tribunal no especificado';
      const descripcion = descripcionElement?.textContent?.trim();
      
      // Obtener la URL del documento
      const linkEl = linkElement as Element;
      const relativeUrl = linkEl.getAttribute('href');
      
      if (!relativeUrl) {
        console.log("URL no encontrada, saltando elemento...");
        return;
      }
      
      // Convertir URL relativa a absoluta
      const absoluteUrl = new URL(relativeUrl, ORGANO_JUDICIAL_URL).toString();
      
      fallos.push({
        title,
        date,
        url: absoluteUrl,
        tribunal,
        descripcion
      });
      
    } catch (error) {
      console.error("Error procesando elemento de fallo:", error);
    }
  });
  
  console.log(`Procesados ${fallos.length} fallos exitosamente.`);
  return fallos;
}

serve(async (req) => {
  try {
    console.log("Scraping Órgano Judicial de Panamá...");
    
    const fallos = await scrapeFallos();
    
    if (fallos.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No se encontraron fallos o jurisprudencia para procesar." 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    const supabaseAdmin = getSupabaseAdminClient();
    const storageBucket = 'organo_judicial_pdf'; // Asegúrate de que este bucket exista
    
    let processedCount = 0;
    let skippedCount = 0;
    
    // Procesar cada fallo encontrado
    for (const fallo of fallos) {
      // Verificar si ya existe en la base de datos
      console.log(`Verificando si ${fallo.url} ya está procesado...`);
      const { data: existingFallo, error: selectError } = await supabaseAdmin
        .from('processed_fallos')
        .select('url')
        .eq('url', fallo.url)
        .maybeSingle();
        
      if (selectError) {
        console.error("Error al verificar fallo existente:", selectError);
        continue; // Continuar con el siguiente fallo
      }
      
      if (existingFallo) {
        console.log(`Fallo ${fallo.title} (${fallo.url}) ya procesado. Saltando.`);
        skippedCount++;
        continue;
      }
      
      // Procesar nuevo fallo
      console.log(`Procesando nuevo fallo: ${fallo.title}`);
      let processingSuccessful = false;
      
      // Sanitizar título para nombre de archivo
      const safeFilename = fallo.title.replace(/[^a-z0-9_\-\.]/gi, '_') + '.pdf';
      const storagePath = `fallos/${safeFilename}`;
      
      try {
        // 1. Descargar PDF
        console.log(`Descargando PDF desde ${fallo.url}...`);
        const pdfResponse = await fetch(fallo.url);
        if (!pdfResponse.ok) {
          throw new Error(`Error al descargar PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }
        const pdfBlob = await pdfResponse.blob();
        console.log(`PDF descargado (${(pdfBlob.size / 1024).toFixed(2)} KB).`);
        
        // 2. Subir a Supabase Storage
        console.log(`Subiendo PDF a Storage bucket '${storageBucket}' en ruta '${storagePath}'...`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(storageBucket)
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
          });
          
        if (uploadError) {
          console.error("Error al subir a Storage:", uploadError);
          throw uploadError;
        }
        console.log("PDF subido correctamente:", uploadData);
        
        // 3. Invocar generate-embeddings
        console.log(`Invocando función 'generate-embeddings' para ruta: ${storagePath}`);
        const { data: functionData, error: functionError } = await supabaseAdmin.functions.invoke(
          'generate-embeddings',
          {
            body: {
              storagePath: storagePath,
              bucketName: storageBucket,
              documentTitle: fallo.title,
              documentUrl: fallo.url,
              metadata: {
                tribunal: fallo.tribunal,
                date: fallo.date,
                descripcion: fallo.descripcion,
                source: 'organo_judicial'
              }
            }
          }
        );
        
        if (functionError) {
          console.error("Error al invocar generate-embeddings:", functionError);
          throw functionError;
        }
        console.log("Función 'generate-embeddings' invocada correctamente:", functionData);
        
        processingSuccessful = true;
        
      } catch (processingError) {
        console.error(`Error procesando fallo ${fallo.title}:`, processingError);
      }
      
      // Registrar en la base de datos si se procesó exitosamente
      if (processingSuccessful) {
        console.log(`Registrando nuevo fallo en base de datos: ${fallo.url}`);
        const { error: insertError } = await supabaseAdmin
          .from('processed_fallos')
          .insert({
            url: fallo.url,
            title: fallo.title,
            tribunal: fallo.tribunal,
            fallo_date: fallo.date,
            descripcion: fallo.descripcion
          });
          
        if (insertError) {
          console.error("Error al insertar registro de fallo:", insertError);
        } else {
          processedCount++;
        }
      }
    }
    
    // Respuesta final
    const responseData = {
      message: `Scraping completado. Procesados ${processedCount} nuevos fallos, ${skippedCount} ya existentes, ${fallos.length - processedCount - skippedCount} con errores.`,
      fallos: fallos.map(f => ({ title: f.title, url: f.url })) // Versión resumida para la respuesta
    };
    
    console.log("Scraping del Órgano Judicial finalizado.");
    
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Error en función scrape-organo-judicial:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 