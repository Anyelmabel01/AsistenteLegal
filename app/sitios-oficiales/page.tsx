import React from 'react';
import Link from 'next/link';

export default function SitiosOficiales() {
  const sitiosOficiales = [
    {
      nombre: 'Órgano Judicial de Panamá',
      url: 'https://www.organojudicial.gob.pa/',
      descripcion: 'Portal oficial del Órgano Judicial de la República de Panamá.'
    },
    {
      nombre: 'Asamblea Nacional de Panamá',
      url: 'https://www.asamblea.gob.pa/',
      descripcion: 'Sitio web de la Asamblea Nacional, donde se puede consultar leyes y anteproyectos.'
    },
    {
      nombre: 'Procuraduría General de la Nación',
      url: 'https://ministeriopublico.gob.pa/',
      descripcion: 'Portal del Ministerio Público de Panamá.'
    },
    {
      nombre: 'Gaceta Oficial',
      url: 'https://www.gacetaoficial.gob.pa/',
      descripcion: 'Publicación oficial de todas las leyes, decretos y resoluciones del Estado panameño.'
    },
    {
      nombre: 'Ministerio de Trabajo',
      url: 'https://www.mitradel.gob.pa/',
      descripcion: 'Portal del Ministerio de Trabajo y Desarrollo Laboral de Panamá.'
    },
    {
      nombre: 'Registro Público de Panamá',
      url: 'https://www.registro-publico.gob.pa/',
      descripcion: 'Sitio oficial del Registro Público de Panamá.'
    }
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Sitios Oficiales</h1>
      <p className="text-center mb-8 text-gray-600 max-w-3xl mx-auto">
        A continuación encontrarás enlaces a sitios web oficiales relacionados con temas legales en Panamá. 
        Estos recursos pueden ser útiles para consultar leyes, jurisprudencia y procedimientos legales.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {sitiosOficiales.map((sitio, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{sitio.nombre}</h2>
            <p className="text-gray-600 mb-4">{sitio.descripcion}</p>
            <a 
              href={sitio.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
            >
              Visitar sitio
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 