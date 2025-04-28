'use client';

import ClientPage from '../src/components/ClientPage';
import { AuthProvider } from '../src/contexts/auth';

export default function Page() {
  return (
    <AuthProvider>
      <ClientPage />
    </AuthProvider>
  );
} 