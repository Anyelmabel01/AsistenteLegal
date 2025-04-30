'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import ClientLayoutWrapper from './ClientLayoutWrapper';
import { AuthProvider } from '../contexts/auth';

interface AuthProviderComponentProps {
  children: ReactNode;
}

export default function AuthProviderComponent({ children }: AuthProviderComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <ClientLayoutWrapper>
        {children}
      </ClientLayoutWrapper>
    </AuthProvider>
  );
} 