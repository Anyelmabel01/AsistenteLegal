'use client';
import React, { useState } from 'react';

export default function SitiosOficiales() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  const sitiosOficiales = [
    {
      nombre: 'Órgano Judicial de Panamá',
      url: 'https://www.organojudicial.gob.pa/',
      descripcion: 'Portal oficial del Órgano Judicial de la República de Panamá.',
      imagenUrl: '/sitios/organo-judicial.jpg'
    },
    {
      nombre: 'Asamblea Nacional de Panamá',
      url: 'https://www.asamblea.gob.pa/',
      descripcion: 'Sitio web de la Asamblea Nacional, donde se puede consultar leyes y anteproyectos.',
      imagenUrl: '/sitios/asamblea-nacional.jpg'
    },
    {
      nombre: 'Procuraduría General de la Nación',
      url: 'https://ministeriopublico.gob.pa/',
      descripcion: 'Portal del Ministerio Público de Panamá.',
      imagenUrl: '/sitios/procuraduria.jpg'
    },
    {
      nombre: 'Gaceta Oficial',
      url: 'https://www.gacetaoficial.gob.pa/',
      descripcion: 'Publicación oficial de todas las leyes, decretos y resoluciones del Estado panameño.',
      imagenUrl: '/sitios/gaceta-oficial.jpg'
    },
    {
      nombre: 'Ministerio de Trabajo',
      url: 'https://www.mitradel.gob.pa/',
      descripcion: 'Portal del Ministerio de Trabajo y Desarrollo Laboral de Panamá.',
      imagenUrl: '/sitios/mitradel.jpg'
    },
    {
      nombre: 'Registro Público de Panamá',
      url: 'https://www.registro-publico.gob.pa/',
      descripcion: 'Sitio oficial del Registro Público de Panamá.',
      imagenUrl: '/sitios/registro-publico.jpg'
    }
  ];

  const handleLoadingChange = (url: string, isLoaded: boolean) => {
    setLoading(prev => ({...prev, [url]: isLoaded}));
  };

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? sitiosOficiales.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === sitiosOficiales.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Obtiene el sitio actual
  const currentSite = sitiosOficiales[currentIndex];

  return (
    <div className="py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Sitios Oficiales</h1>
      <p className="text-center mb-8 text-gray-600 max-w-3xl mx-auto">
        A continuación encontrarás enlaces a sitios web oficiales relacionados con temas legales en Panamá. 
        Estos recursos pueden ser útiles para consultar leyes, jurisprudencia y procedimientos legales.
        Navega entre los diferentes sitios usando las flechas laterales.
      </p>

      {/* Carrusel con sitio actual */}
      <div className="relative max-w-5xl mx-auto">
        {/* Botón anterior */}
        <button 
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-r-md hover:bg-opacity-70 transition-all"
          aria-label="Sitio anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Vista actual */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative aspect-[16/9] w-full">
            <div className="w-full h-full bg-gray-100">
              <iframe 
                src={currentSite.url} 
                className="w-full h-full border-none"
                title={currentSite.nombre}
                onLoad={() => handleLoadingChange(currentSite.url, true)}
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              />
              {!loading[currentSite.url] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-3">{currentSite.nombre}</h2>
            <p className="text-gray-600 mb-4">{currentSite.descripcion}</p>
            <div className="flex justify-between items-center">
              <a 
                href={currentSite.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition inline-flex items-center"
              >
                Visitar sitio
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="text-gray-500">
                {currentIndex + 1} de {sitiosOficiales.length}
              </div>
            </div>
          </div>
        </div>

        {/* Botón siguiente */}
        <button 
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-l-md hover:bg-opacity-70 transition-all"
          aria-label="Sitio siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Indicadores de posición */}
      <div className="flex justify-center mt-6 space-x-2">
        {sitiosOficiales.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`Ir al sitio ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-10 text-center text-gray-600">
        <p className="text-sm">
          Nota: La vista previa de los sitios puede no mostrarse correctamente debido a restricciones de seguridad de los navegadores.
          Haz clic en "Visitar sitio" para acceder directamente a la página oficial.
        </p>
      </div>
    </div>
  );
} 