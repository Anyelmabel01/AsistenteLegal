import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainLayout from './components/Layout/MainLayout';
import DocumentUpload from './components/KnowledgeBase/DocumentUpload';
import DocumentsList from './components/KnowledgeBase/DocumentsList';

function App() {
  const { session, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Cargando...</div>;
  }

  if (!session) {
    return showLogin ? (
      <Login onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <Register onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6">Gestión de Documentos Legales</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna para subir documentos */}
        <div className="md:col-span-1">
          <DocumentUpload />
        </div>
        
        {/* Columna para la lista de documentos */}
        <div className="md:col-span-2">
          <DocumentsList />
        </div>
      </div>
    </MainLayout>
  );
}

export default App; 