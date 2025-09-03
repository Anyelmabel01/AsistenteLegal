'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../contexts/auth';
import dynamic from 'next/dynamic';

// Import components dynamically to avoid server rendering issues
const Login = dynamic(() => import('../../components/Login'), { ssr: false });
const Register = dynamic(() => import('../../components/Register'), { ssr: false });
const ChatInterface = dynamic(() => import('../../components/ChatInterface'), { ssr: false });
const ChatSidebar = dynamic(() => import('../../components/ChatSidebar'), { ssr: false });

// Define Document interface
interface Document {
  id: string;
  name: string;
  type: string;
  source: string;
  user_id: string;
  created_at: string;
}

export default function ClientPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Display nothing while client-side JavaScript is loading
  if (!isMounted) {
    return null;
  }

  // Show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    // Mostrar landing page primero
    if (showLandingPage) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Hero Section */}
          <div className="container mx-auto px-6 py-16 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <span className="text-6xl">⚖️</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-800 mb-6">
                Bienvenido a Lexi
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Tu asistente legal inteligente especializado en el sistema jurídico panameño. 
                Obtén respuestas precisas, análisis de documentos y asesoría legal profesional 24/7.
              </p>
              
              {/* Features */}
              <div className="grid md:grid-cols-3 gap-8 my-12">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold mb-2">IA Especializada</h3>
                  <p className="text-gray-600">Entrenada específicamente en leyes y procedimientos de Panamá</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold mb-2">Análisis de Documentos</h3>
                  <p className="text-gray-600">Sube tus documentos legales y obtén análisis detallados</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl mb-4">⏰</div>
                  <h3 className="text-xl font-semibold mb-2">Disponible 24/7</h3>
                  <p className="text-gray-600">Asesoría legal cuando la necesites, sin horarios limitados</p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowLandingPage(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Empezar Ahora - ¡Es Gratis!
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                No necesitas tarjeta de crédito • Registro en 30 segundos
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Mostrar login/registro después del landing
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {showLogin ? (
            <Login onSwitch={() => setShowLogin(false)} />
          ) : (
            <Register onSwitch={() => setShowLogin(true)} />
          )}
          <div className="text-center">
            <button
              onClick={() => setShowLandingPage(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Chat Sidebar with folders, chats, etc. */}
      <ChatSidebar />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
} 