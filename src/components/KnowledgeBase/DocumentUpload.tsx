import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setMessage(null);
    if (event.target.files && event.target.files.length > 0) {
      // Limitar a PDF por ahora, se puede expandir
      if (event.target.files[0].type === 'application/pdf') {
        setSelectedFile(event.target.files[0]);
      } else {
        setError('Por favor, selecciona un archivo PDF.');
        setSelectedFile(null);
        event.target.value = ''; // Reset input
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setError('Selecciona un archivo y asegúrate de estar logueado.');
      return;
    }

    setError(null);
    setMessage(null);
    setUploading(true);

    const file = selectedFile;
    const fileName = `${Date.now()}_${file.name}`; // Add timestamp to avoid collisions
    const filePath = `${user.id}/${fileName}`; // Store in user-specific folder

    try {
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('legal_documents') // Bucket name matches migration
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      setMessage('Archivo subido exitosamente. Registrando metadatos...');

      // 2. Insert metadata into the documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          document_type: 'user_upload', // Default type, can be refined later
          source: 'user_upload',
          status: 'uploaded' // Initial status before processing
          // extracted_text: null, // Leave null for now
          // processed_at: null
        });

      if (insertError) {
        // Attempt to delete the orphaned file from storage if DB insert fails
        await supabase.storage.from('legal_documents').remove([filePath]);
        throw new Error(`Error registrando metadatos: ${insertError.message}`);
      }

      setMessage(`Documento "${file.name}" subido y registrado correctamente.`);
      setSelectedFile(null);
      // Reset the file input visually if possible (difficult across browsers)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Ocurrió un error durante la subida.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Subir Documento Legal (PDF)</h3>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      <div className="mt-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
        <div className="space-y-1 text-center">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
            >
              <span>Selecciona un archivo</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" disabled={uploading} />
            </label>
            <p className="pl-1">o arrástralo aquí</p> {/* Drag and drop not functional yet */}
          </div>
          <p className="text-xs text-gray-500">Solo archivos PDF</p>
          {selectedFile && (
            <p className="text-sm text-gray-700 pt-2">Archivo seleccionado: {selectedFile.name}</p>
          )}
        </div>
      </div>

      {selectedFile && (
         <div className="mt-5 text-right">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {uploading ? 'Subiendo...' : 'Subir y Registrar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 