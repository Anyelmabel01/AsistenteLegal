import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'; // Asume que tienes tus tipos generados aquí

// Definir una función para crear un cliente Supabase para componentes de servidor,
// rutas de API y acciones de servidor.
// Leer las variables de entorno desde aquí para asegurarnos de que solo se ejecuten en el servidor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createClient() {
  // Verificar si las variables de entorno están configuradas
  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Falta URL o clave de Supabase en las variables de entorno");
    console.error(`URL disponible: ${supabaseUrl ? 'Sí' : 'No'}`);
    console.error(`Key disponible: ${supabaseKey ? 'Sí' : 'No'}`);
    
    // Devolver un cliente mock que no lanzará errores pero no hará nada
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('No se pudo inicializar el cliente Supabase') })
      },
      // Agregar otras funciones mock según sea necesario
    } as any;
  }

  const cookieStore = cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey, // Usar la Service Role Key para operaciones privilegiadas
    // Opcionalmente, si necesitas actuar como el usuario autenticado:
    // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Usar la Anon Key si prefieres actuar como usuario
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      // Opcional: Especificar un esquema diferente si es necesario
      // db: {
      //   schema: 'public',
      // },
      // auth: {
      //   // Deshabilitar persistencia de sesión en el servidor si usas Service Role Key
      //   // o si tu middleware maneja la sesión
      //   persistSession: false,
      //   autoRefreshToken: false,
      //   detectSessionInUrl: false,
      // }
    }
  )
}

// (Opcional pero recomendado) Crear un cliente que use la Service Role Key
// para operaciones administrativas que no deben depender de la sesión del usuario.
// Útil para tareas de backend, migraciones, etc.
/*
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ¡IMPORTANTE: Usar la Service Role Key!
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
*/ 