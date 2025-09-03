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

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onPdfFileSelected?: (file: File) => void;
  isProcessingPdf?: boolean;
  pdfFileName?: string | null;
  pdfError?: string | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  onPdfFileSelected, 
  isProcessingPdf, 
  pdfFileName, 
  pdfError 
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showAttachments, setShowAttachments] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isToggleInProgressRef = useRef(false);

  // Ref para el pipeline de transcripción y estados relacionados
  const transcriberPipelineRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Inicializar el pipeline de transcripción
  useEffect(() => {
    async function initializeTranscriber() {
      if (!transcriberPipelineRef.current && !isModelLoading) {
        setIsModelLoading(true);
        try {
          console.log('Inicializando pipeline de transcripción...');
          // Usamos Xenova/whisper-tiny para una carga más rápida inicialmente
          // const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny'); // Disabled for now
          console.log('Transcripción deshabilitada temporalmente para evitar errores de build');
          // transcriberPipelineRef.current = transcriber;
          console.log('Pipeline de transcripción listo.');
        } catch (error) {
          console.error('Error al inicializar el pipeline de transcripción:', error);
          // Aquí podrías informar al usuario del error
        }
        setIsModelLoading(false);
      }
    }
    initializeTranscriber();
  }, [isModelLoading]); // Agregar dependencia isModelLoading

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
    console.log('[ChatInput] stopMediaTracks llamado.');
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
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
    
    // Validar número de archivos
    if (files.length > 10) {
      alert('Máximo 10 archivos permitidos a la vez.');
      return;
    }
    
    const newGenericAttachments = [];
    let pdfFileFound = false;
    const maxFileSize = 50 * 1024 * 1024; // 50MB límite
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'audio/webm'
    ];

    files.forEach(file => {
      // Validar tamaño del archivo
      if (file.size > maxFileSize) {
        alert(`El archivo ${file.name} es demasiado grande (máximo 50MB).`);
        return;
      }
      
      // Validar tipo de archivo
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipo de archivo no permitido: ${file.name}. Tipos permitidos: PDF, Word, texto, imágenes, audio.`);
        return;
      }
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

  // Iniciar grabación de audio
  const handleStartRecording = async () => {
    console.log('[ChatInput] handleStartRecording llamado.');
    if (isModelLoading || isTranscribing) { 
      alert('El sistema está ocupado, espera a que termine la carga del modelo o la transcripción.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('[ChatInput] mediaRecorder.ondataavailable disparado. Tamaño de e.data:', e.data.size);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('[ChatInput] mediaRecorder.onstop ejecutado.');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('[ChatInput] Tamaño del audioBlob:', audioBlob.size);
        
        audioChunksRef.current = [];
        setIsRecording(false);
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }
        setRecordingTime(0);
        stopMediaTracks();

        // Transcripción deshabilitada temporalmente
        if (true) { // !transcriberPipelineRef.current || isModelLoading) {
          alert('Transcripción de audio temporalmente deshabilitada. Usa texto por ahora.');
          return;
        }

        setIsTranscribing(true);
        let audioURL = null;

        try {
          console.log('Creando Object URL para el audio blob...');
          audioURL = URL.createObjectURL(audioBlob);
          console.log('Object URL creado:', audioURL);
          console.log('Transcribiendo audio desde URL...');
          
          // const transcription = await transcriberPipelineRef.current(audioURL); // Disabled
          const transcription = { text: 'Transcripción no disponible' };
          console.log('Transcripción completa:', transcription);
          
          if (transcription && typeof transcription.text === 'string' && transcription.text.trim() !== '') {
            onSendMessage(transcription.text, []);
            setInputValue('');
          } else if (transcription && typeof transcription.text === 'string' && transcription.text.trim() === '') {
            console.log('Transcripción resultó en texto vacío (posiblemente silencio detectado).');
            alert('No se detectó voz en el audio o la grabación está vacía.');
          } else {
            console.error('Formato de transcripción inesperado o texto faltante:', transcription);
            alert('No se pudo obtener texto de la transcripción. Formato inesperado.');
          }

        } catch (error) {
          console.error('Error detallado durante la transcripción:', error);
          alert('Ocurrió un error al transcribir el audio. Revisa la consola para más detalles.');
        } finally {
          setIsTranscribing(false);
          if (audioURL) {
            console.log('Revocando Object URL:', audioURL);
            URL.revokeObjectURL(audioURL);
          }
        }
      };
      
      // Escuchar errores en MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('[ChatInput] MediaRecorder error:', event.error);
        // Podríamos también intentar alertar al usuario o resetear estados aquí si es necesario
        alert(`Error con MediaRecorder: ${event.error.name} - ${event.error.message}`);
        setIsRecording(false); // Asegurar que el estado de grabación se resetee
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }
        setRecordingTime(0);
        stopMediaTracks(); // Detener tracks si hubo un error en el recorder
      };
      
      mediaRecorder.start();
      console.log('[ChatInput] mediaRecorder.start() llamado. Estado:', mediaRecorderRef.current?.state);
      setIsRecording(true);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      setIsRecording(false);
    }
  };

  // Detener grabación de audio
  const handleStopRecording = () => {
    console.log('[ChatInput] handleStopRecording llamado. Estado del MediaRecorder:', mediaRecorderRef.current?.state);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      console.log('[ChatInput] handleStopRecording: MediaRecorder no activo o no existe.');
    }
  };

  // NUEVA FUNCIÓN: Manejar el inicio/parada de grabación con un solo botón
  const handleToggleRecording = async () => {
    if (isToggleInProgressRef.current) {
      console.log('[ChatInput] Toggle en progreso, ignorando clic.');
      return;
    }

    console.log('[ChatInput] handleToggleRecording. isRecording:', isRecording, 'isModelLoading:', isModelLoading, 'isTranscribing:', isTranscribing);
    if (isModelLoading || isTranscribing) {
        alert('Espera a que termine la carga del modelo o la transcripción actual.');
        return;
    }

    isToggleInProgressRef.current = true; // Bloquear
    try {
      if (isRecording) {
        handleStopRecording(); // Sincrónico, onstop es asincrónico y maneja setIsRecording(false)
      } else {
        await handleStartRecording(); // Asincrónico, maneja setIsRecording(true)
      }
    } catch (error) {
      console.error('[ChatInput] Error en handleToggleRecording:', error);
      // Asegurar que se desbloquee incluso si hay un error inesperado aquí
    } finally {
      isToggleInProgressRef.current = false; // Desbloquear
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

      {/* Indicador de carga del modelo de IA */}
      {isModelLoading && (
        <div className="flex items-center text-sm text-purple-600 p-2 bg-purple-50 rounded-md mb-2">
          <LoadingOutlined className="mr-2" />
          Cargando modelo de IA para transcripción... (puede tardar la primera vez)
        </div>
      )}

      {/* Indicador de transcripción en progreso */}
      {isTranscribing && (
        <div className="flex items-center text-sm text-teal-600 p-2 bg-teal-50 rounded-md mb-2">
          <LoadingOutlined className="mr-2" />
          Transcribiendo audio...
        </div>
      )}
      
      {/* Interfaz de grabación */}
      {isRecording && (
        <div className="flex items-center justify-between bg-red-50 p-2 rounded-md mb-2 animate-pulse">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-red-700 font-medium">Grabando: {formatTime(recordingTime)}</span>
          </div>
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
            disabled={isLoading || isRecording || isModelLoading || isTranscribing}
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
                disabled={isLoading || isRecording || isModelLoading || isTranscribing}
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
                <Tooltip title={isRecording ? "Detener grabación" : "Grabar nota de voz"}>
                  <Button 
                    type="text" 
                    icon={isRecording ? <StopIcon className="h-5 w-5" /> : <AudioOutlined />}
                    size="small"
                    onClick={handleToggleRecording}
                    className={isRecording ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                    disabled={isModelLoading || isTranscribing}
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
          disabled={isLoading || (inputValue.trim() === '' && attachments.length === 0) || isRecording || isModelLoading || isTranscribing}
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