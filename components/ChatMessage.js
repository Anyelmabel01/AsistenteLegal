import React from 'react';

const ChatMessage = ({ message }) => {
  const isAssistant = message.role === 'assistant';

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
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        <div className={`text-xs mt-1 ${isAssistant ? 'text-secondary-400' : 'text-primary-200'}`}>
          {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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