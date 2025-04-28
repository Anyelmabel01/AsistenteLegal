import '../styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'Asistente Legal',
  description: 'Tu asistente legal personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
} 