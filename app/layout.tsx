import '../styles/globals.css';
import React from 'react';
import ClientLayout from '../src/components/ClientLayout';

export const metadata = {
  title: 'Asistente Legal',
  description: 'Tu asistente legal personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 