'use client';

import { useState } from 'react';

export default function ChatTestPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    'Hola! Soy Lexi, tu asistente legal. Esta es una versión de prueba para identificar el error.'
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, `Usuario: ${message}`, 'Lexi: Gracias por tu mensaje. ¿En qué puedo ayudarte?']);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Chat de Prueba - Lexi</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
            {msg}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Escribe un mensaje..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}