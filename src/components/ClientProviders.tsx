'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/auth';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  // Capturar errores
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ClientProviders error:', error);
      setError(error.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Mostrar un mensaje de error si algo falla
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">Error en la aplicación</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 