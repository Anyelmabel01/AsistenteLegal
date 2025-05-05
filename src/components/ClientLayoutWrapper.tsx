'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Importar ClientLayout dinámicamente para evitar problemas de hidratación
// const ClientLayout = dynamic(() => import('./ClientLayout'), {
//   ssr: false
// });

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const [mounted, setMounted] = React.useState(false);

  // Solo renderizar en el cliente
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Devolver directamente los children mientras se está cargando
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Devolver directamente los children, ya que el layout principal se encarga
  // return <ClientLayout>{children}</ClientLayout>; 
  return <>{children}</>;
} 