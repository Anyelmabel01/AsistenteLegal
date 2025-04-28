import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainLayout from './components/Layout/MainLayout';
import DocumentUpload from './components/KnowledgeBase/DocumentUpload';
import DocumentsList from './components/KnowledgeBase/DocumentsList';
import CaseList from './components/Cases/CaseList';
import CaseDetail from './components/Cases/CaseDetail';
import SearchPage from './components/Search/SearchPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const { session, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Cargando...</div>;
  }

  const UnauthenticatedRoutes = (
    <Routes>
      <Route path="/login" element={showLogin ? <Login onSwitchToRegister={() => setShowLogin(false)} /> : <Navigate to="/register" replace />} />
      <Route path="/register" element={!showLogin ? <Register onSwitchToLogin={() => setShowLogin(true)} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  const AuthenticatedRoutes = (
    <MainLayout>
      <Routes>
        <Route path="/upload" element={<DocumentUpload />} />
        <Route path="/search" element={<SearchPage />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:caseId" element={<CaseDetail />} />
        </Route>
        <Route path="/" element={<Navigate to="/upload" replace />} />
      </Routes>
    </MainLayout>
  );

  return session ? AuthenticatedRoutes : UnauthenticatedRoutes;
}

export default App; 