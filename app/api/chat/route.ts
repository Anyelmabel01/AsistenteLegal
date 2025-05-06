import { NextRequest, NextResponse } from 'next/server';
// Importa tu cliente de IA (Perplexity, OpenAI, etc.)
import { generateCompletion } from '@/lib/perplexity';

export async function POST(req: NextRequest) {
  console.log("[API /chat] Received POST request."); // LOG
  try {
    const body = await req.json();
    
    // LOG: Log the entire received request body
    console.log("[API /chat] Received request body:", JSON.stringify(body, null, 2));

    const userMessages = body.messages; 
    const pdfText = body.attachedPdfText;
    const hasPDFFlag = body.hasPDF === true;
    
    // LOG: Log the extracted pdfText specifically
    console.log(`[API /chat] Extracted pdfText type: ${typeof pdfText}, length: ${pdfText?.length || 0}`);
    console.log(`[API /chat] Has PDF Flag: ${hasPDFFlag}`);
    console.log("[API /chat] Extracted pdfText (first 100 chars):", pdfText ? pdfText.substring(0, 100) + "..." : "null or empty");

    if (!userMessages || !Array.isArray(userMessages)) {
        console.error("[API /chat] Invalid message format in request body."); // LOG
        return NextResponse.json({ error: 'Formato de mensajes inválido.' }, { status: 400 });
    }

    let fullPromptContext = "";
    const lastUserMessage = userMessages.slice(-1)[0]?.content || ""; 
    
    // Verificar si hay texto de PDF, ya sea como adjunto, con la bandera, o incluido en el mensaje
    const hasPDF = hasPDFFlag || 
                  (pdfText && typeof pdfText === 'string' && pdfText.trim().length > 0) || 
                  lastUserMessage.includes("CONTENIDO DEL PDF ADJUNTO") ||
                  lastUserMessage.includes("Análisis del PDF adjunto") ||
                  (lastUserMessage.length > 1000); // Si el mensaje es muy largo, probablemente contiene un PDF
    
    console.log(`[API /chat] Has PDF? ${hasPDF}, Message length: ${lastUserMessage.length}`);

    if (pdfText && typeof pdfText === 'string' && pdfText.trim().length > 0) {
      console.log("[API /chat] Appending PDF text to AI context..."); // LOG
      fullPromptContext += `Contexto del Documento PDF Adjunto:\n---\n${pdfText}\n---\n\n`;
    } else {
       console.log("[API /chat] No valid PDF text found in request body. Not adding to context."); // LOG
    }

    fullPromptContext += `Consulta del Usuario:\n${lastUserMessage}`;

    // LOG: Log the final context/prompt being sent to the AI model
    console.log("[API /chat] Final context/prompt for AI (first 300 chars):", fullPromptContext.substring(0, 300));

    // *** Llama a tu modelo de IA ***
    const aiResponse = await generateCompletion(fullPromptContext);
    
    // Adaptar la respuesta según si se detectó un PDF o no
    /*
    const aiResponse = { 
        assistantResponse: hasPDF
          ? `He analizado el documento que has proporcionado y puedo ofrecerte el siguiente análisis legal:

**Análisis del Caso**

El caso presenta una situación contractual interesante desde el punto de vista jurídico. Según la documentación analizada, identifico los siguientes aspectos clave:

1. Existe un posible incumplimiento contractual por parte de una de las partes.
2. Las cláusulas específicas del contrato establecen plazos determinados que podrían ser relevantes para la resolución.
3. Hay elementos que podrían constituir fuerza mayor según la normativa panameña.

**Marco Legal Aplicable**

En Panamá, este tipo de situaciones están reguladas principalmente por:
- El Código Civil, especialmente los artículos relacionados con obligaciones contractuales
- Jurisprudencia relevante sobre incumplimiento y fuerza mayor
- Normativas específicas del sector (si aplica)

**Recomendaciones**

Basado en mi análisis, recomendaría las siguientes acciones:
1. Revisar detalladamente las cláusulas de resolución de conflictos del contrato
2. Documentar todas las comunicaciones relevantes entre las partes
3. Considerar la posibilidad de una mediación o arbitraje antes de proceder a vías judiciales

Si necesitas profundizar en algún aspecto específico del análisis, no dudes en preguntar.`
          : `He recibido tu consulta sobre: "${lastUserMessage.substring(0, 100)}${lastUserMessage.length > 100 ? '...' : ''}"

Para poder proporcionarte un análisis legal completo, necesitaría más información sobre el caso. Si tienes documentos relacionados (contratos, resoluciones, etc.), te recomendaría adjuntarlos para un análisis más preciso.

No obstante, basado en la información proporcionada, puedo ofrecerte estas consideraciones generales:

1. En asuntos contractuales, es importante revisar las cláusulas específicas y el contexto de la relación entre las partes.
2. La legislación panameña establece plazos y procedimientos específicos que deben ser considerados.
3. Existen mecanismos alternativos de resolución de conflictos que podrían ser aplicables.

Si puedes proporcionar más detalles o documentación sobre tu caso, podré ofrecerte un análisis más completo y personalizado.`
    };
    console.log("[API /chat] Simulated AI response generated."); // LOG
    */

    // LOG: Log the response being sent back to the client
    console.log("[API /chat] Sending response back to client:", JSON.stringify(aiResponse, null, 2));
    return NextResponse.json(aiResponse, { status: 200 });

  } catch (error: any) {
    console.error("[API /chat] Error processing AI request:", error); // LOG
    return NextResponse.json(
      { error: "Error al procesar la solicitud con la IA.", details: error.message },
      { status: 500 }
    );
  }
} 