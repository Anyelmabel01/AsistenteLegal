import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Tesseract, { RecognizeResult } from 'tesseract.js'; // Import Tesseract directly
import { useDropzone } from 'react-dropzone'; // Import useDropzone

// Enum for processing status
enum ProcessingStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  OCR_PENDING = 'ocr_pending',
  OCR_PROGRESS = 'ocr_progress',
  OCR_COMPLETE = 'ocr_complete',
  REGISTERING = 'registering',
  EMBEDDING_PENDING = 'embedding_pending',
  EMBEDDING_COMPLETE = 'embedding_complete', // Background task
  ERROR = 'error',
}

const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  // Tesseract.js v5 doesn't require explicit worker management via refs for basic usage
  // const workerRef = useRef<Worker | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrReady, setOcrReady] = useState(true); // Assume ready initially, handle errors if OCR fails

  // No explicit worker initialization/termination needed for basic recognize call
  // useEffect(() => { ... }, []);

  // Function to handle file selection (from input or dropzone)
  const processSelectedFile = (file: File | null) => {
    setError(null);
    setMessage(null);
    setStatus(ProcessingStatus.IDLE);
    setOcrProgress(0);
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        setError('Por favor, selecciona o arrastra un archivo PDF.');
        setSelectedFile(null);
        // Reset file input if it exists (might not be needed with dropzone handling)
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  // Original handler for standard file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processSelectedFile(event.target.files && event.target.files.length > 0 ? event.target.files[0] : null);
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (e.g., wrong type)
    if (rejectedFiles && rejectedFiles.length > 0) {
      console.warn('Rejected files:', rejectedFiles);
      setError('Solo se permiten archivos PDF.');
      setSelectedFile(null);
      return;
    }
    // Handle accepted files (should be only one based on `multiple: false`)
    if (acceptedFiles && acceptedFiles.length > 0) {
      processSelectedFile(acceptedFiles[0]);
    } else {
      processSelectedFile(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }, // Accept only PDF files
    multiple: false, // Allow only one file
    disabled: status !== ProcessingStatus.IDLE && status !== ProcessingStatus.ERROR, // Disable dropzone during processing
  });

  const performOcr = async (file: File): Promise<string> => {
    setOcrReady(false); // Mark OCR as busy
    setStatus(ProcessingStatus.OCR_PENDING);
    setMessage("Iniciando reconocimiento de texto (OCR)... Esto puede tardar.");
    setOcrProgress(0);

    try {
      // Directly use Tesseract.recognize
      const result: RecognizeResult = await Tesseract.recognize(
        file,
        'spa', // Specify language directly
        {
          logger: (m) => { // Logger is valid here
            // console.log(m); // Optional: log detailed progress
            if (m.status === 'recognizing text' && m.progress) {
              setStatus(ProcessingStatus.OCR_PROGRESS);
              const progressPercentage = Math.round(m.progress * 100);
              setOcrProgress(progressPercentage);
              setMessage(`Reconociendo texto... ${progressPercentage}%`);
            }
          }
        }
      );
      setStatus(ProcessingStatus.OCR_COMPLETE);
      setMessage("Reconocimiento de texto completado.");
      setOcrProgress(100);
      setOcrReady(true); // Mark OCR as ready again
      return result.data.text;
    } catch (ocrError: any) { // Catch specific OCR errors
      console.error("Tesseract OCR failed:", ocrError);
      setError(`Error durante OCR: ${ocrError.message || 'Error desconocido'}`);
      setStatus(ProcessingStatus.ERROR);
      setOcrReady(true); // Mark OCR as ready even on error, allowing retry
      throw new Error(`OCR fallido: ${ocrError.message}`); // Re-throw to stop the handleUpload process
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setError('Selecciona un archivo y asegúrate de estar logueado.');
      return;
    }
    // Remove explicit worker check, rely on error handling in performOcr
    // if (!workerRef.current) { ... }

    setError(null);
    setMessage(null);
    setOcrProgress(0);
    setStatus(ProcessingStatus.UPLOADING); // Start status

    const file = selectedFile;
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${user.id}/${fileName}`;
    let extractedText: string | null = null;
    let newDocumentId: string | null = null;

    try {
      // 1. Perform OCR
      extractedText = await performOcr(file);
      if (!extractedText) {
        console.warn("OCR no extrajo texto. Procediendo sin texto extraído.");
        // Decide if you want to continue without text or throw an error
        // For now, we continue but won't have text for embeddings
      }

      // 2. Upload to Supabase Storage
      setStatus(ProcessingStatus.UPLOADING);
      setMessage("Subiendo archivo a almacenamiento seguro...");
      const { error: uploadError } = await supabase.storage
        .from('legal_documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }
      setMessage('Archivo subido. Registrando metadatos...');

      // 3. Insert metadata (including extracted text)
      setStatus(ProcessingStatus.REGISTERING);
      const { data: newDocument, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          document_type: 'user_upload', // TODO: Add classification later
          source: 'user_upload',
          status: extractedText ? 'ocr_complete' : 'upload_complete_no_ocr', // Updated status
          extracted_text: extractedText, // Store extracted text
          processed_at: extractedText ? new Date().toISOString() : null // Timestamp OCR completion
        })
        .select('id')
        .single();

      if (insertError) {
        await supabase.storage.from('legal_documents').remove([filePath]);
        throw new Error(`Error registrando metadatos: ${insertError.message}`);
      }

      if (!newDocument || !newDocument.id) {
          await supabase.storage.from('legal_documents').remove([filePath]);
          throw new Error('No se pudo obtener el ID del documento registrado.');
      }

      newDocumentId = newDocument.id;

      setMessage(`Documento "${file.name}" registrado (ID: ${newDocumentId}). Iniciando generación de embeddings...`);
      setStatus(ProcessingStatus.EMBEDDING_PENDING);

      // 4. Invoke Edge Function for embeddings (only if text was extracted)
      if (extractedText) {
      const { error: functionError } = await supabase.functions.invoke('generate-embeddings', {
          body: { document_id: newDocumentId }, // Pass the document ID
      });

      if (functionError) {
          await supabase
            .from('documents')
            .update({ status: 'error_embedding', processed_at: new Date().toISOString() })
            .eq('id', newDocumentId);
          throw new Error(`Error iniciando generación de embeddings: ${functionError.message}`);
        }
        setMessage(`La generación de embeddings para "${file.name}" ha comenzado. Puedes subir otro archivo.`);
        setStatus(ProcessingStatus.EMBEDDING_COMPLETE); // Mark as complete (background)
      } else {
        // If no text, don't call embeddings and mark as processed without embeddings
         await supabase
           .from('documents')
          .update({ status: 'processed_no_embeddings', processed_at: new Date().toISOString() })
           .eq('id', newDocumentId);
        setMessage(`Documento "${file.name}" registrado, pero no se pudo extraer texto para generar embeddings.`);
        setStatus(ProcessingStatus.IDLE); // Reset status
      }

      setSelectedFile(null);
      // No need to manually reset fileInputRef.current.value for dropzone

    } catch (err: any) {
      console.error('Upload/OCR/Processing failed:', err);
      setError(err.message || 'Ocurrió un error durante el proceso.');
      setStatus(ProcessingStatus.ERROR);

      // Attempt to update status to error in DB if document was created
      if (newDocumentId) {
          try {
             await supabase
               .from('documents')
               .update({ status: 'error', processed_at: new Date().toISOString() })
               .eq('id', newDocumentId);
          } catch (updateErr) {
          console.error("Failed to update document status to 'error' after failure:", updateErr);
        }
      }
    }
  };

  // Determine button text and disabled state based on status
  const getButtonState = (): { text: string; disabled: boolean } => {
    switch (status) {
      case ProcessingStatus.IDLE:
        // Disable if OCR service had an error previously or file not selected
        return { text: 'Subir y Procesar', disabled: !selectedFile || !ocrReady };
      case ProcessingStatus.UPLOADING:
        return { text: 'Subiendo Archivo...', disabled: true };
      case ProcessingStatus.OCR_PENDING:
        return { text: 'Iniciando OCR...', disabled: true };
      case ProcessingStatus.OCR_PROGRESS:
        return { text: `Procesando OCR (${ocrProgress}%)...`, disabled: true };
      case ProcessingStatus.OCR_COMPLETE:
        return { text: 'OCR Completo. Subiendo...', disabled: true };
      case ProcessingStatus.REGISTERING:
        return { text: 'Registrando Documento...', disabled: true };
      case ProcessingStatus.EMBEDDING_PENDING:
      case ProcessingStatus.EMBEDDING_COMPLETE:
        return { text: 'Embeddings en Progreso...', disabled: true };
      case ProcessingStatus.ERROR:
        // Allow retry only if OCR is ready (didn't fail catastrophically)
        return { text: 'Error. Reintentar?', disabled: !selectedFile || !ocrReady };
      default:
        return { text: 'Subir y Procesar', disabled: !selectedFile || !ocrReady };
    }
  };

  const buttonState = getButtonState();

  // Dynamic classes for the dropzone area
  const dropzoneBaseStyle = "mt-2 flex flex-col justify-center items-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 cursor-pointer hover:border-blue-500 transition-colors duration-200 ease-in-out";
  const dropzoneActiveStyle = "border-blue-600 bg-blue-50";
  const dropzoneAcceptStyle = "border-green-600 bg-green-50";
  const dropzoneRejectStyle = "border-red-600 bg-red-50";

  let dropzoneClassName = dropzoneBaseStyle;
  if (isDragActive) dropzoneClassName += ` ${dropzoneActiveStyle}`;
  if (isDragAccept) dropzoneClassName += ` ${dropzoneAcceptStyle}`;
  if (isDragReject) dropzoneClassName += ` ${dropzoneRejectStyle}`;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Subir y Procesar Documento (PDF)</h3>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className={`border-l-4 p-4 mb-4 ${status === ProcessingStatus.ERROR ? 'bg-red-50 border-red-400 text-red-700' : 'bg-blue-50 border-blue-400 text-blue-700'}`}>
          <p className="text-sm">{message}</p>
          {status === ProcessingStatus.OCR_PROGRESS && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Dropzone Area */}
      <div {...getRootProps({ className: dropzoneClassName })}>
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="space-y-1 text-center">
          <ArrowUpTrayIcon className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="flex text-sm text-gray-600 justify-center">
            <p>
              {isDragAccept && "¡Suelta el archivo PDF aquí!"}
              {isDragReject && "Archivo no válido (solo PDF)."}
              {!isDragActive && "Arrastra un PDF aquí o"}
              {/* Use a button instead of label for better accessibility with dropzone */}
              {!isDragActive && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-1 relative rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                  disabled={status !== ProcessingStatus.IDLE && status !== ProcessingStatus.ERROR}
                >
                  selecciona un archivo
                </button>
              )}
            </p>
          </div>
          <p className="text-xs text-gray-500">Solo archivos PDF</p>
          {selectedFile && !isDragActive && (
            <p className="text-sm text-gray-700 pt-2">Archivo listo: {selectedFile.name}</p>
          )}
          {!ocrReady && status === ProcessingStatus.IDLE && (
            <p className="text-xs text-red-600 pt-2">Error previo en OCR. Intenta refrescar la página o revisa la consola.</p>
          )}
        </div>
      </div>

      {/* Upload Button */}
      {selectedFile && (
         <div className="mt-5 text-right">
          <button
            onClick={handleUpload}
            disabled={buttonState.disabled}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(status !== ProcessingStatus.IDLE && status !== ProcessingStatus.ERROR && status !== ProcessingStatus.EMBEDDING_COMPLETE) && (
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {buttonState.text}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 