// Script para diagnosticar problemas en la aplicación Next.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando diagnóstico de la aplicación...');

// Verificar archivos críticos
const criticalFiles = [
  'next.config.mjs',
  'package.json',
  'app/layout.tsx',
  'app/page.tsx',
  '.eslintrc.json'
];

console.log('\n📋 Verificando archivos críticos:');
criticalFiles.forEach(file => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} no encontrado`);
    }
  } catch (error) {
    console.log(`❌ Error al verificar ${file}: ${error.message}`);
  }
});

// Verificar dependencias
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = require('./package.json');
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];
  criticalDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} no encontrado en package.json`);
    }
  });
  
} catch (error) {
  console.log(`❌ Error al verificar dependencias: ${error.message}`);
}

// Verificar estructura de directorios
console.log('\n📁 Verificando estructura de directorios:');
const requiredDirs = ['app', 'components', 'public', 'styles', 'src'];
requiredDirs.forEach(dir => {
  try {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      console.log(`✅ /${dir}`);
    } else {
      console.log(`❌ /${dir} no encontrado o no es un directorio`);
    }
  } catch (error) {
    console.log(`❌ Error al verificar /${dir}: ${error.message}`);
  }
});

// Verificar archivo tsconfig.json
console.log('\n⚙️ Verificando configuración TypeScript:');
try {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = require('./tsconfig.json');
    console.log('✅ tsconfig.json encontrado');
    
    if (tsconfig.compilerOptions) {
      console.log('✅ compilerOptions encontrado');
      
      if (tsconfig.compilerOptions.jsx) {
        console.log(`✅ jsx: ${tsconfig.compilerOptions.jsx}`);
      } else {
        console.log('❌ jsx no definido en compilerOptions');
      }
    } else {
      console.log('❌ compilerOptions no encontrado en tsconfig.json');
    }
  } else {
    console.log('❌ tsconfig.json no encontrado');
  }
} catch (error) {
  console.log(`❌ Error al verificar tsconfig.json: ${error.message}`);
}

console.log('\n🔍 Diagnóstico completado.');
console.log('\n💡 Sugerencias:');
console.log('1. Intenta ejecutar "npm cache clean --force" y luego "npm install"');
console.log('2. Verifica que no haya errores de sintaxis en tus componentes principales');
console.log('3. Revisa las importaciones circulares en tu código');
console.log('4. Prueba eliminando la carpeta .next y volviendo a ejecutar npm run dev');
console.log('5. Considera crear un nuevo proyecto Next.js y mover gradualmente tus componentes'); 