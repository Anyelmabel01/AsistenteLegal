import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Tooltip } from 'antd';
import { 
  SendOutlined, 
  PaperClipOutlined,
  FileTextOutlined,
  PictureOutlined,
  AudioOutlined,
  LoadingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { MicrophoneIcon, StopIcon, DocumentIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';

const ChatInput = ({ 
  onSendMessage, 
  isLoading, 
  onPdfFileSelected, 
  isProcessingPdf, 
  pdfFileName, 
  pdfError 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup recording resources when component unmounts
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

  // Función para formatear el tiempo de grabación
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Función para formatear tamaño de archivos
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Función para detener tracks de media
  const stopMediaTracks = () => {
    console.log("Limpiando recursos de audio...");
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      try {
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log(`Track de ${track.kind} detenido`);
        });
      } catch (e) {
        console.error("Error al detener tracks:", e);
      }
      // Limpiar la referencia
      mediaRecorderRef.current = null;
    }
  };

  // Función auxiliar para resetear el estado de grabación
  const resetRecordingState = () => {
    stopMediaTracks();
    setIsRecording(false);
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    setRecordingTime(0);
  };

  // Manejar el cambio en el input de texto
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if ((inputValue.trim() === '' && attachments.length === 0) || isLoading) {
      return;
    }
    
    onSendMessage(inputValue, attachments);
    setInputValue('');
    setAttachments([]);
    setShowAttachments(false);
    inputRef.current?.focus();
  };

  // Manejar pulsación de teclas (Enter para enviar)
  const handleKeyDown = (e) => {
    // Solo enviar con Enter sin Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Manejar carga de archivos
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const newGenericAttachments = [];
    let pdfFileFound = false; // Para evitar procesar el mismo PDF dos veces si se sube con otros archivos

    files.forEach(file => {
      // Si es un PDF, llamar a la función de extracción de ChatInterface
      if (file.type === 'application/pdf' && onPdfFileSelected) {
        onPdfFileSelected(file);
        pdfFileFound = true; // Marcamos que un PDF fue enviado a extracción
        // No lo añadimos a newGenericAttachments aquí, ya que su texto se manejará por separado
      } else {
        // Para otros tipos de archivos, mantener la lógica existente
        let type = 'other';
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('audio/')) {
          type = 'audio';
        } else if (
          file.type.includes('word') || 
          file.type.includes('text') || 
          file.type.includes('document') // Otros documentos que no son PDF
        ) {
          type = 'document';
        }
        
        newGenericAttachments.push({
          file,
          name: file.name,
          size: file.size,
          type,
          id: crypto.randomUUID()
        });
      }
    });
    
    // Añadir solo los adjuntos genéricos (no PDF si se envió a extracción) al estado local
    if (newGenericAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newGenericAttachments]);
    }

    // Si se procesó un PDF para extracción, es probable que no queramos mostrar el menú de adjuntos genéricos inmediatamente
    // o podríamos querer un feedback diferente. Por ahora, cerramos el menú si se encontró un PDF.
    if (pdfFileFound) {
        setShowAttachments(false);
    }
    
    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  // Iniciar grabación de audio - implementación mejorada
  const handleStartRecording = async () => {
    try {
      console.log("Iniciando grabación de audio...");
      
      // 1. Verificar soporte de API
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert("Tu navegador no soporta la grabación de audio");
        return;
      }
      
      // 2. Limpiar cualquier grabación anterior
      stopMediaTracks();
      audioChunksRef.current = [];
      
      // 3. Obtener acceso al micrófono
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false 
        });
        
        // 4. Configurar y crear MediaRecorder
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
        
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        
        // 5. Configurar manejadores de eventos
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log(`Datos de audio recibidos: ${event.data.size} bytes`);
          }
        };
        
        // 6. Iniciar grabación y actualizar UI
        recorder.start(500); // Capturar cada 500ms para mayor fiabilidad
        console.log("MediaRecorder iniciado correctamente");
        setIsRecording(true);
        
        // 7. Iniciar temporizador
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        setRecordingInterval(interval);
        
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          alert("Permiso de micrófono denegado");
        } else {
          alert(`No se pudo acceder al micrófono: ${err.message}`);
        }
        console.error("Error al iniciar grabación:", err);
      }
    } catch (error) {
      console.error("Error general en grabación:", error);
      alert("Ocurrió un error al intentar grabar");
      setIsRecording(false);
    }
  };

  // Detener grabación de audio y procesar el resultado
  const handleStopRecording = async () => {
    console.log("Deteniendo grabación...");
    
    if (!mediaRecorderRef.current) {
      console.warn("No hay grabación activa para detener");
      resetRecordingState();
      return;
    }
    
    try {
      // Solo detener si está grabando
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder detenido");
        
        // Esperar un momento para asegurar que se procesen todos los datos
        setTimeout(() => {
          try {
            // Procesar los chunks de audio
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            if (audioBlob.size > 0) {
              console.log(`Audio grabado: ${audioBlob.size} bytes`);
              
              // Crear archivo
              const audioFile = new File([audioBlob], `nota_de_voz_${Date.now()}.webm`, { 
                type: 'audio/webm' 
              });
              
              // Añadir a adjuntos
              const newAttachment = {
                file: audioFile,
                name: 'Nota de voz',
                size: audioFile.size,
                type: 'audio',
                id: crypto.randomUUID()
              };
              
              setAttachments(prev => [...prev, newAttachment]);
              console.log("✓ Audio añadido correctamente");
            } else {
              console.error("El blob de audio está vacío");
              alert("La grabación está vacía. Intenta de nuevo.");
            }
          } catch (error) {
            console.error("Error al procesar audio:", error);
            alert("Error al procesar la grabación");
          } finally {
            // Limpiar estado
            resetRecordingState();
          }
        }, 500); // Esperar 500ms para asegurar que se completen los eventos
      } else {
        resetRecordingState();
      }
    } catch (e) {
      console.error("Error al detener grabación:", e);
      resetRecordingState();
    }
  };

  // Eliminar un adjunto
  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Abrir selector de archivos
  const handleSelectFile = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      {/* Visualización de adjuntos genéricos (no el PDF en procesamiento) */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-md">
          {attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="flex items-center bg-white px-2 py-1 rounded border border-gray-200 text-sm text-gray-700"
            >
              {attachment.type === 'image' && <PhotoIcon className="h-4 w-4 text-blue-500 mr-1" />}
              {attachment.type === 'document' && <DocumentIcon className="h-4 w-4 text-amber-500 mr-1" />}
              {attachment.type === 'audio' && <AudioOutlined className="text-green-500 mr-1" />}
              
              <span className="truncate max-w-[150px]">
                {attachment.name}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({formatFileSize(attachment.size)})
              </span>
              
              <button 
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* NUEVO: Visualización del estado del PDF en procesamiento/procesado */}
      {isProcessingPdf && (
        <div className="flex items-center text-sm text-blue-600 p-2 bg-blue-50 rounded-md mb-2">
          <LoadingOutlined className="mr-2" />
          Procesando PDF: {pdfFileName}...
        </div>
      )}
      {!isProcessingPdf && pdfFileName && !pdfError && (
        <div className="flex items-center text-sm text-green-600 p-2 bg-green-50 rounded-md mb-2">
          <FileTextOutlined className="mr-2" />
          PDF listo: {pdfFileName}
        </div>
      )}
      {pdfError && (
        <div className="flex items-center text-sm text-red-600 p-2 bg-red-50 rounded-md mb-2">
          <CloseCircleOutlined className="mr-2" />
          Error con PDF: {pdfError}
        </div>
      )}
      
      {/* Interfaz de grabación */}
      {isRecording && (
        <div className="flex items-center justify-between bg-red-50 p-2 rounded-md mb-2 animate-pulse">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-red-700 font-medium">Grabando: {formatTime(recordingTime)}</span>
          </div>
          <button 
            type="button"
            onClick={handleStopRecording}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
          >
            <StopIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        {/* Input principal para texto */}
        <div className="flex-grow relative">
          <Input.TextArea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje aquí..."
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={isLoading || isRecording}
            className="pr-10 resize-none rounded-xl border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          
          {/* Botón de adjuntos */}
          <div className="absolute right-2 bottom-2">
            <Tooltip title="Adjuntar archivos">
              <Button
                type="text"
                icon={<PaperClipOutlined />}
                size="small"
                onClick={() => setShowAttachments(!showAttachments)}
                className={`text-gray-600 hover:text-primary-600 ${showAttachments ? 'text-primary-600' : ''}`}
                disabled={isLoading || isRecording}
              />
            </Tooltip>
          </div>
          
          {/* Opciones de adjuntos */}
          {showAttachments && (
            <div className="absolute bottom-10 right-2 bg-white shadow-md rounded-md p-1 border border-gray-200">
              <div className="flex flex-col space-y-1">
                <Tooltip title="Subir documento (PDF, Word, texto)">
                  <Button 
                    type="text" 
                    icon={<FileTextOutlined />} 
                    size="small"
                    onClick={() => handleSelectFile('.pdf,.doc,.docx,.txt')}
                    className="text-amber-600 hover:bg-amber-50"
                  />
                </Tooltip>
                <Tooltip title="Subir imagen">
                  <Button 
                    type="text" 
                    icon={<PictureOutlined />} 
                    size="small"
                    onClick={() => handleSelectFile('image/*')}
                    className="text-blue-600 hover:bg-blue-50"
                  />
                </Tooltip>
                <Tooltip title="Grabar nota de voz">
                  <Button 
                    type="text" 
                    icon={<AudioOutlined />} 
                    size="small"
                    onClick={handleStartRecording}
                    className="text-green-600 hover:bg-green-50"
                    disabled={isRecording}
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
        
        {/* Botón de enviar */}
        <Button
          type="primary"
          icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
          onClick={handleSubmit}
          disabled={isLoading || (inputValue.trim() === '' && attachments.length === 0) || isRecording}
          className="rounded-full flex items-center justify-center h-10 w-10 bg-primary-600 hover:bg-primary-700 border-0 text-white shadow-md"
        />
        
        {/* Input oculto para selección de archivos */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          multiple
        />
      </div>
    </form>
  );
};

export default ChatInput; 