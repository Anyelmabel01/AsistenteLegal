import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
<<<<<<< HEAD
import { useAuth } from '../../contexts/AuthContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  file_name: string;
  document_type: string;
=======
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Define the structure of a search result item (context)
interface SearchResult {
  id: number;
  document_id: string;
>>>>>>> 89697c5a557e86f039dab3ac1d452b0ccdb181e6
  content: string;
  similarity: number;
}

const SemanticSearch: React.FC = () => {
<<<<<<< HEAD
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
=======
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]); // Stores context snippets
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null); // Stores the LLM generated answer
  const [loading, setLoading] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false); // Separate loading state for answer generation
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Por favor, ingresa una pregunta para buscar.');
      setResults([]);
      setFinalAnswer(null);
      return;
    }

    setLoading(true);
    setLoadingAnswer(false); // Reset answer loading state
    setError(null);
    setResults([]);
    setFinalAnswer(null);

    try {
      // --- Step 1: Invoke 'search-documents' to get context --- 
      console.log('Step 1: Searching for relevant documents...');
      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        'search-documents',
        {
          body: { query },
        }
      );

      if (searchError) {
        if (searchError instanceof Error && searchError.message.includes('Function not found')) {
          throw new Error('Error: La función de búsqueda (search-documents) no está disponible.');
        } else {
          throw new Error(`Error buscando documentos: ${searchError.message}`);
        }
      }

      if (searchData && searchData.error) {
        throw new Error(`Error en la búsqueda de documentos: ${searchData.error}`);
      }

      const retrievedDocs = searchData?.documents as SearchResult[] | undefined;

      if (!retrievedDocs || retrievedDocs.length === 0) {
        setResults([]);
        setError('No se encontraron documentos relevantes para tu consulta.');
        setLoading(false);
        return; // Stop if no context found
      }

      setResults(retrievedDocs);
      console.log(`Step 1: Found ${retrievedDocs.length} relevant documents.`);
      setLoading(false); // Search loading finished
      setLoadingAnswer(true); // Start answer loading

      // --- Step 2: Invoke 'generate-answer' with context --- 
      console.log('Step 2: Generating answer based on context...');
      const { data: answerData, error: answerError } = await supabase.functions.invoke(
        'generate-answer',
        {
          body: {
            query: query,       // Original user query
            context: retrievedDocs, // Context found in step 1
          },
        }
      );

      if (answerError) {
         if (answerError instanceof Error && answerError.message.includes('Function not found')) {
          throw new Error('Error: La función de generación de respuesta (generate-answer) no está disponible.');
        } else {
          throw new Error(`Error generando respuesta: ${answerError.message}`);
        }
      }

      if (answerData && answerData.error) {
        throw new Error(`Error en la generación de respuesta: ${answerData.error}`);
      }

      if (answerData && answerData.answer) {
        setFinalAnswer(answerData.answer);
         console.log('Step 2: Answer generated.');
      } else {
        throw new Error('La función de generación no devolvió una respuesta válida.');
      }

    } catch (err: any) {
      console.error('Search or Answer Generation failed:', err);
      setError(err.message || 'Ocurrió un error en el proceso.');
      // Clear potentially intermediate results
      // setResults([]); // Keep results visible for debugging? Optional.
      setFinalAnswer(null);
    } finally {
      setLoading(false);      // Ensure main loading is off
      setLoadingAnswer(false); // Ensure answer loading is off
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Buscar en Base de Conocimientos</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
              setQuery(e.target.value);
              // Optionally clear results/answer when query changes
              // setResults([]);
              // setFinalAnswer(null);
              // setError(null);
          }}
          placeholder="Escribe tu pregunta legal aquí..."
          className="flex-grow shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          disabled={loading || loadingAnswer}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
        <button
          onClick={handleSearch}
          disabled={loading || loadingAnswer || !query.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || loadingAnswer ? (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <MagnifyingGlassIcon className="-ml-1 mr-2 h-5 w-5" />
          )}
          {loading ? 'Buscando docs...' : (loadingAnswer ? 'Generando Rsp...' : 'Buscar')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

       {/* Display Final Answer */}
       {finalAnswer && (
         <div className="mt-6 p-4 border border-blue-200 rounded-md bg-blue-50">
           <h4 className="text-md font-semibold text-blue-800 mb-2">Respuesta</h4>
           <p className="text-sm text-gray-800 whitespace-pre-wrap">{finalAnswer}</p>
         </div>
       )}

      {/* Optionally display context snippets (e.g., for debugging or transparency) */}
      {results.length > 0 && !finalAnswer && !loadingAnswer && (
          <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-xs text-center text-gray-500">Documentos relevantes encontrados. Generando respuesta...</p>
          </div>
      )}
      {/* Uncomment below if you want to show context even after the answer is generated
       {results.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Contexto Utilizado:</h4>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="p-3 border border-gray-200 rounded-md bg-gray-50 text-xs">
                <p className="text-gray-700 whitespace-pre-wrap">{result.content}</p>
                <p className="text-gray-400 mt-1">Similitud: {(result.similarity * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )} 
      */} 

       {!loading && !loadingAnswer && !finalAnswer && results.length === 0 && !error && (
           <p className="text-sm text-gray-500 text-center mt-6">Ingresa una pregunta para buscar en la base de conocimientos.</p>
       )}

>>>>>>> 89697c5a557e86f039dab3ac1d452b0ccdb181e6
    </div>
  );
};

export default SemanticSearch; 