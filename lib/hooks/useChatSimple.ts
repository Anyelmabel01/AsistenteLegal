'use client';

import { useState, useCallback } from 'react';

// Simplified chat hook for initial implementation
export function useChatSimple() {
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const createNewChat = useCallback(() => {
    const newChat = {
      id: `chat-${Date.now()}`,
      title: 'Nuevo Chat con Lexi',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    return newChat;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  }, [chats]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, title: newTitle } : null);
    }
  }, [currentChat]);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  }, [currentChat]);

  const createFolder = useCallback((name: string, color: string = '#004AAD') => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      color,
      createdAt: new Date()
    };
    
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders(prev => prev.map(folder =>
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    // Move chats out of folder
    setChats(prev => prev.map(chat =>
      chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
    ));
  }, []);

  const moveChatToFolder = useCallback((chatId: string, folderId?: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, folderId } : chat
    ));
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, folderId } : null);
    }
  }, [currentChat]);

  const getFilteredChats = useCallback(() => {
    if (!searchQuery) return chats;
    
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const addMessage = useCallback((content: string, isUser: boolean) => {
    if (!currentChat) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      isUser,
      timestamp: new Date()
    };

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage],
      lastActivity: new Date(),
      title: currentChat.messages.length === 0 && isUser 
        ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
        : currentChat.title
    };

    setChats(prev => prev.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ));
    setCurrentChat(updatedChat);
  }, [currentChat]);

  return {
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
    getFilteredChats,
    addMessage
  };
}