'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/authSafe';

export default function Navbar() {
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { signIn, signUp } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const result = isLogin 
        ? await signIn(email, password)
        : await signUp({ email, password });

      if (result.error) {
        setAuthError(result.error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setAuthError('Error de conexión. Intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!mounted || loading) {
    return (
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-300 h-6 w-32 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-steel-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-navy hover:text-royal transition-colors">
                <span className="text-gold">⚖</span> Lexi
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-6">
              {user ? (
                <>
                  <div className="hidden lg:flex space-x-4">
                    <Link href="/dashboard-old" className="btn-link font-body px-4 py-3 rounded-standard text-sm" prefetch={true}>
                      Panel de Control
                    </Link>
                    <Link href="/casos/nuevo" className="btn-link font-body px-4 py-3 rounded-standard text-sm" prefetch={true}>
                      Nuevo Caso
                    </Link>
                    <Link href="/documentos" className="btn-link font-body px-4 py-3 rounded-standard text-sm" prefetch={true}>
                      Documentos
                    </Link>
                    <Link href="/sitios-oficiales" className="btn-link font-body px-4 py-3 rounded-standard text-sm" prefetch={true}>
                      Recursos Oficiales
                    </Link>
                  </div>
                  
                  {/* Mobile menu - Solo los enlaces principales */}
                  <div className="flex lg:hidden space-x-2">
                    <Link href="/dashboard-old" className="btn-link font-body px-3 py-2 rounded-standard text-xs" prefetch={true}>
                      Panel
                    </Link>
                    <Link href="/casos/nuevo" className="btn-link font-body px-3 py-2 rounded-standard text-xs" prefetch={true}>
                      Casos
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-3 border-l border-steel-300 pl-3 md:pl-6">
                    <div className="text-xs md:text-sm text-navy-600 hidden sm:block">
                      {user.email}
                    </div>
                    <div className="text-xs md:text-sm text-navy-600 sm:hidden">
                      Usuario
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="btn-danger px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">Cerrar Sesión</span>
                      <span className="sm:hidden">Salir</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-primary px-6 py-2 rounded-lg text-sm"
                  >
                    Acceder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Autenticación */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-heading font-bold text-navy mb-3">
                {isLogin ? 'Acceso a su cuenta' : 'Registro profesional'}
              </h2>
              <p className="font-body text-navy-600 text-lg">
                {isLogin ? 'Ingrese sus credenciales para continuar' : 'Complete el formulario para crear su cuenta'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-steel-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-royal transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-steel-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-royal transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  Error: {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full btn-primary py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </span>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-royal hover:text-royal-700 text-sm font-medium"
              >
                {isLogin ? '¿No tiene cuenta? Registrarse' : '¿Ya tiene cuenta? Iniciar sesión'}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-steel-400 hover:text-navy-600 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
} 