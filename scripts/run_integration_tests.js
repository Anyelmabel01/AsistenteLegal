#!/usr/bin/env node

/**
 * Pruebas de Integración - AsistenLegal
 * 
 * Este script ejecuta pruebas de integración para verificar el funcionamiento
 * correcto de todos los componentes del sistema trabajando juntos.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Colores para la salida de consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}=== Ejecutando Pruebas de Integración para AsistenteLegal ===${colors.reset}\n`);

// Registro de resultados
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Función auxiliar para ejecutar pruebas
function runTest(name, testFn) {
  try {
    console.log(`${colors.blue}Ejecutando: ${name}${colors.reset}`);
    testFn();
    console.log(`${colors.green}✓ Prueba pasada: ${name}${colors.reset}`);
    results.passed++;
    results.details.push({ name, status: 'passed' });
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Prueba fallida: ${name}${colors.reset}`);
    console.error(`  Error: ${error.message}`);
    results.failed++;
    results.details.push({ name, status: 'failed', error: error.message });
    return false;
  }
}

// --- Pruebas de Integración ---

// 1. Verificar conexión a Supabase
runTest('Conexión a Supabase', () => {
  try {
    // Esta prueba requiere que estemos en un entorno donde podamos importar módulos ES
    // Para simplificar, usamos un enfoque que verifica el archivo de configuración
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }
    
    // Intentar un ping simple usando curl
    const result = execSync(`curl -s ${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`);
    const response = JSON.parse(result.toString());
    
    if (!response.status || response.status !== 'healthy') {
      throw new Error('El servicio de Supabase no está saludable');
    }
  } catch (error) {
    throw new Error(`No se pudo conectar a Supabase: ${error.message}`);
  }
});

// 2. Verificar acceso a las Edge Functions
runTest('Acceso a Edge Functions', () => {
  const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');
  if (!fs.existsSync(functionsDir)) {
    throw new Error('Directorio de funciones no encontrado');
  }
  
  // Verificar que las funciones principales existen
  const requiredFunctions = [
    'scrape-gaceta-oficial',
    'scrape-organo-judicial',
    'generate-embeddings'
  ];
  
  for (const funcName of requiredFunctions) {
    const funcDir = path.join(functionsDir, funcName);
    if (!fs.existsSync(funcDir)) {
      throw new Error(`Función ${funcName} no encontrada`);
    }
    if (!fs.existsSync(path.join(funcDir, 'index.ts'))) {
      throw new Error(`Archivo index.ts no encontrado en función ${funcName}`);
    }
  }
});

// 3. Verificar componentes principales de la aplicación
runTest('Componentes de la aplicación', () => {
  const componentsDir = path.join(__dirname, '..', 'components');
  
  // Componentes críticos que deben existir
  const criticalComponents = [
    'UpdatesPanel.tsx',
    'NotificationCenter.tsx',
    'CaseChatInterface.tsx',
    'ChatInterface.js'
  ];
  
  for (const component of criticalComponents) {
    const componentPath = path.join(componentsDir, component);
    if (!fs.existsSync(componentPath)) {
      throw new Error(`Componente crítico no encontrado: ${component}`);
    }
  }
});

// 4. Verificar rutas principales de la aplicación
runTest('Rutas de la aplicación', () => {
  const appDir = path.join(__dirname, '..', 'app');
  
  // Rutas críticas que deben existir
  const criticalRoutes = [
    'page.tsx',               // Home
    'dashboard/page.tsx',     // Dashboard
    'casos/page.tsx',         // Casos
    'documentos/page.tsx'     // Documentos
  ];
  
  for (const route of criticalRoutes) {
    const routePath = path.join(appDir, route);
    if (!fs.existsSync(routePath)) {
      throw new Error(`Ruta crítica no encontrada: ${route}`);
    }
  }
});

// 5. Verificar integridad del proyecto Next.js
runTest('Integridad del proyecto Next.js', () => {
  // Verificar archivos de configuración críticos
  const configFiles = [
    'next.config.mjs',
    'package.json',
    'tsconfig.json',
    'tailwind.config.js'
  ];
  
  for (const file of configFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      throw new Error(`Archivo de configuración no encontrado: ${file}`);
    }
  }
  
  // Verificar que el proyecto puede construirse sin errores
  try {
    console.log(`${colors.yellow}Ejecutando build de verificación (puede tardar unos minutos)...${colors.reset}`);
    execSync('npm run build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error(`Error en el build: ${error.message}`);
  }
});

// --- Resumen de resultados ---
console.log(`\n${colors.cyan}=== Resumen de Pruebas de Integración ===${colors.reset}`);
console.log(`${colors.green}✓ Pruebas exitosas: ${results.passed}${colors.reset}`);
console.log(`${colors.red}✗ Pruebas fallidas: ${results.failed}${colors.reset}`);
console.log(`${colors.yellow}⚠ Pruebas omitidas: ${results.skipped}${colors.reset}`);

if (results.failed > 0) {
  console.log(`\n${colors.red}=== Detalles de fallos ===${colors.reset}`);
  results.details
    .filter(r => r.status === 'failed')
    .forEach(r => console.log(`${colors.red}✗ ${r.name}: ${r.error}${colors.reset}`));
  
  process.exit(1);
} else {
  console.log(`\n${colors.green}Todas las pruebas de integración pasaron exitosamente.${colors.reset}`);
  process.exit(0);
} 