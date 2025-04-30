'use client';

import React, { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Importación dinámica del AuthProvider
const AuthProviderComponent = dynamic(
  () => import('../src/components/AuthProviderComponent'),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProviderComponent>
      {children}
    </AuthProviderComponent>
  );
} 