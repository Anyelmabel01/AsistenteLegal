// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

const GACETA_URL = 'https://www.gacetaoficial.gob.pa/';
const SOURCE_NAME = 'Gaceta Oficial';

// Función para calcular hash SHA-256
function calculateHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

console.log(`Function "gaceta-crawler" up and running!`);

serve(async (req) => {
  try {
    // Inicializar cliente Supabase con la clave de servicio para acceso total
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Fetch the HTML content from Gaceta Oficial
    const response = await fetch(GACETA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Obtener entradas existentes para esta URL
    const { data: existingState, error: stateError } = await supabase
      .from('crawler_state')
      .select('*')
      .eq('source_url', GACETA_URL)
      .maybeSingle();
      
    if (stateError) {
      console.error('Error querying crawler state:', stateError);
      throw stateError;
    }
    
    // Extraer publicaciones recientes
    const publications = [];
    
    // Selector para la sección de gacetas recientes (ajustar según la estructura real del sitio)
    const publicationsSection = $('.publicaciones, .gacetas-recientes, .recent-publications, #latest-publications');
    
    if (publicationsSection.length === 0) {
      console.warn('No se encontró la sección de publicaciones recientes');
    } else {
      // Extraer elementos individuales (cada publicación)
      publicationsSection.find('li, .publication-item, .gaceta-item').each((i, el) => {
        const item = $(el);
        
        // Intentar extraer título, descripción y enlace
        const title = item.find('h3, h4, .title').first().text().trim() || 
                     item.find('a').first().text().trim() || 
                     `Gaceta ${new Date().toISOString().split('T')[0]}`;
                     
        const description = item.text().trim();
        
        // Extraer enlace
        let url = item.find('a').attr('href') || '';
        if (url && !url.startsWith('http')) {
          url = new URL(url, GACETA_URL).toString();
        }
        
        if (title && (url || description)) {
          publications.push({
            title,
            description,
            url: url || GACETA_URL,
          });
        }
      });
    }
    
    // Si no encontramos publicaciones específicas, usamos la página principal
    if (publications.length === 0) {
      const pageTitle = $('title').text().trim() || 'Gaceta Oficial';
      const mainContent = $('main, #content, .main-content').text().trim();
      const description = mainContent.substring(0, 200) + (mainContent.length > 200 ? '...' : '');
      
      publications.push({
        title: pageTitle,
        description,
        url: GACETA_URL
      });
    }
    
    // Calcular hash del contenido actual
    const contentForHash = publications.map(p => `${p.title}|${p.description}|${p.url}`).join('---');
    const currentHash = calculateHash(contentForHash);
    const currentTimestamp = new Date();
    
    // Verificar si hay cambios comparando con el hash anterior
    let updateDetected = false;
    let isFirstCheck = false;
    
    if (!existingState) {
      // Primer chequeo para esta fuente
      isFirstCheck = true;
      
      // Guardar estado inicial
      const { error: insertError } = await supabase
        .from('crawler_state')
        .insert({
          source_url: GACETA_URL,
          content_selector: '.publicaciones, .gacetas-recientes',
          last_content_hash: currentHash,
          last_checked_at: currentTimestamp.toISOString(),
          last_change_content_snippet: publications[0]?.description || ''
        });
        
      if (insertError) {
        console.error('Error inserting crawler state:', insertError);
        throw insertError;
      }
      
      // Registrar todas las publicaciones encontradas
      for (const pub of publications) {
        const { error: pubError } = await supabase
          .from('legal_updates')
          .insert({
            source: SOURCE_NAME,
            title: pub.title,
            description: pub.description,
            url: pub.url,
            published_at: currentTimestamp.toISOString(),
            source_type: 'publication',
            is_new: true
          });
          
        if (pubError) {
          console.error('Error inserting publication:', pubError);
          // Continuar con la siguiente aunque falle una
        }
      }
      
      console.log(`First check for Gaceta Oficial. Found ${publications.length} publications.`);
    } else {
      // Ya existe un registro para esta fuente, verificar cambios
      if (existingState.last_content_hash !== currentHash) {
        updateDetected = true;
        console.log('Changes detected in Gaceta Oficial');
        
        // Actualizar estado del crawler
        const { error: updateError } = await supabase
          .from('crawler_state')
          .update({
            last_content_hash: currentHash,
            last_checked_at: currentTimestamp.toISOString(),
            update_detected_at: existingState.update_detected_at || currentTimestamp.toISOString(),
            last_change_content_snippet: publications[0]?.description || ''
          })
          .eq('id', existingState.id);
          
        if (updateError) {
          console.error('Error updating crawler state:', updateError);
          throw updateError;
        }
        
        // Registrar las nuevas publicaciones
        for (const pub of publications) {
          const { error: pubError } = await supabase
            .from('legal_updates')
            .insert({
              source: SOURCE_NAME,
              title: pub.title,
              description: pub.description,
              url: pub.url,
              published_at: currentTimestamp.toISOString(),
              source_type: 'publication',
              is_new: true
            });
            
          if (pubError) {
            console.error('Error inserting new publication:', pubError);
            // Continuar con la siguiente aunque falle una
          }
        }
      } else {
        // Sin cambios, solo actualizar timestamp
        const { error: updateError } = await supabase
          .from('crawler_state')
          .update({
            last_checked_at: currentTimestamp.toISOString()
          })
          .eq('id', existingState.id);
          
        if (updateError) {
          console.error('Error updating timestamp:', updateError);
          throw updateError;
        }
        
        console.log('No changes detected in Gaceta Oficial');
      }
    }

    // Preparar la respuesta
    const data = {
      source: SOURCE_NAME,
      url: GACETA_URL,
      publicationsCount: publications.length,
      updateDetected,
      isFirstCheck,
      checkedAt: currentTimestamp.toISOString(),
      publications: publications.slice(0, 5) // Limitar a 5 para no sobrecargar la respuesta
    };

    return new Response(
      JSON.stringify(data),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in gaceta-crawler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/gaceta-crawler' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
