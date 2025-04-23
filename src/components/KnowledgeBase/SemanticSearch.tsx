import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Define the structure of a search result item (context)
interface SearchResult {
  id: number;
  document_id: string;
  content: string;
  similarity: number;
}

const SemanticSearch: React.FC = () => {
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

    </div>
  );
};

export default SemanticSearch; 