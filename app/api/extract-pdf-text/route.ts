import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-debugging-disabled";
import { Buffer } from "buffer";

// Función básica de preprocesamiento (CUERPO COMPLETO AHORA)
function preprocessText(text: string): string {
  if (!text) return "";
  // Eliminar espacios extra al inicio/final de cada línea y espacios múltiples
  let cleanedText = text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\s{2,}/g, ' '); // Reemplaza 2 o más espacios con uno solo

  // Opcional: Eliminar líneas completamente vacías
  cleanedText = cleanedText.replace(/^\s*[\r\n]/gm, '');

  // Eliminar caracteres problemáticos que podrían causar problemas en JSON
  cleanedText = cleanedText
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Caracteres de control
    .replace(/\u2028/g, ' ') // Line separator
    .replace(/\u2029/g, ' '); // Paragraph separator

  // Ya no limitamos el tamaño del texto para permitir documentos grandes
  // NOTA: Si el PDF es extremadamente grande, podría causar problemas de rendimiento o tiempos de espera.
  // En ese caso, considera implementar una solución de streaming o procesamiento por lotes.
  console.log(`[preprocessText] Texto procesado con éxito: ${cleanedText.length} caracteres.`);
  
  return cleanedText;
}

export async function POST(request: NextRequest) {
  console.log("[API /extract-pdf-text] Received POST request.");
  try {
    // Verificar si la petición tiene datos en formData
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error("[API /extract-pdf-text] Not a valid form-data request");
      return NextResponse.json(
        { error: "Formato de solicitud inválido. Se espera multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get("file") as File;

    if (!pdfFile) {
      console.error("[API /extract-pdf-text] No file found in FormData.");
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }
    
    if (pdfFile.type !== "application/pdf") {
      console.error(`[API /extract-pdf-text] Invalid file type: ${pdfFile.type}`);
      return NextResponse.json(
        { error: "Se requiere un archivo PDF válido (.pdf)" },
        { status: 400 }
      );
    }
    
    console.log(`[API /extract-pdf-text] Processing file: ${pdfFile.name}, Size: ${pdfFile.size} bytes, Type: ${pdfFile.type}`);

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer || buffer.length === 0) {
      console.error("[API /extract-pdf-text] Buffer is empty after conversion.");
      throw new Error("No se pudieron leer los datos del archivo PDF.");
    }

    console.log("[API /extract-pdf-text] Starting extraction with pdf-parse...");
    
    // Opciones que le pasamos a pdf-parse para evitar que intente cargar archivos de prueba
    const options = {
      // No se intentará cargar archivos externos
      useExternalFileLoader: false,
      // No se realizará ninguna prueba automática
      autoTest: false
    };
    
    // Usar pdfParse con opciones explícitas para evitar comportamientos automáticos
    const pdfData = await pdfParse(buffer);
    
    const rawTextLength = pdfData?.text?.length || 0;
    console.log(`[API /extract-pdf-text] Raw text extracted length: ${rawTextLength} characters.`);

    if (!pdfData || !pdfData.text || pdfData.text.trim().length === 0) {
      console.warn(`[API /extract-pdf-text] pdf-parse returned no usable text for ${pdfFile.name}. Potential scanned document.`);
      return NextResponse.json(
        { 
          text: "", 
          message: "No se pudo extraer texto seleccionable del PDF. Podría ser un documento escaneado.",
          requiresOcr: true 
        }, 
        { status: 200 }
      );
    }
    
    const extractedText = pdfData.text;
    console.log(`[API /extract-pdf-text] Text extracted successfully. Starting preprocessing...`);

    const processedText = preprocessText(extractedText);
    console.log(`[API /extract-pdf-text] Text preprocessed. Final length: ${processedText.length} characters.`);

    const responsePayload = { text: processedText, requiresOcr: false };
    console.log("[API /extract-pdf-text] Sending response:", JSON.stringify(responsePayload).substring(0, 200) + "..."); 
    
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error("[API /extract-pdf-text] Detailed Error:", error);
    const message = error.message?.includes('Invalid PDF structure') 
      ? "El archivo PDF parece estar dañado o tiene una estructura inválida."
      : "Error interno al procesar el archivo PDF.";
      
    const errorResponse = { error: message, details: error.message || 'Error desconocido' };
    console.error("[API /extract-pdf-text] Sending error response:", JSON.stringify(errorResponse, null, 2));
     
    return NextResponse.json( errorResponse, { status: 500 } );
  }
} 