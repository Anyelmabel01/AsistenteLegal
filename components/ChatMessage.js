import React from 'react';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  // Estilos base para los mensajes
  const baseStyles = "p-3 rounded-lg max-w-[80%]";
  // Estilos específicos para el usuario y el asistente
  const userStyles = "bg-blue-500 text-white self-end";
  const assistantStyles = "bg-gray-200 text-gray-800 self-start";

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`${baseStyles} ${isUser ? userStyles : assistantStyles}`}>
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage; 