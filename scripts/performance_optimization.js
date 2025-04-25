#!/usr/bin/env node

/**
 * Script de Optimización de Rendimiento - AsistenteLegal
 * 
 * Este script analiza y optimiza el rendimiento de la aplicación.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

console.log(`${colors.cyan}=== Análisis y Optimización de Rendimiento para AsistenteLegal ===${colors.reset}\n`);

// Función para ejecutar y medir el tiempo de un comando
function timeCommand(command, label) {
  console.log(`${colors.blue}Ejecutando: ${label}${colors.reset}`);
  const start = Date.now();
  try {
    const output = execSync(command, { stdio: 'pipe' }).toString();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`${colors.green}✓ Completado en ${duration}s: ${label}${colors.reset}`);
    return { success: true, duration, output };
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`${colors.red}✗ Error después de ${duration}s: ${label}${colors.reset}`);
    console.error(`  ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// 1. Analizar el tamaño del bundle
console.log(`${colors.magenta}\n=== Análisis de tamaño del bundle ===${colors.reset}`);
timeCommand('npx next build', 'Construir proyecto para producción');

// Verificar si existe el directorio .next
if (fs.existsSync(path.join(__dirname, '..', '.next'))) {
  console.log(`${colors.blue}Analizando tamaño del bundle...${colors.reset}`);
  
  // Instalar next-bundle-analyzer si no está presente
  try {
    require.resolve('next-bundle-analyzer');
  } catch (e) {
    console.log(`${colors.yellow}Instalando next-bundle-analyzer...${colors.reset}`);
    execSync('npm install --save-dev next-bundle-analyzer', { stdio: 'inherit' });
  }
  
  // Modificar temporalmente next.config.mjs para habilitar el análisis de bundle
  const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
  const originalConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Verificar si ya tiene withBundleAnalyzer
  if (!originalConfig.includes('withBundleAnalyzer')) {
    console.log(`${colors.blue}Modificando next.config.mjs para análisis de bundle...${colors.reset}`);
    
    const analyzerConfig = `
import { withBundleAnalyzer } from 'next-bundle-analyzer';

const analyzerConfig = {
  enabled: true,
  openAnalyzer: false,
};

const nextConfig = ${originalConfig.includes('export default') ? originalConfig.split('export default')[1] : '{}'}

export default process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(analyzerConfig)(nextConfig)
  : nextConfig;
`;
    
    fs.writeFileSync(nextConfigPath, analyzerConfig, 'utf8');
    
    // Ejecutar análisis
    timeCommand('ANALYZE=true npx next build', 'Analizar bundle con next-bundle-analyzer');
    
    // Restaurar configuración original
    fs.writeFileSync(nextConfigPath, originalConfig, 'utf8');
    console.log(`${colors.blue}Configuración original de next.config.mjs restaurada${colors.reset}`);
  } else {
    // Si ya tiene withBundleAnalyzer, solo ejecutamos el análisis
    timeCommand('ANALYZE=true npx next build', 'Analizar bundle con next-bundle-analyzer');
  }
} else {
  console.log(`${colors.yellow}⚠ Directorio .next no encontrado. Ejecuta 'npm run build' primero.${colors.reset}`);
}

// 2. Optimización de imágenes
console.log(`${colors.magenta}\n=== Optimización de imágenes ===${colors.reset}`);
const publicDir = path.join(__dirname, '..', 'public');

if (fs.existsSync(publicDir)) {
  try {
    // Instalar sharp si no está presente (usado por Next.js para optimizar imágenes)
    try {
      require.resolve('sharp');
    } catch (e) {
      console.log(`${colors.yellow}Instalando sharp para optimización de imágenes...${colors.reset}`);
      execSync('npm install --save sharp', { stdio: 'inherit' });
    }
    
    // Contar imágenes en directorio public
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    let imageCount = 0;
    
    function countImagesInDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          countImagesInDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (imageExtensions.includes(ext)) {
            imageCount++;
          }
        }
      }
    }
    
    countImagesInDir(publicDir);
    console.log(`${colors.green}Encontradas ${imageCount} imágenes en directorio public${colors.reset}`);
    
    if (imageCount > 0) {
      console.log(`${colors.blue}Verificando uso del componente next/image...${colors.reset}`);
      
      // Buscar en los archivos .tsx y .jsx si se está usando next/image
      const imageImportRegex = /import\s+(\w+|\{[\s\w,]+\})\s+from\s+['"]next\/image['"]/;
      let usingNextImage = false;
      
      function checkNextImageInDir(dir, extensions) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const foundInSubdir = checkNextImageInDir(fullPath, extensions);
            if (foundInSubdir) usingNextImage = true;
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.includes(ext)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (imageImportRegex.test(content)) {
                usingNextImage = true;
                return true;
              }
            }
          }
        }
        
        return false;
      }
      
      checkNextImageInDir(path.join(__dirname, '..'), ['.tsx', '.jsx', '.js', '.ts']);
      
      if (usingNextImage) {
        console.log(`${colors.green}✓ La aplicación usa el componente next/image para optimizar imágenes${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ No se detectó el uso de next/image. Se recomienda usar este componente para optimizar imágenes.${colors.reset}`);
        console.log(`${colors.blue}Ejemplo de uso:${colors.reset}`);
        console.log(`  import Image from 'next/image';
  
  // En lugar de <img src="/ruta/imagen.jpg" />
  <Image 
    src="/ruta/imagen.jpg" 
    width={500} 
    height={300} 
    alt="Descripción" 
  />`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error optimizando imágenes: ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}⚠ Directorio public no encontrado${colors.reset}`);
}

// 3. Análisis de Lighthouse
console.log(`${colors.magenta}\n=== Análisis de Lighthouse ===${colors.reset}`);
console.log(`${colors.yellow}Para ejecutar un análisis Lighthouse completo:${colors.reset}`);
console.log(`  1. Construye tu aplicación: npm run build`);
console.log(`  2. Inicia el servidor: npm run start`);
console.log(`  3. Instala Lighthouse CLI: npm install -g lighthouse`);
console.log(`  4. Ejecuta: lighthouse http://localhost:3000 --view`);

// 4. Recomendaciones de rendimiento
console.log(`${colors.magenta}\n=== Recomendaciones de Rendimiento ===${colors.reset}`);
console.log(`${colors.green}1. Implementación de estrategias de caché${colors.reset}`);
console.log(`   - Configurar Cache-Control headers para activos estáticos`);
console.log(`   - Utilizar SWR o React Query para caching de datos`);
console.log(`${colors.green}2. Carga perezosa (lazy loading)${colors.reset}`);
console.log(`   - Importar componentes con dynamic import: import dynamic from 'next/dynamic'`);
console.log(`${colors.green}3. Optimizar First Contentful Paint${colors.reset}`);
console.log(`   - Precargar recursos críticos`);
console.log(`   - Minimizar CSS en línea crítico`);
console.log(`${colors.green}4. Optimizar API Routes${colors.reset}`);
console.log(`   - Implementar caching en Edge Functions`);
console.log(`   - Optimizar consultas a Supabase`);

// 5. Añadir scripts de optimización al package.json
console.log(`${colors.magenta}\n=== Actualizando package.json con scripts de optimización ===${colors.reset}`);
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Añadir scripts de optimización si no existen
  const newScripts = {
    "analyze": "ANALYZE=true next build",
    "lighthouse": "lighthouse http://localhost:3000 --view",
    "test:integration": "node scripts/run_integration_tests.js",
    "optimize": "node scripts/performance_optimization.js"
  };
  
  let scriptsUpdated = false;
  for (const [key, value] of Object.entries(newScripts)) {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
      scriptsUpdated = true;
    }
  }
  
  if (scriptsUpdated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`${colors.green}✓ Scripts de optimización añadidos a package.json${colors.reset}`);
  } else {
    console.log(`${colors.blue}Scripts de optimización ya existentes en package.json${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error actualizando package.json: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.green}Análisis y recomendaciones de optimización completados.${colors.reset}`);
console.log(`${colors.cyan}Ejecuta 'npm run optimize' para volver a ejecutar este análisis en el futuro.${colors.reset}`); 