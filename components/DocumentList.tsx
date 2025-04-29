import { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/auth';
import { getUserDocuments } from '../utils/documentService';
import { supabase } from '../src/lib/supabaseClient';
import { getPublicUrl } from '../src/lib/supabaseClient';

type Document = {
  id: string;
  created_at: string;
  file_name: string;
  document_type: string;
  source: string;
  status: string;
  file_path: string;
};

export default function DocumentList() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const currentUser = user;

    async function fetchDocuments() {
      setIsLoading(true);
      try {
        const result = await getUserDocuments(currentUser.id);
        if (result.success) {
          setDocuments(result.documents || []);
        } else {
          setError(result.error || 'Error al cargar documentos');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Error al cargar la lista de documentos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDownload = async (document: Document) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const bucket = document.file_path.includes('organo_judicial_pdf') 
        ? 'organo_judicial_pdf' 
        : 'legal_documents';
        
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(document.file_path);
        
      if (error) {
        console.error('Error downloading document:', error);
        throw error;
      }
      
      if (data) {
        const url = URL.createObjectURL(data);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        window.document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Error al descargar el documento. Intente de nuevo más tarde.');
    }
  };
  
  if (isLoading) {
    return <div className="py-4 text-center text-gray-600">Cargando documentos...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-600">{error}</div>;
  }
  
  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-600">
        <p className="mb-2">No hay documentos disponibles.</p>
        <p className="text-sm">Puede subir documentos usando la pestaña "Subir Archivos".</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {doc.file_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(doc.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleDownload(doc)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Descargar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 