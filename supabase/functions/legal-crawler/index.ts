import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

// --- Configuración de Supabase ---
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// --- Configuración del Crawler ---
// Podemos pasar la URL por parámetro o usar un valor predeterminado
let TARGET_URL = 'https://www.organojudicial.gob.pa/';
// Utilizamos como valor predeterminado un selector que probablemente funcione para las noticias 
// del Órgano Judicial, pero que puede requerir ajuste
let CONTENT_SELECTOR = 'div.ultimas-noticias, #ultimas-noticias, .news-section, .noticias';
let SOURCE_NAME = 'Organo Judicial';

// Función para calcular el hash SHA-256
function calculateHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// Función para extraer título de una actualización
function extractTitle($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string {
  // Intentar obtener el título de diferentes maneras:
  // 1. Buscar el primer h1, h2, h3 o h4
  const heading = element.find('h1, h2, h3, h4').first();
  if (heading.length > 0) {
    return heading.text().trim();
  }

  // 2. Buscar el primer elemento con clase 'title' o similar
  const titleElement = element.find('.title, .news-title, .headline').first();
  if (titleElement.length > 0) {
    return titleElement.text().trim();
  }

  // 3. Si no encontramos nada, usar el inicio del texto como título
  const text = element.text().trim();
  return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}

// Función para extraer enlaces de noticias o documentos
function extractLinks($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
  const links: string[] = [];
  element.find('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      // Convertir URLs relativas a absolutas
      const absoluteUrl = new URL(href, TARGET_URL).toString();
      links.push(absoluteUrl);
    }
  });
  return links;
}

console.log('Legal Crawler Edge Function starting...');

