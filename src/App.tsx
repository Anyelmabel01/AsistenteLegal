import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainLayout from './components/Layout/MainLayout';
import DocumentUpload from './components/KnowledgeBase/DocumentUpload';

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
      <DocumentUpload />
    </MainLayout>
  );
}

export default App; 