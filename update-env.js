const fs = require('fs');
const path = require('path');

// Nuevas variables de entorno
const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://rrawbornbfgohynokhzo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyYXdib3JuYmZnb2h5bm9raHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDIyNTAsImV4cCI6MjA2MDQ3ODI1MH0.z_Onm3bVK1ZmQFMx23B9JywAyPMNvt5ea2ltL7QyZYM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyYXdib3JuYmZnb2h5bm9raHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkwMjI1MCwiZXhwIjoyMDYwNDc4MjUwfQ.mux_uFtpiMxeixlS15DMPAGSxdkTwo8vaOF3rKhSEVE
PERPLEXITY_API_KEY=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
PERPLEXITY_MODEL=sonar`;

// Ruta al archivo .env.local
const envPath = path.join(__dirname, '.env.local');

// Escribir el archivo
fs.writeFile(envPath, envContent, (err) => {
  if (err) {
    console.error('Error al escribir el archivo .env.local:', err);
    process.exit(1);
  }
  console.log('Archivo .env.local actualizado correctamente');
  console.log('Reinicia el servidor para aplicar los cambios');
});