'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../contexts/auth';
import dynamic from 'next/dynamic';

// Import components dynamically to avoid server rendering issues
const Login = dynamic(() => import('../../components/Login'), { ssr: false });
const Register = dynamic(() => import('../../components/Register'), { ssr: false });
const ChatInterface = dynamic(() => import('../../components/ChatInterface'), { ssr: false });
const ChatSidebar = dynamic(() => import('../../components/ChatSidebar'), { ssr: false });
const LandingPage = dynamic(() => import('../../components/LandingPage'), { ssr: false });
const ThemeCustomizer = dynamic(() => import('../../components/ThemeCustomizer'), { ssr: false });

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);

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
    // Mostrar landing page profesional primero
    if (showLandingPage) {
      return <LandingPage onGetStarted={() => setShowLandingPage(false)} />;
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
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCustomizeTheme={() => setThemeCustomizerOpen(true)}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>

      {/* Theme Customizer */}
      <ThemeCustomizer 
        isOpen={themeCustomizerOpen}
        onClose={() => setThemeCustomizerOpen(false)}
      />
    </div>
  );
} 