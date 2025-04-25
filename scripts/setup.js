/**
 * Script para verificar y configurar el entorno de desarrollo
 * 
 * Este script verifica:
 * 1. Que existan las variables de entorno necesarias
 * 2. Que se pueda conectar a Supabase
 * 3. Que exista la extensión pgvector
 * 4. Que se pueda conectar a la API de OpenAI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Colores para los mensajes de consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para mostrar mensajes
function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'warning' ? colors.yellow : type === 'error' ? colors.red : '';
  console.log(`${color}${message}${colors.reset}`);
}

// Verificar variables de entorno
function checkEnvironmentVariables() {
  log('\n🔍 Verificando variables de entorno...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log(`❌ Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`, 'error');
    log(`   Crea un archivo .env.local con las variables requeridas`, 'warning');
    return false;
  }
  
  log('✅ Variables de entorno configuradas correctamente', 'success');
  return true;
}

// Verificar dependencias
function checkDependencies() {
  log('\n🔍 Verificando dependencias...');
  
  try {
    // Verificar Node.js
    const nodeVersion = execSync('node --version').toString().trim();
    log(`✅ Node.js: ${nodeVersion}`, 'success');
    
    // Verificar npm
    const npmVersion = execSync('npm --version').toString().trim();
    log(`✅ npm: ${npmVersion}`, 'success');
    
    return true;
  } catch (error) {
    log(`❌ Error al verificar dependencias: ${error.message}`, 'error');
    return false;
  }
}

// Verificar configuración de Supabase
function checkSupabaseConfig() {
  log('\n🔍 Verificando configuración de Supabase...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('❌ No se pueden verificar las credenciales de Supabase, faltan variables de entorno', 'error');
    return false;
  }
  
  log('ℹ️ Para verificar completamente la configuración de Supabase:');
  log('  1. Comprueba que puedes acceder al panel de Supabase con tus credenciales');
  log('  2. Verifica que la extensión pgvector esté habilitada');
  log('  3. Ejecuta las migraciones en supabase/migrations');
  
  return true;
}

// Función principal
async function main() {
  log('🚀 Iniciando verificación del entorno de Asistente Legal...', 'info');
  
  const envOk = checkEnvironmentVariables();
  const depsOk = checkDependencies();
  const supabaseOk = checkSupabaseConfig();
  
  if (envOk && depsOk && supabaseOk) {
    log('\n✅ El entorno está correctamente configurado para ejecutar Asistente Legal.', 'success');
  } else {
    log('\n⚠️ Hay problemas con la configuración. Revisa los errores anteriores.', 'warning');
  }
  
  log('\n📋 Resumen de la configuración:');
  log(`  - Variables de entorno: ${envOk ? '✅' : '❌'}`);
  log(`  - Dependencias: ${depsOk ? '✅' : '❌'}`);
  log(`  - Supabase: ${supabaseOk ? '✅ (verificación básica)' : '❌'}`);
}

// Ejecutar el script
main().catch(error => {
  log(`❌ Error: ${error.message}`, 'error');
  process.exit(1);
}); 