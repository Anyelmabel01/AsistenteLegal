import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { supabase } from '../src/lib/supabaseClient';
import { useAuth } from '../src/contexts/auth';
import { generateCompletion, generateWebSearchCompletion } from '../utils/perplexity';
import { SendOutlined, InfoCircleOutlined, RobotOutlined, UserOutlined, SearchOutlined, MessageOutlined, GlobalOutlined } from '@ant-design/icons';
import { Input, Select, Tooltip, Switch, Button } from 'antd';
import { processDocument } from '../utils/documentService';

const { TextArea } = Input;

const AVAILABLE_MODELS = [
  { label: 'Sonar Pro', value: 'sonar-pro' },
  { label: 'Sonar', value: 'sonar' }, 
  { label: 'Sonar Small', value: 'sonar-small-online' }, 
  { label: 'Llama 3-70B', value: 'llama-3-70b-instruct' },
  { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-instruct' },
];

const ChatInterface = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('sonar-pro');
  const [searchMode, setSearchMode] = useState(true); // true = búsqueda web, false = solo conversación
  const [researchMode, setResearchMode] = useState(false); // true = investigación profunda
  
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
            
          if (error) {
            console.error('Error subiendo archivo:', error);
            throw new Error(`Error subiendo archivo ${name}: ${error.message || JSON.stringify(error)}`);
          }
          
          // Obtener URL pública
          const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
            
          const publicUrl = publicUrlData.publicUrl;
          
          // Si es un documento, procesar contenido para análisis
          let content = null;
          if (type === 'document') {
            // content = await processDocument(file); // <-- Funcion inexistente eliminada
            // TODO: Implementar extracción de texto del lado del cliente o backend
            content = `[Contenido del documento ${name} no extraído directamente]`;
            // Eliminar el bloque try-catch que ya no es necesario aquí
            /*
            try {
              content = await processDocument(file);
            } catch (docError) {
              console.warn(`No se pudo procesar el contenido del documento ${name}:`, docError);
              // Continuar sin el contenido del documento
              content = 'No se pudo extraer contenido del documento';
            }
            */
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
      // Mejorar el mensaje de error para incluir detalles específicos
      const errorMessage = error.message || 
                          (typeof error === 'object' ? JSON.stringify(error) : 'Error desconocido');
      throw new Error(`Error procesando archivos adjuntos: ${errorMessage}`);
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (inputText, attachments = []) => {
    if (!user) {
      setError('Error: Usuario no autenticado.');
      return;
    }

    if (inputText.trim() === '' && attachments.length === 0) {
      return; // No enviar mensajes vacíos sin adjuntos
    }

    // Crear objeto para mensaje del usuario
    const userMessage = {
      role: 'user',
      content: inputText,
      created_at: new Date().toISOString(),
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
            // Ya no insertamos el 'content' directamente aquí, ya que no lo extrajimos realmente.
            // El placeholder asignado arriba se guardará en la BD en `userMessage.attachments`
            return `[Documento adjunto: ${att.name}]`;
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
          attachments: processedAttachments,
          model: selectedModel,
          search_mode: searchMode
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
      historyForAI.push({ role: 'user', content: userMessage.content });

      // --- DEBUG LOG ---
      console.log('Llamando a API:', { searchMode, model: selectedModel, query: enhancedUserContent }); // Log para web search
      console.log('Historial para API (si no search):', historyForAI); // Log para modo conversacional
      // --- FIN DEBUG LOG ---

      try {
        // Llamar a la API correcta según el modo
        let assistantResponse;
        
        if (searchMode) {
          // Para el modo de investigación, usamos sonar-pro con un prompt específico
          if (researchMode) {
            assistantResponse = await generateWebSearchCompletion(enhancedUserContent, { 
              model: 'sonar-pro',
              systemPrompt: 'Eres un asistente legal especializado en realizar investigaciones profundas. Tu objetivo es proporcionar análisis exhaustivos con fuentes bibliográficas, leyes, jurisprudencia y doctrina. Debes explorar múltiples perspectivas sobre cada tema, citar correctamente tus fuentes con números entre corchetes, y presentar un razonamiento detallado paso a paso. No te limites a respuestas superficiales. Investiga a fondo, evalúa críticamente las fuentes y elabora conclusiones fundamentadas.'
            });
          } else {
            // Modo búsqueda normal
            assistantResponse = await generateWebSearchCompletion(enhancedUserContent, { model: selectedModel });
          }
        } else {
          // Modo conversación normal
          assistantResponse = await generateCompletion(historyForAI, { model: selectedModel });
        }

        if (!assistantResponse) {
          throw new Error('No se pudo obtener respuesta del asistente.');
        }

        const assistantMessageData = {
          role: 'assistant',
          content: assistantResponse.content,
          user_id: user.id,
          model: selectedModel,
          search_mode: searchMode,
          research_mode: researchMode,
          sources: assistantResponse.sources || []
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
    } catch (err) {
      console.error('Error handling message:', err);
      setError(`Error: ${err.message}. Intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para limpiar la conversación
  const handleClearConversation = async () => {
    if (!user) return;
    
    try {
      // Eliminar todos los mensajes del usuario de la base de datos
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Resetear los mensajes y mostrar el mensaje inicial
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: 'Hola! Soy tu asistente legal. ¿En qué puedo ayudarte hoy?',
          created_at: new Date().toISOString(),
          user_id: user.id,
        }
      ]);
    } catch (err) {
      console.error('Error clearing conversation:', err);
      setError(`Error al limpiar la conversación: ${err.message}`);
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
        
        <div className="flex items-center space-x-3">
          {/* Selector de modelo */}
          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            options={AVAILABLE_MODELS}
            style={{ width: 140 }}
            className="text-sm"
            disabled={isLoading}
          />
          
          {/* Switch para modo de búsqueda */}
          <div className="flex items-center space-x-2">
            <Tooltip title={searchMode ? "Búsqueda web activa" : "Modo conversación"}>
              <Switch
                checked={searchMode}
                onChange={(checked) => {
                  setSearchMode(checked);
                  if (!checked) setResearchMode(false); // Desactivar investigación si se desactiva búsqueda
                }}
                checkedChildren={<GlobalOutlined />}
                unCheckedChildren={<MessageOutlined />}
                disabled={isLoading}
              />
            </Tooltip>
          </div>
          
          {/* Switch para modo de investigación */}
          {searchMode && (
            <div className="flex items-center space-x-2">
              <Tooltip title={researchMode ? "Investigación profunda activa" : "Búsqueda normal"}>
                <Switch
                  checked={researchMode}
                  onChange={setResearchMode}
                  checkedChildren={<SearchOutlined />}
                  unCheckedChildren={<SearchOutlined style={{ opacity: 0.5 }} />}
                  disabled={isLoading || !searchMode}
                />
              </Tooltip>
            </div>
          )}
          
          {/* Botón de limpiar conversación */}
          <Tooltip title="Limpiar conversación">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={handleClearConversation}
              disabled={isLoading || messages.length <= 1}
              className="text-secondary-500 hover:text-secondary-700"
            />
          </Tooltip>
          
          {/* Indicador de carga */}
          {isLoading && (
            <div className="flex items-center text-primary-600 text-sm">
              <div className="animate-pulse-slow mr-2 h-2 w-2 rounded-full bg-primary-600"></div>
              <div className="animate-pulse-slow animation-delay-300 mr-2 h-2 w-2 rounded-full bg-primary-600"></div>
              <div className="animate-pulse-slow animation-delay-600 h-2 w-2 rounded-full bg-primary-600"></div>
            </div>
          )}
        </div>
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
              <ChatMessage 
                message={msg} 
                showSources={searchMode && msg.role === 'assistant' && msg.sources && msg.sources.length > 0}
              />
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