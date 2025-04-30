#!/usr/bin/env node

// Force using only localhost without exposing to network
process.env.HOSTNAME = 'localhost';
process.env.HOST = 'localhost';
process.env.NEXT_PUBLIC_LOCALHOST_ONLY = 'true';

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor exclusivamente en localhost:3000...');

// Ruta al binario de next
const nextBin = path.join(__dirname, '..', 'node_modules', '.bin', 'next');

// Opciones para forzar solo localhost
const options = [
  'dev',
  '-H', 'localhost', 
  '--port', '3000',
  '--hostname', 'localhost'
];

// Iniciar el proceso
const nextProcess = spawn(nextBin, options, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Desactivar exponer a la red
    HOSTNAME: 'localhost',
    HOST: 'localhost',
    NEXT_HOSTNAME: 'localhost',
    NEXT_HOST: 'localhost'
  }
});

// Manejar errores
nextProcess.on('error', (error) => {
  console.error('Error al iniciar Next.js:', error);
  process.exit(1);
});

// Manejar finalización
nextProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Next.js terminó con código: ${code}`);
    process.exit(code);
  }
});

// Capturar señales para cerrar correctamente
process.on('SIGINT', () => {
  console.log('Deteniendo servidor...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Deteniendo servidor...');
  nextProcess.kill('SIGTERM');
}); 