serve(async (req) => {
  try {
    // Inicializar cliente Supabase con la clave de servicio para acceso total
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
    
    // Extraer parámetros de la solicitud (si se proporciona otro sitio o selector)
    const url = new URL(req.url);
    const customUrl = url.searchParams.get('url');
    const customSelector = url.searchParams.get('selector');
    const customSource = url.searchParams.get('source');
    
    // Usar URL y selector personalizados si se proporcionan
    if (customUrl) TARGET_URL = customUrl;
    if (customSelector) CONTENT_SELECTOR = customSelector;
    if (customSource) SOURCE_NAME = customSource;
    
    console.log(`Fetching URL: ${TARGET_URL} with selector: ${CONTENT_SELECTOR}`);
    
    // 1. Obtener la entrada existente para esta URL (si existe)
    const { data: existingEntry, error: queryError } = await supabase
      .from('crawler_state')
      .select('*')
      .eq('source_url', TARGET_URL)
      .maybeSingle(); // Devuelve null si no existe, en lugar de un array vacío
      
    if (queryError) {
      console.error('Error querying database:', queryError);
      throw queryError;
    }
    
    // 2. Obtener el contenido actual de la URL
    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`HTTP error fetching ${TARGET_URL}: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('HTML fetched successfully.');

    // 3. Analizar el HTML con Cheerio
    const $ = cheerio.load(html);
    const contentElement = $(CONTENT_SELECTOR);

    if (contentElement.length === 0) {
      console.warn(`Selector "${CONTENT_SELECTOR}" not found on page ${TARGET_URL}`);
      return new Response(
        JSON.stringify({ 
          error: 'Content selector not found', 
          url: TARGET_URL, 
          selector: CONTENT_SELECTOR,
          suggestion: 'Inspect the HTML and provide a valid CSS selector via ?selector=yourSelector'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Obtener el HTML del contenido seleccionado y calcular su hash
    const contentHtml = contentElement.html() || '';
    console.log(`Content found for selector "${CONTENT_SELECTOR}". Length: ${contentHtml.length} characters`);
    
    // Tomamos también un snippet de texto para mostrar en actualizaciones
    const contentText = contentElement.text() || '';
    const contentSnippet = contentText.slice(0, 200) + (contentText.length > 200 ? '...' : '');
    
    const contentHash = calculateHash(contentHtml);
    console.log(`Calculated hash: ${contentHash}`);
    
    // Extraer título y enlaces para la actualización
    const updateTitle = extractTitle($, contentElement);
    const updateLinks = extractLinks($, contentElement);
    const updateUrl = updateLinks.length > 0 ? updateLinks[0] : TARGET_URL;
    
    // 5. Comparar con el hash anterior (si existe)
    const currentTimestamp = new Date();
    let updateDetected = false;
    let isFirstCheck = false;
    
    if (!existingEntry) {
      // Es el primer chequeo para esta URL, insertamos un nuevo registro
      isFirstCheck = true;
      const { error: insertError } = await supabase
        .from('crawler_state')
        .insert({
          source_url: TARGET_URL,
          content_selector: CONTENT_SELECTOR,
          last_content_hash: contentHash,
          last_checked_at: currentTimestamp.toISOString(),
          // No hay update_detected_at en el primer chequeo
          last_change_content_snippet: contentSnippet, // Guardamos el snippet inicial
        });
        
      if (insertError) {
        console.error('Error inserting new record:', insertError);
        throw insertError;
      }
      
      // Insertar en la nueva tabla legal_updates para tener un registro inicial
      const { error: legalUpdateError } = await supabase
        .from('legal_updates')
        .insert({
          source: SOURCE_NAME,
          title: updateTitle,
          description: contentSnippet,
          content: contentHtml,
          url: updateUrl,
          published_at: currentTimestamp.toISOString(),
          source_type: 'website',
          is_new: true
        });
        
      if (legalUpdateError) {
        console.error('Error inserting initial legal update:', legalUpdateError);
        throw legalUpdateError;
      }
      
      console.log('First check for this URL. Created new record and legal update.');
    } else {
      // Ya existe un registro para esta URL, verificamos si hay cambios
      if (existingEntry.last_content_hash !== contentHash) {
        updateDetected = true;
        console.log('Update detected! Hash changed from previous check.');
        
        // Actualizar el registro con el nuevo hash y marcar la actualización
        const { error: updateError } = await supabase
          .from('crawler_state')
          .update({
            last_content_hash: contentHash,
            last_checked_at: currentTimestamp.toISOString(),
            // Solo establecemos update_detected_at si es la primera vez que detectamos un cambio
            update_detected_at: existingEntry.update_detected_at || currentTimestamp.toISOString(),
            last_change_content_snippet: contentSnippet,
          })
          .eq('id', existingEntry.id);
          
        if (updateError) {
          console.error('Error updating record:', updateError);
          throw updateError;
        }
        
        // Insertar en la nueva tabla legal_updates al detectar cambios
        const { error: legalUpdateError } = await supabase
          .from('legal_updates')
          .insert({
            source: SOURCE_NAME,
            title: updateTitle,
            description: contentSnippet,
            content: contentHtml,
            url: updateUrl,
            published_at: currentTimestamp.toISOString(),
            source_type: 'website',
            is_new: true
          });
          
        if (legalUpdateError) {
          console.error('Error inserting legal update:', legalUpdateError);
          throw legalUpdateError;
        }
      } else {
        console.log('No changes detected since last check.');
        
        // Solo actualizamos la marca de tiempo del último chequeo
        const { error: updateError } = await supabase
          .from('crawler_state')
          .update({
            last_checked_at: currentTimestamp.toISOString(),
          })
          .eq('id', existingEntry.id);
          
        if (updateError) {
          console.error('Error updating last_checked_at:', updateError);
          throw updateError;
        }
      }
    }
    
    // 6. Construir la respuesta para el cliente
    const data = {
      url: TARGET_URL,
      selector: CONTENT_SELECTOR,
      detectedHash: contentHash,
      previousHash: existingEntry?.last_content_hash || null,
      checkedAt: currentTimestamp.toISOString(),
      updateDetected,
      isFirstCheck,
      contentSnippet,
      title: updateTitle,
      links: updateLinks
    };

    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error executing Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 