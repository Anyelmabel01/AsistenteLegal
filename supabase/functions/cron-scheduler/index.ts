// Supabase Edge Function para programar el monitoreo de plazos legales
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inicializamos el cliente de Supabase desde las variables de entorno
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  try {
    // Validar la solicitud
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Crear cliente con permisos de servicio
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Invocar la función de monitoreo de plazos
    const { data, error } = await supabase.functions.invoke('monitor-legal-deadlines', {
      body: {},
    });
    
    if (error) {
      throw new Error(`Error al invocar función de monitoreo: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Función de monitoreo ejecutada correctamente',
        result: data
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error en programador de monitoreo:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 