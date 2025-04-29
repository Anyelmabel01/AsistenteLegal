import React, { useState } from 'react';
import { LinkOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';

const ChatMessage = ({ message, showSources = false }) => {
  const isAssistant = message.role === 'assistant';
  const [showAllSources, setShowAllSources] = useState(false);
  
  // Procesar enlaces en el contenido del mensaje
  const renderMessageContent = (content) => {
    if (!content) return '';
    
    // Expresión regular para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Separar contenido por URLs y renderizar enlaces
    const parts = content.split(urlRegex);
    const matches = content.match(urlRegex) || [];
    
    return parts.map((part, index) => {
      // Si esta parte coincide con una URL, renderizarla como enlace
      if (matches.includes(part)) {
        return (
          <a 
            key={index}
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`underline ${isAssistant ? 'text-primary-600' : 'text-primary-200'}`}
          >
            {part} <LinkOutlined className="text-xs" />
          </a>
        );
      }
      
      // Renderizar texto normal
      return part;
    });
  };

  return (
    <div 
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4 transform transition-all duration-300 hover:scale-[1.01]`}
    >
      {isAssistant && (
        <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center mr-2 shadow-soft">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
      )}
      
      <div 
        className={`p-3 rounded-2xl max-w-[80%] shadow-soft ${
          isAssistant 
            ? 'bg-white border border-primary-100 rounded-tl-none' 
            : 'bg-primary-600 text-white rounded-tr-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
        
        {/* Mostrar fuentes de información si existen */}
        {showSources && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button 
              onClick={() => setShowAllSources(!showAllSources)}
              className="flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 mb-2"
            >
              {showAllSources ? (
                <>Ocultar fuentes <UpOutlined className="ml-1" /></>
              ) : (
                <>Mostrar fuentes ({message.sources.length}) <DownOutlined className="ml-1" /></>
              )}
            </button>
            
            {showAllSources && (
              <div className="text-xs space-y-2 bg-primary-50 p-2 rounded-md">
                {message.sources.map((source, index) => (
                  <div key={index} className="flex flex-col">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
                    >
                      [{index + 1}] {source.title || 'Enlace'} <LinkOutlined className="ml-1" />
                    </a>
                    {source.snippet && (
                      <p className="text-gray-600 mt-1">{source.snippet.substring(0, 120)}...</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Metadatos */}
        <div className="flex items-center justify-between text-xs mt-2">
          <div className={`${isAssistant ? 'text-secondary-400' : 'text-primary-200'}`}>
            {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          
          {/* Mostrar modelo usado si está disponible */}
          {isAssistant && message.model && (
            <div className="text-secondary-400 bg-secondary-50 px-1.5 py-0.5 rounded-full">
              {message.model}
            </div>
          )}
        </div>
      </div>
      
      {!isAssistant && (
        <div className="h-8 w-8 rounded-full bg-secondary-700 flex items-center justify-center ml-2 shadow-soft">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 