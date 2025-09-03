'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useChatSimple as useChat } from '../lib/hooks/useChatSimple';
import { useAuth } from '../lib/auth';
import { 
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  Cog6ToothIcon,
  HomeIcon,
  BuildingLibraryIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Chat, ChatFolder } from '../lib/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCustomizeTheme?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle, onCustomizeTheme }) => {
  const { user, signOut } = useAuth();
  const {
    currentChat,
    chats,
    folders,
    searchQuery,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    createFolder,
    renameFolder,
    deleteFolder,
    moveChatToFolder,
    setSearchQuery,
    getFilteredChats
  } = useChat();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);

  const navigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Nuevo Caso', href: '/casos/nuevo', icon: FolderIcon },
    { name: 'Documentos', href: '/documentos', icon: DocumentTextIcon },
    { name: 'Sitios Oficiales', href: '/sitios-oficiales', icon: BuildingLibraryIcon },
  ];

  const filteredChats = getFilteredChats();

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleEditChat = (chatId: string, newTitle: string) => {
    if (newTitle.trim()) {
      renameChat(chatId, newTitle.trim());
    }
    setEditingChat(null);
  };

  const handleEditFolder = (folderId: string, newName: string) => {
    if (newName.trim()) {
      renameFolder(folderId, newName.trim());
    }
    setEditingFolder(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const renderChat = (chat: Chat) => (
    <div key={chat.id} className="group relative">
      <div
        className={`
          flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200
          ${currentChat?.id === chat.id 
            ? 'bg-royal text-white' 
            : 'text-navy-600 hover:bg-royal-50 hover:text-royal'
          }
        `}
        onClick={() => selectChat(chat.id)}
      >
        <ChatBubbleLeftIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        {editingChat === chat.id ? (
          <input
            ref={editInputRef}
            type="text"
            defaultValue={chat.title}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            onBlur={(e) => handleEditChat(chat.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditChat(chat.id, (e.target as HTMLInputElement).value);
              } else if (e.key === 'Escape') {
                setEditingChat(null);
              }
            }}
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">{chat.title}</span>
        )}
        
        {/* Dropdown menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === chat.id ? null : chat.id);
            }}
            className="p-1 rounded hover:bg-black hover:bg-opacity-10"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
          
          {activeDropdown === chat.id && (
            <div className="absolute right-0 top-8 bg-white border border-steel-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChat(chat.id);
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-navy-600 hover:bg-steel-50 flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Renombrar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFolder = (folder: ChatFolder) => {
    const folderChats = filteredChats.filter(chat => chat.folderId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    
    return (
      <div key={folder.id} className="mb-2">
        <div className="group flex items-center justify-between px-3 py-2 text-sm text-navy-600 hover:bg-steel-50 rounded-lg cursor-pointer">
          <div 
            className="flex items-center flex-1"
            onClick={() => toggleFolder(folder.id)}
          >
            {isExpanded ? (
              <FolderOpenIcon className="w-4 h-4 mr-2" style={{ color: folder.color }} />
            ) : (
              <FolderIcon className="w-4 h-4 mr-2" style={{ color: folder.color }} />
            )}
            {editingFolder === folder.id ? (
              <input
                type="text"
                defaultValue={folder.name}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                onBlur={(e) => handleEditFolder(folder.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditFolder(folder.id, (e.target as HTMLInputElement).value);
                  } else if (e.key === 'Escape') {
                    setEditingFolder(null);
                  }
                }}
                autoFocus
              />
            ) : (
              <span className="flex-1">{folder.name}</span>
            )}
            <span className="text-xs text-navy-400 ml-2">({folderChats.length})</span>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === `folder-${folder.id}` ? null : `folder-${folder.id}`);
              }}
              className="p-1 rounded hover:bg-steel-100"
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
            
            {activeDropdown === `folder-${folder.id}` && (
              <div className="absolute right-0 bg-white border border-steel-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
                <button
                  onClick={() => {
                    setEditingFolder(folder.id);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-navy-600 hover:bg-steel-50 flex items-center"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Renombrar
                </button>
                <button
                  onClick={() => {
                    deleteFolder(folder.id);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="ml-4 space-y-1">
            {folderChats.map(renderChat)}
          </div>
        )}
      </div>
    );
  };

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
          <div className="flex items-center space-x-2">
            {onCustomizeTheme && (
              <button
                onClick={onCustomizeTheme}
                className="p-2 rounded-lg hover:bg-steel-100 transition-colors"
                title="Personalizar tema"
              >
                <PaintBrushIcon className="w-4 h-4 text-navy-600" />
              </button>
            )}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-steel-100 transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-navy-600" />
            </button>
          </div>
        </div>

        {/* User info */}
        {user && (
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
        )}

        {/* Chat section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New chat button */}
          <div className="p-4 border-b border-steel-200">
            <button
              onClick={createNewChat}
              className="w-full bg-royal text-white rounded-lg py-2 px-4 flex items-center justify-center hover:bg-royal-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Chat
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-steel-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                placeholder="Buscar chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-steel-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal focus:border-transparent"
              />
            </div>
          </div>

          {/* Chats and folders */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {/* Folders */}
            <div className="space-y-1 mb-4">
              {folders.map(renderFolder)}
              
              {/* New folder input */}
              {showNewFolderInput && (
                <div className="flex items-center px-3 py-2 bg-steel-50 rounded-lg">
                  <FolderIcon className="w-4 h-4 mr-2 text-navy-400" />
                  <input
                    ref={newFolderRef}
                    type="text"
                    placeholder="Nombre de carpeta"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setShowNewFolderInput(false);
                        setNewFolderName('');
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}
              
              {/* Add folder button */}
              <button
                onClick={() => {
                  setShowNewFolderInput(true);
                  setTimeout(() => newFolderRef.current?.focus(), 100);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-navy-500 hover:bg-steel-50 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Carpeta
              </button>
            </div>

            {/* Chats without folder */}
            <div className="space-y-1">
              {filteredChats
                .filter(chat => !chat.folderId)
                .map(renderChat)
              }
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

export default ChatSidebar;