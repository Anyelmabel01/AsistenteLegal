import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentIcon, ArrowLeftIcon, ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon, PlusCircleIcon, CircleStackIcon } from '@heroicons/react/24/outline';

// Interfaces matching DB structure (can be moved to a types file later)
interface Case {
  id: string;
  created_at: string;
  user_id: string;
  case_name: string;
  description: string | null;
  status: string;
}

interface Document {
    id: string;
    created_at: string;
    user_id: string;
    file_name: string;
    file_path: string;
    document_type: string | null;
    source: string | null;
    processed_at: string | null;
    // extracted_text: string | null; // Avoid fetching large text unless needed
    status: string;
}

// Interface for the junction table data, possibly joining with documents
interface CaseDocument extends Document {
    added_at: string; // From case_documents table
    // Include fields from Document via join
}

const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] = useState<Case | null>(null);
  const [associatedDocs, setAssociatedDocs] = useState<CaseDocument[]>([]);
  const [loadingCase, setLoadingCase] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);

  // State for the association modal
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [loadingAvailableDocs, setLoadingAvailableDocs] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [associatingDocs, setAssociatingDocs] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId || !user) return;

      setLoadingCase(true);
      setLoadingDocs(true);
      setError(null);

      try {
        // Fetch Case Details
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .eq('user_id', user.id) // Ensure user owns the case
          .single();

        if (caseError) {
          if (caseError.code === 'PGRST116') { // Not found or not owner
             throw new Error('Caso no encontrado o no tienes permiso para verlo.');
          } else {
              throw new Error(`Error cargando detalles del caso: ${caseError.message}`);
          }
        }
        setCaseDetails(caseData);
        setLoadingCase(false);

        // Fetch Associated Documents using the junction table
        // We join case_documents with documents to get document details
        const { data: docsData, error: docsError } = await supabase
          .from('case_documents')
          .select(`
            added_at,
            documents ( id, created_at, user_id, file_name, file_path, document_type, source, processed_at, status )
          `)
          .eq('case_id', caseId);
           // No need for user_id check here as it's implicitly checked by case ownership

        if (docsError) {
           throw new Error(`Error cargando documentos asociados: ${docsError.message}`);
        }

        // Transform data to fit CaseDocument structure
        const transformedDocs: CaseDocument[] = (docsData || []).map((item: any) => ({
            ...item.documents,
            added_at: item.added_at,
        })).filter(doc => doc && doc.id); // Ensure doc and doc.id exist

        setAssociatedDocs(transformedDocs);

      } catch (err: any) {
        console.error('Error fetching case details or documents:', err);
        setError(err.message);
        // If case not found, redirect or show specific message
        if (err.message.includes('Caso no encontrado')) {
            // Optionally redirect after a delay or keep showing error
             // navigate('/cases');
        }
      } finally {
        setLoadingCase(false);
        setLoadingDocs(false);
      }
    };

    fetchCaseData();
  }, [caseId, user, navigate]);

  // Fetch available documents when modal opens
  useEffect(() => {
    if (showAssociateModal && user) {
      const fetchAvailableDocs = async () => {
        setLoadingAvailableDocs(true);
        setModalError(null);
        setAvailableDocs([]);
        try {
          // Get IDs of already associated docs
          const associatedDocIds = new Set(associatedDocs.map(doc => doc.id));

          // Fetch all documents for the user
          const { data: allDocs, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (fetchError) {
            throw fetchError;
          }

          // Filter out already associated documents
          const available = (allDocs || []).filter(doc => !associatedDocIds.has(doc.id));
          setAvailableDocs(available);

        } catch (err: any) {
          console.error("Error fetching available documents:", err);
          setModalError("No se pudieron cargar los documentos disponibles.");
        } finally {
          setLoadingAvailableDocs(false);
        }
      };
      fetchAvailableDocs();
    }
  }, [showAssociateModal, user, associatedDocs]); // Rerun if modal opens or associated docs change

  const handleDisassociateDoc = async (documentId: string) => {
     if (!caseId || !documentId) return;

     const confirmation = window.confirm("¿Estás seguro de que quieres desasociar este documento del caso? (El documento no será eliminado)");
     if (!confirmation) return;

     setError(null);
     try {
         const { error: deleteError } = await supabase
             .from('case_documents')
             .delete()
             .eq('case_id', caseId)
             .eq('document_id', documentId);

         if (deleteError) {
             throw deleteError;
         }

         // Remove from local state
         setAssociatedDocs(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

     } catch (err: any) {
         console.error("Error disassociating document:", err);
         setError(`No se pudo desasociar el documento: ${err.message}`);
     }
 };

  const handleSelectionChange = (docId: string) => {
      setSelectedDocIds(prevSelected => {
          const newSelected = new Set(prevSelected);
          if (newSelected.has(docId)) {
              newSelected.delete(docId);
          } else {
              newSelected.add(docId);
          }
          return newSelected;
      });
  };

  const handleAssociateDocs = async () => {
      if (!caseId || selectedDocIds.size === 0) return;

      setAssociatingDocs(true);
      setModalError(null);

      const docsToInsert = Array.from(selectedDocIds).map(docId => ({
          case_id: caseId,
          document_id: docId,
      }));

      try {
          const { error: insertError } = await supabase
              .from('case_documents')
              .insert(docsToInsert);

          if (insertError) {
              // Handle potential unique constraint violation if trying to re-associate
              if (insertError.code === '23505') { // unique_violation
                   throw new Error("Uno o más documentos seleccionados ya están asociados.");
              }
              throw insertError;
          }

          // Refresh associated docs list after successful insertion
          const newlyAssociated = availableDocs.filter(doc => selectedDocIds.has(doc.id))
                                        .map(doc => ({ ...doc, added_at: new Date().toISOString() })); // Add added_at timestamp
          setAssociatedDocs(prev => [...prev, ...newlyAssociated].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())); // Add and sort

          // Clear selection and close modal
          setSelectedDocIds(new Set());
          setShowAssociateModal(false);

      } catch (err: any) {
          console.error("Error associating documents:", err);
          setModalError(`Error al asociar: ${err.message}`);
      } finally {
          setAssociatingDocs(false);
      }
  };

  // Loading state
  if (loadingCase) {
    return <div className="text-center p-10">Cargando detalles del caso...</div>;
  }

  // Error state (e.g., case not found)
  if (error && !caseDetails) {
     return (
        <div className="container mx-auto px-4 py-6 text-center">
             <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
             <h2 className="mt-2 text-xl font-semibold text-red-700">Error</h2>
             <p className="text-red-600 mt-1 mb-4">{error}</p>
             <Link to="/cases" className="text-blue-600 hover:underline">
                 Volver a la lista de casos
             </Link>
         </div>
     );
  }

  // Case not found (should be caught by error state, but as fallback)
  if (!caseDetails) {
    return <div className="text-center p-10">Caso no encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
       <Link to="/cases" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
         <ArrowLeftIcon className="h-4 w-4 mr-1" />
         Volver a Mis Casos
       </Link>

      {/* Case Header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 border border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{caseDetails.case_name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{caseDetails.description || 'Sin descripción.'}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           caseDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                           caseDetails.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800'
                       }`}>
                          {caseDetails.status === 'active' ? 'Activo' : caseDetails.status === 'archived' ? 'Archivado' : 'Cerrado'}
                       </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Fecha Creación</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(caseDetails.created_at).toLocaleDateString()}</dd>
            </div>
            {/* Add more details if needed */}
          </dl>
        </div>
      </div>

        {/* Associated Documents Section */}
        <div>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xl font-semibold text-gray-800">Documentos Asociados</h4>
                 <button
                     onClick={() => {
                         setShowAssociateModal(true);
                         setModalError(null); // Clear previous modal errors on open
                         setSelectedDocIds(new Set()); // Clear previous selections
                     }}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    disabled={loadingCase} // Disable if case details haven't loaded
                 >
                     <PlusCircleIcon className="-ml-0.5 mr-1 h-4 w-4" />
                     Asociar Documento Existente
                 </button>
             </div>

            {/* General Error Display */} 
            {error && <p className="text-sm text-red-600 mb-3">Error: {error}</p>} 

            {loadingDocs && <p className="text-gray-500">Cargando documentos...</p>}

            {!loadingDocs && associatedDocs.length === 0 && (
                <p className="text-gray-500 italic">No hay documentos asociados a este caso.</p>
            )}

            {!loadingDocs && associatedDocs.length > 0 && (
                <ul role="list" className="divide-y divide-gray-200 border border-gray-200 rounded-md shadow-sm">
                    {associatedDocs.map((doc) => (
                        <li key={doc.id} className="px-4 py-3 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center min-w-0 mr-4"> {/* Added min-w-0 for truncation */} 
                                <DocumentIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /> {/* Added flex-shrink-0 */} 
                                <div className="text-sm min-w-0"> {/* Added min-w-0 */} 
                                    <p className="font-medium text-gray-800 truncate">{doc.file_name}</p>
                                    <p className="text-gray-500">Añadido: {new Date(doc.added_at).toLocaleDateString()}</p>
                                     <p className="text-xs text-gray-500">Estado Doc: {doc.status}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDisassociateDoc(doc.id)}
                                className="text-red-600 hover:text-red-800 ml-4 p-1 rounded hover:bg-red-100 flex-shrink-0" /* Added flex-shrink-0 */ 
                                title="Desasociar del caso"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Modal for Associating Documents */}
         {showAssociateModal && (
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50" // Added z-index
                 onClick={() => setShowAssociateModal(false)}
             >
                 <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}> {/* Increased max-width, added max-height and flex-col */}
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-medium text-gray-900">Asociar Documentos Existentes a "{caseDetails?.case_name}"</h3>
                          <button onClick={() => setShowAssociateModal(false)} className="text-gray-400 hover:text-gray-600">
                             <XMarkIcon className="h-6 w-6" />
                         </button>
                     </div>

                    {modalError && <p className="text-sm text-red-600 mb-3">{modalError}</p>}

                     {/* Document Selection List */}
                     <div className="flex-grow overflow-y-auto mb-4 border rounded-md"> {/* Added flex-grow and overflow */}
                         {loadingAvailableDocs && <p className="p-4 text-center text-gray-500">Cargando documentos disponibles...</p>}
                         {!loadingAvailableDocs && availableDocs.length === 0 && (
                             <p className="p-4 text-center text-gray-500 italic">No hay otros documentos disponibles para asociar.</p>
                         )}
                         {!loadingAvailableDocs && availableDocs.length > 0 && (
                             <ul role="list" className="divide-y divide-gray-200">
                                 {availableDocs.map((doc) => (
                                    <li key={doc.id} className="px-4 py-3 sm:px-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectionChange(doc.id)}>
                                         <div className="flex items-center">
                                             <input
                                                 type="checkbox"
                                                 checked={selectedDocIds.has(doc.id)}
                                                 onChange={() => handleSelectionChange(doc.id)}
                                                 className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                             />
                                             <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                                             <div className="text-sm">
                                                 <p className="font-medium text-gray-800 truncate">{doc.file_name}</p>
                                                 <p className="text-xs text-gray-500">Subido: {new Date(doc.created_at).toLocaleDateString()}, Estado: {doc.status}</p>
                                             </div>
                                         </div>
                                     </li>
                                 ))}
                             </ul>
                         )}
                     </div>

                     {/* Modal Footer */}
                     <div className="flex justify-end pt-4 border-t"> {/* Adjusted padding and added border */} 
                         <button
                            onClick={() => setShowAssociateModal(false)}
                             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                         >
                             Cancelar
                         </button>
                         <button
                            onClick={handleAssociateDocs}
                            disabled={associatingDocs || selectedDocIds.size === 0 || loadingAvailableDocs}
                             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                         >
                            {associatingDocs && <CircleStackIcon className="animate-spin h-4 w-4 mr-2" />} 
                            {associatingDocs ? 'Asociando...' : `Asociar ${selectedDocIds.size} Documento(s)`}
                         </button>
                     </div>
                 </div>
             </div>
         )}

    </div>
  );
};

export default CaseDetail; 