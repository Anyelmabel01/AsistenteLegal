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

const ChatInput = ({ onSendMessage, isLoading }) => {
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
      stopMediaTracks();
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
    
    const newAttachments = files.map(file => {
      // Determinar tipo de archivo
      let type = 'other';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else if (
        file.type === 'application/pdf' || 
        file.type.includes('word') || 
        file.type.includes('text') || 
        file.type.includes('document')
      ) {
        type = 'document';
      }
      
      return {
        file,
        name: file.name,
        size: file.size,
        type,
        id: crypto.randomUUID()
      };
    });
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachments(false);
    
    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  // Iniciar grabación de audio
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_note_${Date.now()}.webm`, { 
          type: 'audio/webm' 
        });
        
        const newAttachment = {
          file: audioFile,
          name: 'Nota de voz',
          size: audioFile.size,
          type: 'audio',
          id: crypto.randomUUID()
        };
        
        setAttachments(prev => [...prev, newAttachment]);
        setIsRecording(false);
        clearInterval(recordingInterval);
        setRecordingInterval(null);
        setRecordingTime(0);
      };
      
      // Iniciar grabación
      mediaRecorder.start();
      setIsRecording(true);
      
      // Iniciar contador de tiempo
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  // Detener grabación de audio
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
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
      {/* Visualización de adjuntos */}
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