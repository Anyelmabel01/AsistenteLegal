'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import UpdatesPanel from '../../components/UpdatesPanel';
import NotificationCenter from '../../components/NotificationCenter';
import DocumentUploader from '../../components/DocumentUploader';
import DocumentList from '../../components/DocumentList';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('updates');

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Cargando...</p></div>;
  }

  if (!user) {
    return null; // No renderizar nada mientras se redirige
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Panel de Control</h1>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('updates')}
            className={`py-4 px-6 font-medium text-sm border-b-2 mr-8 ${
              activeTab === 'updates' 
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Actualizaciones Legales
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-6 font-medium text-sm border-b-2 mr-8 ${
              activeTab === 'documents' 
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'notifications' 
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Centro de Notificaciones
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'updates' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Actualizaciones Legales Recientes</h2>
            <p className="text-gray-600 mb-4">Aquí podrás ver las últimas actualizaciones de las fuentes legales que estás siguiendo.</p>
            <UpdatesPanel />
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Gestión de Documentos</h2>
            <p className="text-gray-600 mb-4">Sube y gestiona tus documentos legales para su análisis y procesamiento.</p>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Subir Nuevo Documento</h3>
              <DocumentUploader />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Mis Documentos</h3>
              <DocumentList />
            </div>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Centro de Notificaciones</h2>
            <p className="text-gray-600 mb-4">Revisa tus notificaciones personalizadas sobre actualizaciones legales relevantes para ti.</p>
            <NotificationCenter />
          </div>
        )}
      </div>
    </div>
  );
} 