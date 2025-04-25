'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from '../src/components/Auth/Login';
import Register from '../src/components/Auth/Register';
import Layout from '../src/components/Layout/MainLayout';
import { getUserDocuments, uploadDocument, Document } from '../utils/documentService';
import ChatInterface from '../components/ChatInterface';
import DocumentTable from '../components/DocumentTable';

// Define Document type if not imported
// interface Document { id: string; name: string; type: string; /* ... other fields */ }

// Define props for DocumentUploader
interface DocumentUploaderProps {
  onUpload: (file: File, documentType: string, source: string) => Promise<void>;
}

// DocumentUploader component
const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('contrato');
  const [source, setSource] = useState('cliente');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null); // Clear any previous errors
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Por favor selecciona un archivo');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await onUpload(file, documentType, source);
      // Reset form after successful upload
      setFile(null);
      setDocumentType('contrato');
      setSource('cliente');
      // Reset the file input (need to access DOM directly)
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Error al subir el documento. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Subir Documento</h2>
      
      <div>
        <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">
          Selecciona un archivo
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 
            file:mr-4 file:py-2 file:px-4 
            file:rounded-md file:border-0 
            file:text-sm file:font-semibold 
            file:bg-primary-50 file:text-primary-700 
            hover:file:bg-primary-100"
        />
        {file && (
          <p className="mt-1 text-sm text-gray-500">
            Archivo seleccionado: {file.name}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="contrato">Contrato</option>
          <option value="ley">Ley</option>
          <option value="jurisprudencia">Jurisprudencia</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
          Fuente del Documento
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="cliente">Cliente</option>
          <option value="gaceta_oficial">Gaceta Oficial</option>
          <option value="organo_judicial">Órgano Judicial</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      
      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}
      
      <button
        type="submit"
        disabled={isUploading || !file}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Subiendo...' : 'Subir Documento'}
      </button>
    </form>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user's documents when the component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Function to fetch documents
  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsLoadingDocs(true);
    try {
      const docs = await getUserDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Handle document upload
  const handleUploadDocument = async (file: File, documentType: string, source: string) => {
    if (!user) return;
    
    try {
      await uploadDocument(file, documentType, source, user.id);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      fetchDocuments(); // Refresh documents list
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error; // Let the uploader component handle the error
    }
  };

  // Display nothing while client-side JavaScript is loading
  if (!isMounted) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {showLogin ? (
            <Login onSwitchToRegister={() => setShowLogin(false)} />
          ) : (
            <Register onSwitchToLogin={() => setShowLogin(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
} 