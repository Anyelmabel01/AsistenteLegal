'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  ScaleIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: ScaleIcon,
      title: "Análisis Legal Especializado",
      description: "IA entrenada específicamente en el marco jurídico panameño con acceso a códigos, leyes y jurisprudencia actualizada."
    },
    {
      icon: DocumentTextIcon,
      title: "Procesamiento de Documentos",
      description: "Sube contratos, demandas o cualquier documento legal para obtener análisis detallados y recomendaciones profesionales."
    },
    {
      icon: ClockIcon,
      title: "Respuestas en Tiempo Real",
      description: "Obtén análisis jurídicos completos en minutos, no días. Disponible 24/7 para consultas urgentes."
    },
    {
      icon: ShieldCheckIcon,
      title: "Seguridad y Confidencialidad",
      description: "Tus consultas y documentos están protegidos con encriptación de nivel bancario y cumplimiento GDPR."
    },
    {
      icon: UserGroupIcon,
      title: "Respaldado por Profesionales",
      description: "Desarrollado en colaboración con abogados panameños experimentados para garantizar precisión legal."
    },
    {
      icon: CheckCircleIcon,
      title: "Citas Legales Precisas",
      description: "Cada respuesta incluye referencias exactas a artículos, códigos y normativas aplicables del derecho panameño."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en menos de 30 segundos. No requiere tarjeta de crédito."
    },
    {
      number: "02", 
      title: "Haz tu Consulta",
      description: "Escribe tu pregunta legal o sube documentos para análisis profesional."
    },
    {
      number: "03",
      title: "Recibe Análisis Completo",
      description: "Obtén respuestas estructuradas con fundamentos legales, plazos y recomendaciones."
    }
  ];

  const testimonials = [
    {
      name: "Dr. María González",
      role: "Abogada Civilista",
      company: "Bufete González & Asociados",
      content: "Lexi me ahorra horas de investigación. Sus análisis son precisos y las citas legales siempre están actualizadas. Una herramienta indispensable para mi práctica."
    },
    {
      name: "Lic. Roberto Mendez",
      role: "Abogado Corporativo",
      company: "Estudio Jurídico Mendez",
      content: "La capacidad de Lexi para analizar contratos complejos es impresionante. Me permite ofrecer un mejor servicio a mis clientes con respuestas más rápidas y precisas."
    },
    {
      name: "Lcda. Carmen Torres",
      role: "Abogada Laboralista",
      company: "Torres Legal Group",
      content: "Como especialista en derecho laboral, necesito respuestas rápidas sobre la legislación. Lexi me proporciona análisis detallados que complementan perfectamente mi expertise."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <ScaleIcon className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Lexi</span>
              <span className="text-sm text-gray-500 font-medium">Legal AI</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Tu Asistente Legal 
              <span className="text-blue-600 block">Inteligente</span>
              <span className="text-gray-700">para Panamá</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Obtén análisis jurídicos precisos, consultas especializadas y procesamiento de documentos legales 
              las 24 horas, respaldado por la legislación panameña actualizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Empezar Gratis
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-lg text-lg hover:border-gray-400 transition-colors duration-200">
                Ver Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ Sin tarjeta de crédito ✓ Registro en 30 segundos ✓ Acceso inmediato
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Lexi?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desarrollado específicamente para profesionales del derecho y ciudadanos que necesitan 
              orientación legal precisa en el sistema jurídico panameño.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-gray-600">
              Tres simples pasos para obtener asesoría legal profesional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 text-white text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Confiado por profesionales
            </h2>
            <p className="text-xl text-gray-600">
              Abogados panameños ya están utilizando Lexi para mejorar su práctica legal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-blue-600">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Sobre Lexi Legal AI
              </h2>
              <div className="space-y-6 text-gray-600">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nuestra Misión</h3>
                  <p>Democratizar el acceso a la información jurídica de calidad en Panamá, proporcionando herramientas de inteligencia artificial que complementen y potencien el trabajo de profesionales del derecho.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nuestra Visión</h3>
                  <p>Ser la plataforma líder de asistencia legal inteligente en Panamá, reconocida por su precisión, confiabilidad y contribución al acceso equitativo a la justicia.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nuestros Valores</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Precisión y rigor en cada análisis legal</li>
                    <li>Transparencia en nuestras fuentes y metodologías</li>
                    <li>Confidencialidad absoluta de la información</li>
                    <li>Compromiso con la excelencia profesional</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Respaldado por expertos</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span>Desarrollado con abogados panameños</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span>Actualizado con legislación vigente</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span>Validado por profesionales del derecho</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span>Cumplimiento de estándares éticos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comienza tu consulta legal ahora
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a cientos de profesionales que ya confían en Lexi para sus análisis legales diarios.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg"
          >
            Empezar Gratis Ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ScaleIcon className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">Lexi</span>
              </div>
              <p className="text-gray-400">
                Asistente legal inteligente para profesionales del derecho en Panamá.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Características</a></li>
                <li><a href="#" className="hover:text-white">Precios</a></li>
                <li><a href="#" className="hover:text-white">Documentación</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
                <li><a href="#" className="hover:text-white">Carrera</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Términos</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
                <li><a href="#" className="hover:text-white">Aviso Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lexi Legal AI. Todos los derechos reservados. Desarrollado para profesionales del derecho panameño.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}