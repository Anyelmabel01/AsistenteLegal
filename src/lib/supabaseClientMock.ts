import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credenciales de desarrollo temporales (solo para desarrollo)
const MOCK_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const MOCK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Cliente de simulación para desarrollo
const mockSupabaseClient = createClient(MOCK_SUPABASE_URL, MOCK_SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  }
});

// Simulación de métodos básicos de autenticación
const mockAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => {}
      }
    }
  }),
  signInWithPassword: async () => ({ data: null, error: { message: 'Modo de desarrollo: no hay autenticación real' } }),
  signUp: async () => ({ data: null, error: { message: 'Modo de desarrollo: no hay registro real' } }),
  signOut: async () => ({ error: null })
};

// Sobrescribimos los métodos de auth con nuestras simulaciones
mockSupabaseClient.auth = mockAuth as any;

// Exportamos el cliente de simulación
export const supabase = mockSupabaseClient;
export default supabase; 