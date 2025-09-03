'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/authSafe';
import Navbar from '../../components/Navbar';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-steel-50 via-white to-royal-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="bg-gradient-to-r from-navy to-royal text-white rounded-3xl p-12 shadow-2xl">
          <h1 className="text-5xl font-heading font-bold mb-6">
            <span className="text-gold">⚖</span> Lexi
          </h1>
          <p className="text-xl font-body text-navy-100 mb-8">
            Su asistente legal inteligente para el sistema jurídico panameño
          </p>
          {user ? (
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <p className="text-lg font-body">
                Bienvenido, <span className="font-semibold">{user.email}</span>
              </p>
              <p className="text-gold-200 mt-1">Sistema legal inteligente a su servicio</p>
            </div>
          ) : (
            <p className="text-navy-200 font-body">
              Inicie sesión para acceder a todas las funciones profesionales
            </p>
          )}
        </div>
      </div>

      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Chat Legal IA - Destacado */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-br from-royal to-royal-700 text-white rounded-3xl p-8 shadow-xl card-interactive">
              <div className="text-4xl mb-4 text-gold">⚖</div>
              <h3 className="font-heading font-bold text-2xl mb-4">Consultor Legal</h3>
              <p className="font-body text-royal-100 mb-8">
                Consulte con Lexi, su asistente legal inteligente. Obtenga respuestas precisas a sus consultas jurídicas.
              </p>
              <Link 
                href="/" 
                className="inline-block bg-white text-royal px-8 py-4 rounded-standard font-body font-semibold hover:bg-royal-50 transition-all duration-300 transform hover:scale-105"
                prefetch={true}
              >
Consultar con Lexi
              </Link>
            </div>
          </div>

          {/* Casos Legales */}
          <div className="bg-white rounded-3xl p-8 shadow-lg card-interactive border border-steel-100">
            <div className="text-4xl text-gold mb-4">⚖</div>
            <h3 className="font-heading font-bold text-2xl text-navy mb-4">Gestión de Casos</h3>
            <p className="font-body text-navy-600 mb-8">
              Administre y organice todos sus expedientes legales de forma profesional.
            </p>
            <Link 
              href="/casos/nuevo" 
              className="btn-accent px-8 py-4 rounded-standard font-body hover:text-white"
              prefetch={true}
            >
Crear Nuevo Caso
            </Link>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-steel-100">
            <div className="text-4xl text-royal mb-4">⚖</div>
            <h3 className="font-heading font-bold text-2xl text-navy mb-4">Documentos</h3>
            <p className="font-body text-navy-600 mb-8">
              Sube, analiza y gestiona tus documentos legales con IA.
            </p>
            <Link 
              href="/documentos" 
              className="inline-block bg-royal text-white px-8 py-4 rounded-2xl font-body font-semibold hover:bg-royal-700 transition-all duration-300 transform hover:scale-105"
              prefetch={true}
            >
Ver Documentos
            </Link>
          </div>


          {/* Sitios Oficiales */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-navy to-navy-800 text-white rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl mb-4 text-gold">⚖</div>
                  <h3 className="font-heading font-bold text-2xl mb-4">Sitios Oficiales</h3>
                  <p className="font-body text-navy-200 mb-6">
                    Enlaces directos a recursos legales oficiales de Panamá
                  </p>
                </div>
                <Link 
                  href="/sitios-oficiales" 
                  className="bg-white text-navy px-8 py-4 rounded-2xl font-body font-semibold hover:bg-steel-50 transition-all duration-300 transform hover:scale-105"
                  prefetch={false}
                >
Acceder a Recursos
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-white rounded-3xl p-12 shadow-lg border border-steel-200">
            <div className="text-6xl mb-6 text-gold">⚖</div>
            <h2 className="text-3xl font-heading font-bold text-navy mb-6">
Bienvenido a Lexi
            </h2>
            <p className="text-xl font-body text-navy-600 mb-10">
              Para comenzar a usar tu asistente legal personal, solo necesitas crear una cuenta. ¡Es gratis y súper rápido! ✨
            </p>
            <div className="bg-steel-50 rounded-2xl p-8 mb-10">
              <h3 className="font-heading font-semibold text-navy mb-6 text-lg">¿Qué funciones están disponibles?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base font-body text-navy-600">
                <div className="flex items-center">
                  <span className="text-royal mr-3 text-xl">•</span>
                  <span>Consulte con Lexi 24/7</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gold mr-3 text-xl">•</span>
                  <span>Gestione sus casos eficientemente</span>
                </div>
                <div className="flex items-center">
                  <span className="text-royal mr-3 text-xl">•</span>
                  <span>Analice documentos profesionalmente</span>
                </div>
                <div className="flex items-center">
                  <span className="text-navy mr-3 text-xl">•</span>
                  <span>Reciba notificaciones importantes</span>
                </div>
              </div>
            </div>
            <p className="font-body text-navy-500 text-lg text-center bg-steel-100 rounded-2xl p-4">
Use el botón "Acceder" en la barra superior para iniciar sesión
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}