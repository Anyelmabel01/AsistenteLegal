import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  file_name: string;
  document_type: string;
  content: string;
  similarity: number;
}

const SemanticSearch: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      // Hacer una llamada a la API para generar embeddings y buscar similitudes
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          userId: user.id,
          limit: 10,
          threshold: 0.7
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la búsqueda');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error('Error en búsqueda semántica:', err);
      setError(err.message || 'Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const highlightMatch = (content: string, query: string) => {
    // Implementación simple que resalta las palabras del query
    // En una búsqueda semántica real esto debería ser más sofisticado
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    return content.replace(regex, match => `<mark class="bg-yellow-200">${match}</mark>`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Búsqueda Semántica</h3>
        <p className="text-sm text-gray-500 mb-4">
          Busca información relevante en tus documentos legales utilizando lenguaje natural.
        </p>

        <form onSubmit={handleSearch}>
          <div className="flex">
            <div className="relative flex-grow">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en documentos..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Buscar
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searched && !loading && !error && (
          <div className="mt-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              {results.length === 0 
                ? 'No se encontraron resultados' 
                : `${results.length} resultados encontrados`}
            </h4>

            {results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={`${result.id}-${result.content.slice(0, 20)}`} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-sm font-medium text-blue-600">{result.file_name}</h5>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {Math.round(result.similarity * 100)}% relevante
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span 
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatch(result.content, query) 
                        }} 
                      />
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 capitalize">{result.document_type}</span>
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => {/* Implementar ver documento completo */}}
                      >
                        Ver documento completo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticSearch; 