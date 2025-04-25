'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import Login from '../components/Login';
import Register from '../components/Register';
import Layout from '../src/components/Layout/MainLayout';
import { getUserDocuments, uploadDocument } from '../utils/documentService';
import ChatInterface from '../components/ChatInterface';

// Componente para subir documentos
const DocumentUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('constitucion');
  const [source, setSource] = useState('user_upload');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    await onUpload(file, documentType, source);
    setFile(null);
    setIsUploading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Subir Documento Legal</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="constitucion">Constitución</option>
            <option value="ley">Ley</option>
            <option value="codigo">Código</option>
            <option value="jurisprudencia">Jurisprudencia</option>
            <option value="contrato">Contrato</option>
            <option value="demanda">Demanda</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="user_upload">Subida por usuario</option>
            <option value="Gaceta Oficial">Gaceta Oficial</option>
            <option value="Organo Judicial">Órgano Judicial</option>
            <option value="otro">Otra fuente</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition duration-150 ease-in-out ${
            !file || isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isUploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
      </form>
    </div>
  );
};

// Componente de tabla para mostrar documentos
const DocumentTable = ({ documents, isLoading }) => {
  if (isLoading) {
    return <div className="text-center py-4 text-gray-600">Cargando documentos...</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 italic">
        No hay documentos disponibles. Sube tu primer documento.
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
                      : 'bg-red-100 text-red-800'
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

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Función para cargar documentos del usuario
  const loadUserDocuments = async () => {
    if (!user) return;

    setIsLoadingDocs(true);
    try {
      const result = await getUserDocuments(user.id);
      if (result.success) {
        setDocuments(result.documents);
      } else {
        console.error('Error al cargar documentos:', result.error);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Cargar documentos cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      setShowLogin(false);
      loadUserDocuments();
    } else {
      setShowLogin(true);
      setDocuments([]);
    }
  }, [user]);

  // Manejar la subida de documentos
  const handleDocumentUpload = async (file, documentType, source) => {
    if (!user) return;
    setUploadError(null);

    try {
      const uploadResult = await uploadDocument(file, documentType, source, user.id);
      if (uploadResult.success) {
        setTimeout(loadUserDocuments, 1000);
      } else {
        setUploadError(`Error al subir documento: ${uploadResult.error}`);
      }
    } catch (error) {
      setUploadError(`Error inesperado al subir: ${error.message}`);
      console.error('Upload exception:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Cargando...</p></div>; 
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {showLogin ? (
            <Login onSwitch={() => setShowLogin(false)} />
          ) : (
            <Register onSwitch={() => setShowLogin(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex justify-end mb-4">
        <button 
          onClick={signOut} 
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium"
        >
          Cerrar Sesión
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <DocumentUploader onUpload={handleDocumentUpload} />
          {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-4">Mis Documentos</h2>
          <DocumentTable documents={documents} isLoading={isLoadingDocs} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat Asistente</h2>
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
} 