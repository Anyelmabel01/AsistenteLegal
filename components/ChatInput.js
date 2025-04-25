import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() === '' || isLoading) return;
    
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="relative flex items-center">
        {/* Emoji button (optional) */}
        <button 
          type="button" 
          className="absolute left-3 text-secondary-400 hover:text-primary-500 transition-colors duration-200"
          aria-label="Insert Emoji"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "Espera mientras respondo..." : "Escribe tu consulta legal..."}
          className={`
            w-full py-3 px-12 pr-16 
            bg-secondary-50 rounded-full
            border border-secondary-200 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            placeholder-secondary-400
            transition-all duration-300
            ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:border-primary-300'}
          `}
          aria-label="Mensaje"
        />

        <button
          type="submit"
          disabled={inputText.trim() === '' || isLoading}
          className={`
            absolute right-3 
            rounded-full p-1.5
            transform transition-all duration-300
            ${
              inputText.trim() === '' || isLoading
                ? 'bg-secondary-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 active:scale-95'
            }
          `}
          aria-label="Enviar mensaje"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="white"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 