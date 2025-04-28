import '../styles/globals.css';
import React from 'react';
import dynamic from 'next/dynamic';

// Importar el componente Navbar de forma dinámica para evitar problemas de hidratación
const NavbarComponent = dynamic(() => import('../components/Navbar'), {
  ssr: false
});

// Importar ClientWrapper para la autenticación
const ClientWrapper = dynamic(() => import('../src/components/ClientWrapper'), {
  ssr: false
});

export const metadata = {
  title: 'Asistente Legal',
  description: 'Tu asistente legal personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientWrapper>
          <NavbarComponent />
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </ClientWrapper>
      </body>
    </html>
  );
} 