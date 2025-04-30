const { spawn } = require('child_process');
const path = require('path');

// Ruta al binario de next (en Windows, Linux, macOS)
const nextBinPath = path.join(__dirname, '..', 'node_modules', '.bin', 'next');

console.log('🚀 Iniciando servidor en localhost:3000...');

// Inicia next dev con la configuración para usar localhost
const nextProcess = spawn(
  nextBinPath, 
  ['dev', '--hostname', 'localhost', '--port', '3000'], 
  { 
    stdio: 'inherit',
    shell: true
  }
);

// Manejo de errores
nextProcess.on('error', (error) => {
  console.error('Error al iniciar el servidor:', error);
});

// Manejo de salida
nextProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`El proceso terminó con código: ${code}`);
  }
});

// Manejo de señales para cerrar correctamente
process.on('SIGINT', () => {
  console.log('Deteniendo servidor...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Deteniendo servidor...');
  nextProcess.kill('SIGTERM');
}); 