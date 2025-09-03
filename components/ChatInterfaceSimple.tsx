'use client';

import React, { useState } from 'react';

const ChatInterfaceSimple: React.FC = () => {
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Gracias por tu consulta. Como asistente legal de Panamá, estoy aquí para ayudarte con información jurídica general. ¿Podrías ser más específico sobre tu consulta legal?',
        isUser: false
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Welcome Header - Solo se muestra cuando no hay mensajes */}
      {messages.length === 0 && (
        <div className="p-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="text-4xl mb-4">⚖️</div>
            <h1 className="text-2xl font-bold mb-2">Lexi</h1>
            <p className="text-blue-100 mb-4">Tu compañero inteligente para asesoría legal en Panamá</p>
            <p className="text-sm text-blue-200">🚀 Inicia sesión para acceder a todas las funciones avanzadas</p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-amber-50 rounded-xl p-6 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Hola! Te damos la bienvenida</h2>
              <p className="text-gray-600 mb-4">Para comenzar a usar tu asistente legal personal, solo necesitas crear una cuenta. ¡Es gratis y súper rápido! 🚀</p>
            </div>
          </div>
        ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-royal text-white'
                  : 'bg-steel-100 text-navy'
              }`}
            >
              {!message.isUser && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-royal">⚖️ Lexi</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-steel-100 text-navy max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-royal"></div>
                <span className="text-xs text-royal">Lexi está escribiendo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-steel-200 p-4 bg-white">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu consulta legal aquí..."
            className="flex-1 resize-none border border-steel-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-royal focus:border-transparent"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              !inputMessage.trim() || isLoading
                ? 'bg-steel-200 text-steel-500 cursor-not-allowed'
                : 'bg-royal text-white hover:bg-royal-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceSimple;