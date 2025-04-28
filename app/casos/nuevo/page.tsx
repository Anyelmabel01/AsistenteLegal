'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../../src/contexts/auth';
import Layout from '../../../src/components/Layout/MainLayout';
import { supabase } from '../../../src/lib/supabaseClient';
import { Document, Page, pdfjs } from 'react-pdf';
import { createWorker } from 'tesseract.js';
import { processLegalDocument } from '../../../utils/documentService';

// Configurar el trabajador de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Tipos para tesseract.js
interface TesseractProgressType {
  status: string;
  progress: number;
}

export default function NewCase() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Redirigir al inicio si no hay usuario autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Configuración del dropzone para PDFs
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validar que sea un PDF
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  // Manejar la carga del documento PDF
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Procesar el texto del PDF con OCR
  const processDocument = async () => {
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setExtractedText('');

      // Crear un worker de Tesseract para OCR
      const worker = await createWorker({
        logger: (m: TesseractProgressType) => {
          if (m.status === 'recognizing text') {
            setProcessingProgress(parseInt(m.progress * 100 + '', 10));
          }
        }
      } as any);

      // Inicializar el worker con español
      await (worker as any).loadLanguage('spa');
      await (worker as any).initialize('spa');

      // Extraer texto por página
      let fullText = '';
      const pdf = await pdfjs.getDocument(filePreview!).promise;
      
      // Procesar hasta 10 páginas (para no sobrecargar)
      const maxPages = Math.min(pdf.numPages, 10);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Crear un canvas para renderizar la página
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar la página en el canvas
        await page.render({ canvasContext: context!, viewport }).promise;
        
        // Extraer texto de la página con OCR
        const { data: { text } } = await (worker as any).recognize(canvas);
        fullText += `\n\n--- PÁGINA ${i} ---\n\n${text}`;
        
        // Actualizar progreso
        setProcessingProgress(Math.round((i / maxPages) * 100));
      }
      
      // Terminar el worker
      await (worker as any).terminate();
      
      // Guardar el texto extraído
      setExtractedText(fullText);
      
    } catch (err: any) {
      console.error('Error al procesar el documento:', err);
      setError(`Error al procesar el documento: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  // Crear el nuevo caso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para crear un caso');
      return;
    }
    
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    if (!supabase) {
      setError('Error de conexión con la base de datos');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Extraer entidades si hay texto extraído
      let entities = null;
      if (extractedText) {
        try {
          entities = await processLegalDocument(extractedText);
          console.log("Entidades extraídas:", entities);
        } catch (entityError) {
          console.error("Error al extraer entidades:", entityError);
          // Continuamos con el flujo aunque falle la extracción de entidades
        }
      }
      
      // 1. Crear el caso en la base de datos
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          title,
          description,
          status: 'activo',
          user_id: user.id,
          extracted_text: extractedText || null,
          entities: entities || null
        })
        .select()
        .single();
      
      if (caseError) throw caseError;
      
      // 2. Subir el documento si existe
      if (file && caseData) {
        const filePath = `${user.id}/${caseData.id}/${file.name}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('case_documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // 3. Actualizar el caso con la URL del documento
        const { error: updateError } = await supabase
          .from('cases')
          .update({ document_url: filePath })
          .eq('id', caseData.id);
        
        if (updateError) throw updateError;
      }
      
      // Redirigir al detalle del caso
      router.push(`/casos/${caseData.id}`);
      
    } catch (err: any) {
      console.error('Error al crear el caso:', err);
      setError(`Error al crear el caso: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Crear Nuevo Caso Legal</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título del caso *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Contrato de arrendamiento"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Describe los detalles del caso"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento del caso (PDF)
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input {...getInputProps()} />
                
                {filePreview ? (
                  <p className="text-gray-700">Archivo seleccionado: <span className="font-medium">{file?.name}</span></p>
                ) : (
                  <div>
                    <p className="text-gray-700">Arrastra un archivo PDF aquí, o haz clic para seleccionar</p>
                    <p className="text-gray-500 text-sm mt-1">Solo archivos PDF (máx. 10MB)</p>
                  </div>
                )}
              </div>
            </div>
            
            {filePreview && (
              <div className="mb-6">
                <div className="border rounded-md overflow-hidden mb-4">
                  <Document
                    file={filePreview}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="p-4 text-center">Cargando documento...</div>}
                    error={<div className="p-4 text-center text-red-500">Error al cargar el documento</div>}
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      width={500} 
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <div className="flex justify-between items-center p-4 border-t">
                    <button
                      type="button"
                      onClick={() => setPageNumber(page => Math.max(page - 1, 1))}
                      disabled={pageNumber <= 1}
                      className={`px-3 py-1 rounded ${pageNumber <= 1 ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
                    >
                      Anterior
                    </button>
                    <p className="text-sm">
                      Página {pageNumber} de {numPages || '-'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPageNumber(page => Math.min(page + 1, numPages || 1))}
                      disabled={numPages !== null && pageNumber >= numPages}
                      className={`px-3 py-1 rounded ${numPages !== null && pageNumber >= numPages ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="button"
                    onClick={processDocument}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2 rounded-md ${
                      isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                    }`