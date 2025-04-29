import { useState } from 'react';
import { useAuth } from '../src/contexts/auth';
import { uploadDocument } from '../utils/documentService';

export default function DocumentUploader() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('legal_brief');
  const [source, setSource] = useState('Usuario');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user) {
      setUploadResult({
        success: false,
        message: 'Debe seleccionar un archivo y estar autenticado.'
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadDocument(file, documentType, source, user.id);
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: 'Documento subido correctamente. ID: ' + result.documentId
        });
        setFile(null);
        // Reset form
        if (e.target instanceof HTMLFormElement) {
          e.target.reset();
        }
      } else {
        setUploadResult({
          success: false,
          message: 'Error al subir el documento: ' + result.error
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Error al subir el documento: ' + (error instanceof Error ? error.message : 'Error desconocido')
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Archivo
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="block w-full text-sm text-gray-500 
                      file:mr-4 file:py-2 file:px-4 
                      file:rounded-md file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-blue-50 file:text-blue-700 
                      hover:file:bg-blue-100"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Formatos aceptados: PDF, DOC, DOCX, TXT
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Documento
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                      rounded-md"
            required
          >
            <option value="legal_brief">Escrito Legal</option>
            <option value="contract">Contrato</option>
            <option value="court_decision">Decisión Judicial</option>
            <option value="legal_research">Investigación Legal</option>
            <option value="legislation">Legislación</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
            Fuente
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                      rounded-md"
            required
          >
            <option value="Usuario">Usuario</option>
            <option value="Organo Judicial">Órgano Judicial</option>
            <option value="Gaceta Oficial">Gaceta Oficial</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
      </form>

      {uploadResult && (
        <div className={`mt-4 p-3 rounded-md ${
          uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {uploadResult.message}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Información Importante</h3>
        <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
          <li>Los archivos subidos serán procesados para su análisis.</li>
          <li>El procesamiento puede tomar unos minutos dependiendo del tamaño del archivo.</li>
          <li>Los documentos subidos estarán disponibles en la sección "Documentos".</li>
        </ul>
      </div>
    </div>
  );
} 