import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { supabase } from '../src/lib/supabaseClient';
import { useAuth } from '../src/contexts/auth'; // Importando directamente de auth
import { generateCompletion } from '../utils/perplexity'; // Cambiado a perplexity
import { SendOutlined, InfoCircleOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { processDocument } from '../utils/documentService';

const { TextArea } = Input;

const ChatInterface = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // State for loading history
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load message history for the logged-in user
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setMessages([]); // Clear messages if no user
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }); // Load in chronological order

        if (fetchError) {
          throw new Error(`Error cargando historial: ${fetchError.message}`);
        }

        if (data && data.length > 0) {
          setMessages(data);
        } else {
          // Start with initial assistant message if no history
          setMessages([
            {
              id: 'initial',
              role: 'assistant',
              content: 'Hola! Soy tu asistente legal. ¿En qué puedo ayudarte hoy?',
              created_at: new Date().toISOString(),
              user_id: user.id, // Assign to user for consistency, though it's assistant
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError(`Error al cargar el historial: ${err.message}`);
        setMessages([ // Fallback initial message on error
          { id: 'error-initial', role: 'assistant', content: 'Error al cargar historial. ¿Cómo puedo ayudarte?', created_at: new Date().toISOString() }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [user]); // Reload history when user changes

  // Scroll to bottom when new messages arrive or history loads
  useEffect(() => {
    if (!isLoadingHistory) { // Only scroll after history is loaded
      scrollToBottom();
    }
  }, [messages, isLoadingHistory]);

  // Función para procesar archivos adjuntos
  const processAttachments = async (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    
    try {
      // Procesar cada adjunto y subir a Supabase Storage
      const processedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          const { file, type, name } = attachment;
          const timestamp = Date.now();
          const filePath = `${user.id}/${timestamp}_${name.replace(/\s+/g, '_')}`;
          
          // Subir el archivo a Supabase Storage
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (error) throw error;
          
          // Obtener URL pública
          const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
            
          const publicUrl = publicUrlData.publicUrl;
          
          // Si es un documento, procesar contenido para análisis
          let content = null;
          if (type === 'document') {
            content = await processDocument(file);
          }
          
          return {
            type,
            name,
            url: publicUrl,
            filePath,
            content,
            size: file.size
          };
        })
      );
      
      return processedAttachments;
      
    } catch (error) {
      console.error('Error procesando adjuntos:', error);
      throw new Error(`Error procesando archivos adjuntos: ${error.message}`);
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (inputText, attachments = []) => {
    if (!user) { // Removed sessionId check for now
      setError('Error: Usuario no autenticado.');
      return;
    }

    if (inputText.trim() === '' && attachments.length === 0) {
      return; // No enviar mensajes vacíos sin adjuntos
    }

    // Crear objeto para mensaje del usuario
    const userMessage = {
      // id is generated by DB now, no need for client-side UUID
      role: 'user',
      content: inputText,
      created_at: new Date().toISOString(), // Keep for immediate display
      user_id: user.id,
    };

    // Optimistically add user message to UI with ID temporal
    const tempUserId = `temp-${crypto.randomUUID()}`;
    setMessages((prevMessages) => [...prevMessages, { ...userMessage, id: tempUserId }]);
    setIsLoading(true);
    setError(null);

    try {
      // Procesar adjuntos si hay
      let processedAttachments = null;
      let enhancedUserContent = inputText;
      
      if (attachments && attachments.length > 0) {
        processedAttachments = await processAttachments(attachments);
        
        // Agregar información sobre adjuntos al mensaje
        const attachmentDescriptions = processedAttachments.map(att => {
          if (att.type === 'image') {
            return `[Imagen adjunta: ${att.name}]`;
          } else if (att.type === 'audio') {
            return `[Nota de voz]`;
          } else if (att.type === 'document') {
            return `[Documento adjunto: ${att.name}]\nContenido del documento:\n${att.content || 'No se pudo extraer contenido'}`;
          }
          return `[Archivo adjunto: ${att.name}]`;
        });
        
        // Agregar descripciones de adjuntos al texto del mensaje
        if (attachmentDescriptions.length > 0) {
          enhancedUserContent = `${inputText}\n\n${attachmentDescriptions.join('\n')}`;
        }
        
        userMessage.content = enhancedUserContent;
        userMessage.attachments = processedAttachments;
      }

      // 1. Guardar mensaje del usuario con contenido aumentado en Supabase
      const { data: savedUserMessage, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          role: userMessage.role,
          content: userMessage.content,
          user_id: userMessage.user_id,
          attachments: processedAttachments // Guardar metadatos de adjuntos
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Error guardando tu mensaje: ${insertError.message}`);
      }

      // Actualizar el mensaje temporal del usuario con el real de la BD
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg.id === tempUserId ? { ...savedUserMessage } : msg
        )
      );

      // Preparar historial de mensajes para la API, incluyendo el mensaje aumentado con adjuntos
      const historyForAI = messages
        .filter(msg => msg.id !== tempUserId) // Excluir el mensaje temporal
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // Añadir el mensaje del usuario con contenido procesado
      historyForAI.push({ role: 'user', content: enhancedUserContent });

      // 2. Obtener respuesta del asistente usando el historial aumentado
      const assistantResponseContent = await generateCompletion(historyForAI);

      if (!assistantResponseContent) {
        throw new Error('No se pudo obtener respuesta del asistente.');
      }

      const assistantMessageData = {
        role: 'assistant',
        content: assistantResponseContent,
        user_id: user.id, // Still associate with the user for RLS
      };

      // 3. Guardar mensaje del asistente en Supabase
      const { data: savedAssistantMessage, error: assistantInsertError } = await supabase
        .from('chat_messages')
        .insert(assistantMessageData)
        .select()
        .single();

      if (assistantInsertError) {
        console.error('Error saving assistant message:', assistantInsertError.message);
        // Even if saving fails, show response to user
        setMessages((prevMessages) => [...prevMessages, { ...assistantMessageData, id: `temp-assistant-${crypto.randomUUID()}` }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, savedAssistantMessage]);
      }

    } catch (err) {
      console.error('Error handling message:', err);
      setError(`Error: ${err.message}. Intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-hover overflow-hidden border border-primary-100 transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="bg-white border-b border-primary-100 p-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-secondary-800">Asistente Legal</h2>
            <p className="text-xs text-secondary-500">Disponible 24/7</p>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center text-primary-600 text-sm">
            <div className="animate-pulse-slow mr-2 h-2 w-2 rounded-full bg-primary-600"></div>
            <div className="animate-pulse-slow animation-delay-300 mr-2 h-2 w-2 rounded-full bg-primary-600"></div>
            <div className="animate-pulse-slow animation-delay-600 h-2 w-2 rounded-full bg-primary-600"></div>
          </div>
        )}
      </div>

      {/* Message Display Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-opacity-50">
        {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-bounce-subtle flex space-x-1">
                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                <div className="w-3 h-3 bg-primary-500 rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-primary-600 rounded-full animation-delay-400"></div>
              </div>
            </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-fade-in">
              <ChatMessage message={msg} />
            </div>
          ))
        )}
        {/* Ref to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-100 text-red-700 text-sm text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-primary-100 animate-slide-in">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface; 