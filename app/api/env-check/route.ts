import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // Autenticación - solo usuarios autenticados pueden verificar variables de entorno
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar variables de entorno críticas (sin mostrar valores completos)
  const envStatus = {
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY 
      ? `Configurada (comienza con ${process.env.PERPLEXITY_API_KEY.substring(0, 3)}...)` 
      : 'No configurada',
    PERPLEXITY_API_BASE_URL: process.env.PERPLEXITY_API_BASE_URL || 'Usando valor por defecto',
    NODE_ENV: process.env.NODE_ENV || 'No establecido',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? 'Configurada' 
      : 'No configurada',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? 'Configurada' 
      : 'No configurada',
  };

  return NextResponse.json({
    status: 'success',
    environment: process.env.NODE_ENV,
    variables: envStatus,
    timestamp: new Date().toISOString()
  });
} 