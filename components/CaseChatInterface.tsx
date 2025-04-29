'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../src/contexts/auth';
import { supabase } from '../src/lib/supabaseClient';
import { generateEmbedding } from '../lib/perplexity';
// Temporarily mock the function instead of importing it
// import { generateLegalAnalysis } from '../utils/openaiLegal';

// Properly define the user type
type User = {
  id: string;
  email?: string;
};

// Mock implementation of generateLegalAnalysis
const generateLegalAnalysis = async (messages: any[], caseContext: any) => {
  console.log('Mock generateLegalAnalysis called');
  return {
    assistantResponse: "Esta es una respuesta temporal mientras se configura el servicio de análisis legal.",
    references: ["Código Civil de Panamá, Art. 1"]
  };
};

type Message = {
  id: string;
  case_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  references?: string[];
  user_id: string;
};

type Props = {
  caseId: string;
};

export default function CaseChatInterface({ caseId }: Props) {
  const { user } = useAuth();
  const typedUser = user as User;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(false);
  const [deadlineDesc, setDeadlineDesc] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  // Función para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cargar datos del caso
  useEffect(() => {
    const fetchCaseData = async () => {
      if (!typedUser || !caseId || !supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();
          
        if (error) throw error;
        setCaseData(data);
      } catch (err) {
        console.error('Error al cargar datos del caso:', err);
      }
    };
    
    fetchCaseData();
  }, [caseId, typedUser]);

  // Cargar historial de mensajes para el caso específico
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!typedUser || !caseId || !supabase) {
        setMessages([]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('case_chat_messages')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw new Error(`Error cargando historial: ${fetchError.message}`);
        }

        if (data && data.length > 0) {
          setMessages(data);
        } else {
          // Mensaje inicial si no hay historial
          setMessages([
            {
              id: 'initial',
              case_id: caseId,
              role: 'assistant',
              content: 'Hola, soy tu asistente legal para este caso. Puedes preguntarme sobre detalles legales, estrategias o dudas relacionadas con este caso específico.',
              created_at: new Date().toISOString(),
              user_id: typedUser.id,
            },
          ]);
        }
      } catch (err: any) {
        console.error('Error al cargar historial:', err);
        setError(`Error al cargar el historial: ${err.message}`);
        
        setMessages([
          {
            id: 'error-initial',
            case_id: caseId,
            role: 'assistant', 
            content: 'Error al cargar historial. ¿En qué puedo ayudarte con este caso?', 
            created_at: new Date().toISOString(),
            user_id: typedUser.id
          }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [caseId, typedUser]);

  // Desplazarse al final cuando hay nuevos mensajes
  useEffect(() => {
    if (!isLoadingHistory) {
      scrollToBottom();
    }
  }, [messages, isLoadingHistory]);

  // Manejar envío de mensajes
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!typedUser || !caseId || !supabase) {
      setError('Error: Usuario no autenticado o caso no identificado.');
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: inputText,
      created_at: new Date().toISOString(),
      user_id: typedUser.id,
      case_id: caseId,
    };

    // Añadir mensaje del usuario a la UI optimistamente
    setMessages((prevMessages) => [...prevMessages, { ...userMessage, id: `temp-${Date.now()}` }]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    // Preparar historial para la IA
    const historyForAI = messages.map(msg => ({ role: msg.role, content: msg.content }));
    historyForAI.push({ role: 'user', content: inputText });

    try {
      // 1. Guardar mensaje del usuario
      const { data: savedUserMessage, error: insertError } = await supabase
        .from('case_chat_messages')
        .insert({
          role: userMessage.role,
          content: userMessage.content,
          user_id: userMessage.user_id,
          case_id: userMessage.case_id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Error guardando tu mensaje: ${insertError.message}`);
      }

      // 2. Generar respuesta del asistente con análisis legal
      const caseContext = caseData ? {
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        documentContent: caseData.extracted_text || '',
        analysis: caseData.analysis || ''
      } : null;
      
      const { 
        assistantResponse, 
        references 
      } = await generateLegalAnalysis(historyForAI, caseContext);

      if (!assistantResponse) {
        throw new Error('No se pudo obtener respuesta del asistente.');
      }

      // 3. Guardar respuesta del asistente
      const assistantMessageData = {
        role: 'assistant' as const,
        content: assistantResponse,
        references: references || [],
        user_id: typedUser.id,
        case_id: caseId,
        created_at: new Date().toISOString(), // Añadir created_at para evitar error de tipo
      };

      const { data: savedAssistantMessage, error: assistantInsertError } = await supabase
        .from('case_chat_messages')
        .insert(assistantMessageData)
        .select()
        .single();

      if (assistantInsertError) {
        console.error('Error guardando mensaje del asistente:', assistantInsertError.message);
        setMessages((prevMessages) => [...prevMessages, { ...assistantMessageData, id: `temp-assistant-${Date.now()}` }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, savedAssistantMessage]);
      }

    } catch (err: any) {
      console.error('Error al procesar mensaje:', err);
      setError(`Error: ${err.message}. Intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar tecla Enter para enviar mensaje
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Renderizar referencias legales si existen
  const renderReferences = (references?: string[]) => {
    if (!references || references.length === 0) return null;
    
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500">Referencias:</p>
        <ul className="mt-1 text-xs text-blue-600 space-y-1">
          {references.map((ref, index) => (
            <li key={index} className="hover:underline cursor-pointer">{ref}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Cargar plazos legales
  useEffect(() => {
    const fetchDeadlines = async () => {
      if (!typedUser || !caseId || !supabase) return;
      
      setIsLoadingDeadlines(true);
      
      try {
        const { data, error } = await supabase
          .from('legal_deadlines')
          .select('*')
          .eq('case_id', caseId)
          .order('deadline_date', { ascending: true });
          
        if (error) throw error;
        setDeadlines(data || []);
      } catch (err) {
        console.error('Error al cargar plazos legales:', err);
      } finally {
        setIsLoadingDeadlines(false);
      }
    };
    
    fetchDeadlines();
  }, [caseId, typedUser]);
  
  // Agregar un nuevo plazo legal
  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typedUser || !caseId || !supabase) {
      setError('Error: Usuario no autenticado o caso no identificado.');
      return;
    }
    
    if (!deadlineDesc.trim() || !deadlineDate) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('legal_deadlines')
        .insert({
          case_id: caseId,
          user_id: typedUser.id,
          description: deadlineDesc,
          deadline_date: deadlineDate
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Actualizar la lista de plazos localmente
      setDeadlines(prevDeadlines => [...prevDeadlines, data]);
      
      // Resetear el formulario
      setDeadlineDesc('');
      setDeadlineDate('');
      setShowDeadlineForm(false);
      setError(null);
      
    } catch (err: any) {
      console.error('Error al agregar plazo:', err);
      setError(`Error: ${err.message}`);
    }
  };
  
  // Marcar un plazo como completado
  const handleToggleDeadline = async (deadlineId: string, isCompleted: boolean) => {
    if (!typedUser || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('legal_deadlines')
        .update({ is_completed: !isCompleted })
        .eq('id', deadlineId);
      
      if (error) throw error;
      
      // Actualizar localmente
      setDeadlines(prevDeadlines => 
        prevDeadlines.map(d => 
          d.id === deadlineId 
            ? { ...d, is_completed: !isCompleted } 
            : d
        )
      );
      
    } catch (err) {
      console.error('Error al actualizar plazo:', err);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Sección de plazos legales */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Plazos Legales</h3>
          <button 
            onClick={() => setShowDeadlineForm(!showDeadlineForm)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDeadlineForm ? 'Cancelar' : '+ Agregar plazo'}
          </button>
        </div>
        
        {showDeadlineForm && (
          <form onSubmit={handleAddDeadline} className="mt-2 space-y-2">
            <input
              type="text"
              value={deadlineDesc}
              onChange={(e) => setDeadlineDesc(e.target.value)}
              placeholder="Descripción del plazo"
              className="w-full p-1 text-sm border border-gray-300 rounded"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="flex-1 p-1 text-sm border border-gray-300 rounded"
              />
              <button 
                type="submit" 
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
        
        {isLoadingDeadlines ? (
          <div className="py-2 text-center text-sm text-gray-500">Cargando plazos...</div>
        ) : deadlines.length > 0 ? (
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
            {deadlines.map((deadline) => (
              <div 
                key={deadline.id} 
                className={`flex items-center justify-between p-1 text-xs rounded ${
                  new Date(deadline.deadline_date) < new Date() && !deadline.is_completed
                    ? 'bg-red-50 text-red-800'
                    : deadline.is_completed
                      ? 'bg-green-50 text-green-800'
                      : 'bg-blue-50 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={deadline.is_completed}
                    onChange={() => handleToggleDeadline(deadline.id, deadline.is_completed)}
                    className="w-4 h-4"
                  />
                  <span className={deadline.is_completed ? 'line-through' : ''}>
                    {deadline.description}
                  </span>
                </div>
                <span className="font-medium">
                  {new Date(deadline.deadline_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center text-sm text-gray-500">No hay plazos registrados</div>
        )}
      </div>
      
      {/* Área de mensajes */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`max-w-[85%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-100 text-blue-900 ml-auto rounded-br-none' 
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
              }`}
            >
              <p className="break-words">{msg.content}</p>
              {renderReferences(msg.references)}
            </div>
          ))
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="p-2 bg-red-100 text-red-700 text-sm text-center border-t border-red-200">
          {error}
        </div>
      )}

      {/* Área de entrada */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta legal..."
            className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] max-h-[150px] resize-y"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading || !inputText.trim() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 