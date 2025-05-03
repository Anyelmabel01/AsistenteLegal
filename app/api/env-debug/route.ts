import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Esta ruta es solo para depuración, no deberías dejarla en producción
  
  // Verificar variables de entorno directamente
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'No disponible',
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // Mostramos solo los primeros y últimos caracteres por seguridad
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5)}`
        : 'No disponible',
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      // No mostrar el valor completo por seguridad
      value: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 5)}`
        : 'No disponible',
    },
    PERPLEXITY_API_KEY: {
      exists: !!process.env.PERPLEXITY_API_KEY,
      value: process.env.PERPLEXITY_API_KEY
        ? `${process.env.PERPLEXITY_API_KEY.substring(0, 5)}...${process.env.PERPLEXITY_API_KEY.substring(process.env.PERPLEXITY_API_KEY.length - 5)}`
        : 'No disponible',
    },
    NODE_ENV: process.env.NODE_ENV || 'No establecido',
  };

  return NextResponse.json({
    status: 'success',
    variables: envStatus,
    timestamp: new Date().toISOString()
  });
} 