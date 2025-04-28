'use client'; // Marca este componente como un Client Component

import React from 'react';
import dynamic from 'next/dynamic';

// Importar los componentes de forma dinámica
const NavbarComponent = dynamic(() => import('../../components/Navbar'), {
  ssr: false
});

const ClientWrapper = dynamic(() => import('./ClientWrapper'), {
  ssr: false
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ClientWrapper>
      <NavbarComponent />
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </ClientWrapper>
  );
} 