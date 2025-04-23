import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'; // Use PaperAirplane for send
import { UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Icons for user/assistant

// Define the structure of a chat message
interface ChatMessage {
  id: string; // Unique ID for each message
  sender: 'user' | 'assistant' | 'system'; // System for errors/loading
  content: string;
  timestamp: Date;
}

// Keep the search result interface if needed for debugging context later
interface SearchResult {
  id: number;
  document_id: string;
  content: string;
  similarity: number;
}

const SearchPage: React.FC = () => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // We don't store context results in state anymore unless needed for display
  // const [results, setResults] = useState<SearchResult[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Function to add a message to the history
  const addMessage = (sender: ChatMessage['sender'], content: string) => {
    setChatHistory(prev => [
        ...prev,
        {
            id: crypto.randomUUID(), // Simple unique ID
            sender,
            content,
            timestamp: new Date(),
        }
    ]);
  };

  // Scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const handleSendMessage = async () => {
    const userMessageContent = currentQuery.trim();
    if (!userMessageContent || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentQuery(''); // Clear input field

    // 1. Add user message to history
    addMessage('user', userMessageContent);

    // Optional: Add a temporary loading message
    const loadingMessageId = crypto.randomUUID();
    setChatHistory(prev => [
        ...prev,
        {
            id: loadingMessageId,
            sender: 'assistant',
            content: 'Pensando...',
            timestamp: new Date(),
        }
    ]);

    try {
      // --- Step 1: Get context (same as before, but without setting results state) --- 
      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        'search-documents',
        {
          body: { query: userMessageContent }, // Use the captured user message
        }
      );

      if (searchError) throw new Error(`Error buscando documentos: ${searchError.message}`);
      if (searchData && searchData.error) throw new Error(`Error en la búsqueda: ${searchData.error}`);

      const retrievedDocs = searchData?.documents as SearchResult[] | undefined;
      if (!retrievedDocs || retrievedDocs.length === 0) {
          throw new Error('No se encontraron documentos relevantes para responder a tu consulta.');
      }

      // --- Step 2: Generate answer (same as before) --- 
      const { data: answerData, error: answerError } = await supabase.functions.invoke(
        'generate-answer',
        {
          body: {
            query: userMessageContent,
            context: retrievedDocs, 
          },
        }
      );

      if (answerError) throw new Error(`Error generando respuesta: ${answerError.message}`);
      if (answerData && answerData.error) throw new Error(`Error en la generación: ${answerData.error}`);

      let assistantResponse = "No se pudo obtener una respuesta."; // Default error response
      if (answerData && answerData.answer) {
        assistantResponse = answerData.answer;
      }

       // Remove loading message and add final assistant response
       setChatHistory(prev => [
            ...prev.filter(msg => msg.id !== loadingMessageId), // Remove loading message
            {
                id: crypto.randomUUID(),
                sender: 'assistant',
                content: assistantResponse,
                timestamp: new Date(),
            }
        ]);

    } catch (err: any) {
      console.error('Chat process failed:', err);
      const errorMessage = err.message || 'Ocurrió un error procesando tu solicitud.';
      setError(errorMessage); // Keep error state for potential top-level display
      // Remove loading message and add system error message to chat
      setChatHistory(prev => [
           ...prev.filter(msg => msg.id !== loadingMessageId),
           {
               id: crypto.randomUUID(),
               sender: 'system',
               content: `Error: ${errorMessage}`,
               timestamp: new Date(),
           }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
     // Changed container to be full height and use flex column
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 mt-4"> {/* Adjust height based on layout */} 
      <h3 className="text-lg font-medium leading-6 text-gray-900 p-4 border-b">Asistente Legal IA</h3>

       {/* Chat History Area */} 
       <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
            {chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}> 
                         {/* Icon */}
                         <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${ 
                              message.sender === 'user' ? 'bg-blue-500 text-white ml-2' : 
                              message.sender === 'assistant' ? 'bg-green-500 text-white mr-2' : 
                              'bg-red-500 text-white mr-2' 
                         }`}> 
                             {message.sender === 'user' ? 
                                <UserCircleIcon className="h-5 w-5" /> : 
                              message.sender === 'assistant' ? 
                                <SparklesIcon className="h-5 w-5" /> : 
                                '!'} 
                         </div> 
                         {/* Bubble */}
                        <div 
                           className={`px-4 py-2 rounded-lg shadow ${ 
                                message.sender === 'user' ? 'bg-blue-100 text-gray-800' : 
                                message.sender === 'assistant' && message.content === 'Pensando...' ? 'bg-gray-200 text-gray-600 italic' : 
                                message.sender === 'assistant' ? 'bg-green-50 text-gray-800' : 
                                'bg-red-100 text-red-700' // System/Error 
                            }`} 
                         > 
                             <p className="text-sm whitespace-pre-wrap">{message.content}</p> 
                             {/* <p className="text-xs text-gray-400 mt-1 text-right">{message.timestamp.toLocaleTimeString()}</p> */}
                         </div> 
                     </div> 
                 </div> 
            ))} 
         </div> 

      {/* Display general error if needed (e.g., for initial load issues) */}
      {/* {error && !isLoading && chatHistory.length === 0 && ( ... )} */}

      {/* Input Area */} 
       <div className="p-4 border-t flex items-center gap-2"> 
         <input 
           type="text" 
           value={currentQuery} 
           onChange={(e) => setCurrentQuery(e.target.value)} 
           placeholder="Escribe tu pregunta aquí..." 
           className="flex-grow shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" 
           disabled={isLoading} 
           onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSendMessage(); }} 
         /> 
         <button 
           onClick={handleSendMessage} 
           disabled={isLoading || !currentQuery.trim()} 
           className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
         > 
           <PaperAirplaneIcon className={`h-5 w-5 ${isLoading ? 'hidden' : ''}`} /> 
           {isLoading && ( 
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> 
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> 
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> 
             </svg> 
           )} 
           <span className="sr-only">Enviar</span> 
         </button> 
       </div> 
    </div>
  );
};

export default SearchPage; 