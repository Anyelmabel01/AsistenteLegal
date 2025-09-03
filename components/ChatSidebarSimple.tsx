'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/authSafe';
import { 
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  BuildingLibraryIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface ChatSidebarSimpleProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebarSimple: React.FC<ChatSidebarSimpleProps> = ({ isOpen, onToggle }) => {
  const { user, signOut } = useAuth();
  const [chats] = useState([
    { id: '1', title: 'Consulta sobre contrato laboral', messages: [] },
    { id: '2', title: 'Trámites societarios', messages: [] },
    { id: '3', title: 'Nuevo Chat', messages: [] }
  ]);

  const navigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Nuevo Caso', href: '/casos/nuevo', icon: FolderIcon },
    { name: 'Documentos', href: '/documentos', icon: DocumentTextIcon },
    { name: 'Sitios Oficiales', href: '/sitios-oficiales', icon: BuildingLibraryIcon },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white border-r border-steel-200 z-50 transform transition-transform duration-300 ease-in-out shadow-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-steel-200 bg-steel-50">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚖️</span>
            <span className="font-heading font-bold text-navy text-lg">Lexi</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-steel-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-navy-600" />
          </button>
        </div>

        {/* User info or Login button */}
        {user ? (
          <div className="p-4 border-b border-steel-200 bg-steel-25">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-royal rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                  {user.email}
                </p>
                <p className="text-xs text-navy-500">Usuario activo</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-steel-200 bg-steel-25">
            <div className="text-center">
              <button 
                onClick={() => {
                  // Aquí deberías abrir el modal de login o redirigir
                  alert('Funcionalidad de login pendiente de implementar');
                }}
                className="w-full bg-royal text-white rounded-lg py-2 px-4 hover:bg-royal-600 transition-colors font-medium"
              >
                Iniciar Sesión
              </button>
              <p className="text-xs text-navy-500 mt-2">
                Inicia sesión para acceder a todas las funciones
              </p>
            </div>
          </div>
        )}

        {/* Chat section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New chat button */}
          <div className="p-4 border-b border-steel-200">
            <button className="w-full bg-royal text-white rounded-lg py-2 px-4 flex items-center justify-center hover:bg-royal-600 transition-colors">
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Chat
            </button>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer text-navy-600 hover:bg-royal-50 hover:text-royal transition-all duration-200"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t border-steel-200 p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-navy-600 hover:bg-royal-50 hover:text-royal rounded-lg transition-all duration-200"
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sign out */}
          {user && (
            <div className="p-4 border-t border-steel-200">
              <button
                onClick={signOut}
                className="w-full btn-danger text-sm py-2 px-4 rounded-lg"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatSidebarSimple;