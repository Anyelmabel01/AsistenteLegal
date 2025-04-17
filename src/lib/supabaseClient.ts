import { createClient } from '@supabase/supabase-js';

// Load environment variables in development. In production, these should be set in the environment.
// Note: This basic setup assumes client-side usage. For server-side (Edge Functions),
// environment variables are typically accessed directly via Deno.env.get().
// Also, vite handles env vars automatically using import.meta.env.

// Since we don't have a build tool configured yet that handles env vars,
// we read them directly here. THIS IS NOT IDEAL FOR PRODUCTION BUNDLES.
// A build tool like Vite or Next.js is recommended.

// Access environment variables using Vite's import.meta.env
// Variables must be prefixed with VITE_ in the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables. Did you forget to prefix them with VITE_ in your .env file?');
}

// Temporary direct access for simplicity (replace with build tool integration)
// Ensure your .env file is correctly loaded if running locally without Vite/Next.js
const TEMP_SUPABASE_URL = 'https://rrawbornbfgohynokhzo.supabase.co';
const TEMP_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyYXdib3JuYmZnb2h5bm9raHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDIyNTAsImV4cCI6MjA2MDQ3ODI1MH0.z_Onm3bVK1ZmQFMx23B9JywAyPMNvt5ea2ltL7QyZYM';

if (!TEMP_SUPABASE_URL || !TEMP_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase URL or Anon Key');
  // In a real app, provide default values or throw an error
}

export const supabase = createClient(TEMP_SUPABASE_URL!, TEMP_SUPABASE_ANON_KEY!, {
    auth: {
        // Supabase client handles storage automatically, but you can specify options
        // autoRefreshToken: true,
        // persistSession: true,
        // detectSessionInUrl: false,
    },
});

// Log to confirm (remove in production)
console.log('Supabase client initialized using Vite env vars'); 