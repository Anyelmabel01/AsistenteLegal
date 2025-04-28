'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar ClientProviders de forma dinámica para evitar problemas de hidratación
const ClientProviders = dynamic(() => import('./ClientProviders'), {
  ssr: false, // Desactivar renderizado en el servidor
});

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Sólo renderizar en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // No mostrar nada hasta que el componente esté montado en el cliente
  if (!mounted) {
    return <>{children}</>;
  }

  return <ClientProviders>{children}</ClientProviders>;
} 