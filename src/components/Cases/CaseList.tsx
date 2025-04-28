import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/auth';
import { Link } from 'react-router-dom'; // Import Link
import { PlusIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

// Define structure for a case
interface Case {
  id: string;
  created_at: string;
  user_id: string;
  case_name: string;
  description: string | null;
  status: string;
}

const CaseList: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch cases on component mount
  useEffect(() => {
    const fetchCases = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('cases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }); // Show newest first

        if (fetchError) {
          throw fetchError;
        }
        setCases(data || []);
      } catch (err: any) {
        console.error('Error fetching cases:', err);
        setError('No se pudieron cargar los casos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user]); // Re-fetch if user changes

  const handleCreateCase = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newCaseName.trim()) {
          setError("El nombre del caso es obligatorio.");
          return;
      }

      setCreating(true);
      setError(null);

      try {
          const { data: newCase, error: createError } = await supabase
              .from('cases')
              .insert({
                  user_id: user.id,
                  case_name: newCaseName.trim(),
                  description: newCaseDescription.trim() || null,
                  status: 'active' // Default status
              })
              .select('*') // Select the newly created case
              .single(); // Expect one row back

          if (createError) {
              throw createError;
          }

          if (newCase) {
             // Add the new case to the beginning of the list
             setCases(prevCases => [newCase, ...prevCases]);
             // Reset form and hide it
             setNewCaseName('');
             setNewCaseDescription('');
             setShowCreateForm(false);
          } else {
              throw new Error("No se pudo obtener el caso recién creado.");
          }

      } catch (err: any) {
          console.error("Error creating case:", err);
          setError(`No se pudo crear el caso: ${err.message}`);
      } finally {
          setCreating(false);
      }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Mis Casos</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {showCreateForm ? 'Cancelar' : 'Nuevo Caso'}
        </button>
      </div>

      {/* Create Case Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <form onSubmit={handleCreateCase}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">Crear Nuevo Caso</h3>
             {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="mb-3">
              <label htmlFor="case-name" className="block text-sm font-medium text-gray-700">
                Nombre del Caso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="case-name"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={creating}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="case-description" className="block text-sm font-medium text-gray-700">
                Descripción (Opcional)
              </label>
              <textarea
                id="case-description"
                rows={3}
                value={newCaseDescription}
                onChange={(e) => setNewCaseDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={creating}
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={creating || !newCaseName.trim()}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Guardar Caso'}
              </button>
            </div>
          </form>
        </div>
      )}

       {/* Error Loading Cases */}
       {error && !showCreateForm && ( // Show general loading error only if form is hidden
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
        )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-10">
          <p className="text-gray-500">Cargando casos...</p>
          {/* Add a spinner here if desired */}
        </div>
      )}

      {/* Case List */}
      {!loading && cases.length === 0 && !error && (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes casos</h3>
            <p className="mt-1 text-sm text-gray-500">Crea tu primer caso para empezar a organizar tus documentos.</p>
            <div className="mt-6">
                 <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Crear Nuevo Caso
                </button>
            </div>
        </div>
      )}

      {!loading && cases.length > 0 && (
        <ul role="list" className="divide-y divide-gray-200 border border-gray-200 rounded-md shadow-sm">
          {cases.map((caseItem) => (
            <li key={caseItem.id}>
              <Link to={`/cases/${caseItem.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{caseItem.case_name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                       {/* Simple status badge */}
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           caseItem.status === 'active' ? 'bg-green-100 text-green-800' :
                           caseItem.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800' // Default/closed
                       }`}>
                          {caseItem.status === 'active' ? 'Activo' : caseItem.status === 'archived' ? 'Archivado' : 'Cerrado'}
                       </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                       {/* Optionally add description */}
                       {caseItem.description && <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 truncate">{caseItem.description}</p>}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Creado: {new Date(caseItem.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CaseList; 