'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import { getUserDocuments } from '../../utils/documentService'; // Adjust path as needed
import DocumentTable from '../../components/DocumentTable'; // Adjust path as needed
import Layout from '../../src/components/Layout/MainLayout'; // Adjust path as needed

// Define the Document type (consider moving to a shared types file)
interface Document {
  id: string | number;
  file_name: string;
  document_type: string;
  source: string;
  status?: string;
  created_at?: string;
}

export default function DocumentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserDocuments = async () => {
      if (!user) {
        setIsLoadingDocs(false);
        setDocuments([]); // Clear documents if user logs out
        return;
      }

      setIsLoadingDocs(true);
      setError(null);
      try {
        const result = await getUserDocuments(user.id);
        if (result.success && result.documents) {
          setDocuments(result.documents);
        } else {
          console.error('Error al cargar documentos:', result.error);
          setError('No se pudieron cargar los documentos.');
          setDocuments([]); // Clear on error
        }
      } catch (err: any) {
        console.error('Error al cargar documentos:', err);
        setError(`Error al cargar documentos: ${err.message}`);
        setDocuments([]); // Clear on error
      } finally {
        setIsLoadingDocs(false);
      }
    };

    // Only load documents if auth is not loading and user exists
    if (!authLoading) {
        loadUserDocuments();
    }

  }, [user, authLoading]); // Rerun when user or auth state changes

  if (authLoading) {
    return (
      <Layout>
        <div className="text-center py-10">Cargando usuario...</div>
      </Layout>
    );
  }

  if (!user) {
     return (
      <Layout>
        <div className="text-center py-10 text-red-600">Por favor, inicia sesión para ver tus documentos.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Mis Documentos Legales</h1>
        {error && <p className="text-red-500">{error}</p>}
        <DocumentTable documents={documents} isLoading={isLoadingDocs} />
      </div>
    </Layout>
  );
} 