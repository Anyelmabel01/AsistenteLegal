import { NextResponse } from 'next/server';

/**
 * API route para extraer entidades utilizando expresiones regulares básicas
 * Versión simplificada sin dependencia de Python/spaCy
 */
export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'El texto es requerido' },
        { status: 400 }
      );
    }
    
    // Extraer entidades usando patrones básicos para documentos legales
    const entities = extractLegalEntities(text);
    
    return NextResponse.json({ entities });
    
  } catch (err) {
    console.error('Error en el procesamiento de entidades:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Extrae entidades básicas usando expresiones regulares
 * para documentos legales en español (Panamá)
 */
function extractLegalEntities(text) {
  const entities = [];
  
  // Patrones para diferentes tipos de entidades legales
  const patterns = {
    // Fechas (varios formatos)
    dates: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+de\s+[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+\s+de\s+\d{2,4})\b/gi,
    
    // Números de leyes, decretos, etc.
    laws: /\b(Ley|Decreto|Resolución|Acuerdo|Código)\s+N[°oº]?\s*[\d\-]+(?:[-\/]\d+)?\b/gi,
    
    // Artículos de ley
    articles: /\b[Aa]rt[íi]culos?\s+\d+(?:\s*[a-z])?(?:\s*al?\s*\d+)?/gi,
    
    // Montos monetarios
    money: /\b(?:B\/\.|USD|US\$|\$|balboas?)\s*[\d,]+(?:\.\d{2})?/gi,
    
    // Números de expediente o caso
    case_numbers: /\b(?:Expediente|Caso|N[°oº])\s*[\w\d\-\/]+/gi,
    
    // Nombres de personas (patrones básicos para nombres hispanos)
    persons: /\b[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+){1,3}\b/g,
    
    // Organizaciones/entidades (patrones comunes)
    organizations: /\b(?:Ministerio|Tribunal|Corte|Juzgado|Registro|Autoridad|Superintendencia|Dirección)\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ\s]+/gi,
    
    // Ubicaciones (provincias y distritos de Panamá)
    locations: /\b(?:Panamá|Chiriquí|Veraguas|Herrera|Los Santos|Coclé|Colón|Darién|San Miguelito|Penonome|Santiago|David|Las Tablas)\b/gi
  };
  
  // Extraer cada tipo de entidad
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern) || [];
    
    matches.forEach(match => {
      // Limpiar el match
      const cleanMatch = match.trim();
      
      // Evitar duplicados
      const exists = entities.some(entity => 
        entity.text === cleanMatch && entity.type === type
      );
      
      if (!exists && cleanMatch.length > 2) {
        entities.push({
          text: cleanMatch,
          type: type.toUpperCase(),
          start: text.indexOf(match),
          end: text.indexOf(match) + match.length
        });
      }
    });
  }
  
  // Filtrar entidades que son muy comunes o poco específicas
  const filteredEntities = entities.filter(entity => {
    const commonWords = ['de', 'la', 'el', 'en', 'con', 'por', 'para', 'del', 'las', 'los'];
    return !commonWords.includes(entity.text.toLowerCase()) && entity.text.length > 2;
  });
  
  return filteredEntities.slice(0, 50); // Limitar a 50 entidades para no sobrecargar
} 