import React, { useState } from 'react';
import { Card, Avatar, Collapse, List, Typography } from 'antd';
import { UserOutlined, RobotOutlined, LinkOutlined } from '@ant-design/icons';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const { Panel } = Collapse;
const { Text } = Typography;

const ChatMessage = ({ message, showSources = false }) => {
  const isUser = message.role === 'user';
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const [isMessageSpeaking, setIsMessageSpeaking] = useState(false);
  
  const { speak, stop, speaking, supported } = useSpeechSynthesis();
  
  // Formatear datetime para mostrar
  const formattedTime = message.created_at 
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  
  const messageContent = message.content || '';
  
  // Verificar si el mensaje está en modo investigación
  const isResearchMode = message.research_mode === true;
  
  // Evaluar si hay fuentes para mostrar
  const hasSources = showSources && message.sources && Array.isArray(message.sources) && message.sources.length > 0;
  
  // Función para manejar la síntesis de voz
  const handleSpeech = () => {
    if (isMessageSpeaking) {
      stop();
      setIsMessageSpeaking(false);
    } else {
      speak(
        messageContent, 
        () => setIsMessageSpeaking(true),
        () => setIsMessageSpeaking(false)
      );
    }
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`${isUser ? 'order-2' : 'order-1'}`}>
        <Avatar
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          className={isUser ? 'bg-primary-dynamic' : 'bg-secondary-dynamic'}
        />
      </div>
      
      <div className={`px-2 ${isUser ? 'order-1 mr-2' : 'order-2 ml-2'} max-w-[85%]`}>
        <Card 
          size="small"
          className={`${isUser 
            ? 'chat-message-user bubble-rounded' 
            : 'chat-message-assistant bubble-rounded'
          } shadow-sm`}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Text className="text-xs text-gray-500 mr-2">{formattedTime}</Text>
              {!isUser && message.model && (
                <Text className="text-xs bg-gray-100 px-1 rounded">{message.model}</Text>
              )}
              {!isUser && isResearchMode && (
                <Text className="text-xs bg-blue-100 text-blue-800 px-1 rounded ml-1">Investigación</Text>
              )}
            </div>
            
            {/* Botón de síntesis de voz solo para mensajes de Lexi */}
            {!isUser && supported && messageContent.trim() && (
              <button
                onClick={handleSpeech}
                disabled={speaking && !isMessageSpeaking}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                title={isMessageSpeaking ? "Detener lectura" : "Leer mensaje"}
              >
                {isMessageSpeaking ? (
                  <PauseIcon className="h-4 w-4 text-blue-600" />
                ) : (
                  <SpeakerWaveIcon className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                )}
              </button>
            )}
          </div>
          
          <div className="prose prose-sm max-w-none markdown-body">
            {typeof ReactMarkdown === 'function' ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Aquí puedes definir componentes personalizados si necesitas estilos específicos
                  // Por ejemplo:
                  p: ({node, ...props}) => <p className="my-2" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary-dynamic hover:underline" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline 
                      ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                      : <code className="block bg-gray-100 p-2 rounded text-sm" {...props} />
                }}
              >
                {messageContent}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{messageContent}</div>
            )}
          </div>
          
          {/* Mostrar fuentes si hay y showSources es true */}
          {!isUser && hasSources && (
            <Collapse 
              ghost
              className="mt-2 border-t border-gray-100 pt-1"
            >
              <Panel header={
                <span className="text-xs text-secondary-600 font-medium">
                  Ver fuentes ({message.sources.length})
                </span>
              } key="1">
                <List
                  size="small"
                  dataSource={message.sources}
                  renderItem={(source, index) => {
                    // Intentar extraer URL y título de cualquier estructura posible
                    let url = '#';
                    let title = `Fuente ${index + 1}`;
                    
                    if (typeof source === 'string') {
                      url = source;
                    } else if (source && typeof source === 'object') {
                      url = source.id || source.url || (source.function?.arguments?.url) || '#';
                      title = source.title || source.name || source.function?.name || `Fuente ${index + 1}`;
                    }
                    
                    return (
                      <List.Item className="py-1 px-0">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center"
                        >
                          <LinkOutlined className="mr-1" /> 
                          <span>{`[${index + 1}] ${title}`}</span>
                        </a>
                      </List.Item>
                    );
                  }}
                />
              </Panel>
            </Collapse>
          )}
          
          {/* Mostrar adjuntos si hay */}
          {hasAttachments && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Text className="text-xs text-gray-500 block mb-1">
                Adjuntos:
              </Text>
              {message.attachments.map((attachment, index) => (
                <div key={index} className="text-xs">
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    {attachment.name}
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage; 