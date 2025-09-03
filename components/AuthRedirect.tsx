'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/authSafe';

export default function AuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && pathname === '/') {
      // Solo redirigir si estamos en la página principal y hay un usuario logueado
      router.push('/chat');
    }
  }, [user, loading, pathname, router]);

  return null; // Este componente no renderiza nada
}