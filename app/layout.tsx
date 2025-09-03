import './globals.css';
import React from 'react';
import { Inter, Nunito } from 'next/font/google';
import { AuthProvider } from '../lib/authSafe';
import LayoutWrapper from '../components/LayoutWrapper';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const nunito = Nunito({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito'
});

export const metadata = {
  title: 'Lexi',
  description: 'Lexi, tu asistente legal personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body 
        className={`${inter.variable} ${nunito.variable} font-body antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
} 