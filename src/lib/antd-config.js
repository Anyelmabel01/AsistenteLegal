/**
 * Configuración para deshabilitar advertencias de Ant Design
 */

// Función para sobreescribir console.error y filtrar advertencias específicas de antd
export function setupAntdWarningFilter() {
  const originalError = console.error;
  
  console.error = function filterWarnings(...args) {
    // Filtrar advertencia específica de compatibilidad con React
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('[antd: compatible]') || 
         args[0].includes('antd v5 support React'))) {
      return;
    }
    
    // Mostrar todos los demás errores normalmente
    return originalError.apply(console, args);
  };
}

// Exportación por defecto para uso simple
export default setupAntdWarningFilter; 