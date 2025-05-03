'use client';

import dynamic from 'next/dynamic';

// Carga dinámica del componente cliente para evitar errores de hidratación
const AuthProviderComponent = dynamic(() => import('../src/components/AuthProviderComponent'), {
  ssr: false,
  loading: () => <div>Cargando...</div>
});

export default function Home() {
  return (
    <AuthProviderComponent>
      {/* El componente ClientPage se carga dentro de AuthProviderComponent */}
    </AuthProviderComponent>
  );
} 