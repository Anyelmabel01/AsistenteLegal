import React from 'react';

// Define an interface for the document structure for better type safety
interface Document {
  id: string | number;
  file_name: string;
  document_type: string;
  source: string;
  status?: 'processed' | 'pending' | 'processing' | 'error' | string; // Allow string for flexibility
  created_at?: string;
}

interface DocumentTableProps {
  documents: Document[];
  isLoading: boolean;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, isLoading }) => {
  if (isLoading) {
    return <div className="text-center py-4 text-gray-600">Cargando documentos...</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 italic">
        No hay documentos disponibles.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.file_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{doc.document_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.source}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    doc.status === 'processed'
                      ? 'bg-green-100 text-green-800'
                      : doc.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : doc.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : doc.status === 'error' // Added explicit error case
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800' // Default/unknown status
                  }`}
                >
                  {doc.status || 'desconocido'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable; 