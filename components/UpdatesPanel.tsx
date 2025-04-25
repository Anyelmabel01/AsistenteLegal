'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import { useAuth } from '../src/contexts/AuthContext';

type LegalUpdate = {
  id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  source_type: string;
  is_new: boolean;
};

export default function UpdatesPanel() {
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('legal_updates')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

      if (filter !== 'all') {
        query = query.eq('source', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching updates:', error);
        return;
      }

      setUpdates(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra las actualizaciones por fuente
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    fetchUpdates();
  };

  // Formatea la fecha para mostrarla en un formato más amigable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-full ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => handleFilterChange('Gaceta Oficial')}
          className={`px-4 py-2 text-sm font-medium rounded-full ${
            filter === 'Gaceta Oficial'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Gaceta Oficial
        </button>
        <button
          onClick={() => handleFilterChange('Organo Judicial')}
          className={`px-4 py-2 text-sm font-medium rounded-full ${
            filter === 'Organo Judicial'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Órgano Judicial
        </button>
      </div>

      {/* Lista de actualizaciones */}
      {updates.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay actualizaciones disponibles
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className={`border ${
                update.is_new ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              } rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{update.title}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                      {update.source}
                    </span>
                    {formatDate(update.published_at)}
                  </p>
                </div>
                {update.is_new && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Nuevo
                  </span>
                )}
              </div>
              <p className="mt-2 text-gray-700">{update.description}</p>
              <div className="mt-3">
                <a
                  href={update.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  Ver documento completo
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 