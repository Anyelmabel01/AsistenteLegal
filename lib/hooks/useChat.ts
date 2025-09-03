'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chat, ChatFolder, ChatMessage, ChatState } from '../types/chat';

const STORAGE_KEY = 'legal-assistant-chats';
const FOLDERS_KEY = 'legal-assistant-folders';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    currentChat: null,
    chats: [],
    folders: [],
    searchQuery: ''
  });

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') return;
      
      const savedChats = localStorage.getItem(STORAGE_KEY);
      const savedFolders = localStorage.getItem(FOLDERS_KEY);
      
      if (savedChats) {
        try {
          const chats: Chat[] = JSON.parse(savedChats).map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            lastActivity: new Date(chat.lastActivity),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          
          setState(prev => ({ ...prev, chats }));
        } catch (error) {
          console.error('Error parsing saved chats:', error);
          // Clear corrupted data
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      
      if (savedFolders) {
        try {
          const folders: ChatFolder[] = JSON.parse(savedFolders).map((folder: any) => ({
            ...folder,
            createdAt: new Date(folder.createdAt)
          }));
          
          setState(prev => ({ ...prev, folders }));
        } catch (error) {
          console.error('Error parsing saved folders:', error);
          // Clear corrupted data
          localStorage.removeItem(FOLDERS_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    }
  }, []);

  // Save chats to localStorage
  const saveChats = useCallback((chats: Chat[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      }
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }, []);

  // Save folders to localStorage
  const saveFolders = useCallback((folders: ChatFolder[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      }
    } catch (error) {
      console.error('Error saving folders:', error);
    }
  }, []);

  // Create new chat
  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'Nuevo Chat',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    setState(prev => {
      const updatedChats = [newChat, ...prev.chats];
      saveChats(updatedChats);
      return {
        ...prev,
        chats: updatedChats,
        currentChat: newChat
      };
    });

    return newChat;
  }, [saveChats]);

  // Add message to current chat
  const addMessage = useCallback((content: string, isUser: boolean) => {
    if (!state.currentChat) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      isUser,
      timestamp: new Date()
    };

    setState(prev => {
      if (!prev.currentChat) return prev;

      const updatedChat = {
        ...prev.currentChat,
        messages: [...prev.currentChat.messages, newMessage],
        lastActivity: new Date(),
        // Auto-generate title from first user message
        title: prev.currentChat.messages.length === 0 && isUser 
          ? content.substring(0, 50) + (content.length > 50 ? '...' : '')
          : prev.currentChat.title
      };

      const updatedChats = prev.chats.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      );

      saveChats(updatedChats);

      return {
        ...prev,
        currentChat: updatedChat,
        chats: updatedChats
      };
    });
  }, [state.currentChat, saveChats]);

  // Select chat
  const selectChat = useCallback((chatId: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
      setState(prev => ({ ...prev, currentChat: chat }));
    }
  }, [state.chats]);

  // Rename chat
  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setState(prev => {
      const updatedChats = prev.chats.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      );
      
      saveChats(updatedChats);
      
      return {
        ...prev,
        chats: updatedChats,
        currentChat: prev.currentChat?.id === chatId 
          ? { ...prev.currentChat, title: newTitle }
          : prev.currentChat
      };
    });
  }, [saveChats]);

  // Delete chat
  const deleteChat = useCallback((chatId: string) => {
    setState(prev => {
      const updatedChats = prev.chats.filter(chat => chat.id !== chatId);
      saveChats(updatedChats);
      
      return {
        ...prev,
        chats: updatedChats,
        currentChat: prev.currentChat?.id === chatId ? null : prev.currentChat
      };
    });
  }, [saveChats]);

  // Create folder
  const createFolder = useCallback((name: string, color: string = '#004AAD') => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name,
      color,
      createdAt: new Date()
    };

    setState(prev => {
      const updatedFolders = [...prev.folders, newFolder];
      saveFolders(updatedFolders);
      return { ...prev, folders: updatedFolders };
    });

    return newFolder;
  }, [saveFolders]);

  // Rename folder
  const renameFolder = useCallback((folderId: string, newName: string) => {
    setState(prev => {
      const updatedFolders = prev.folders.map(folder =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      );
      
      saveFolders(updatedFolders);
      return { ...prev, folders: updatedFolders };
    });
  }, [saveFolders]);

  // Delete folder and move chats to root
  const deleteFolder = useCallback((folderId: string) => {
    setState(prev => {
      const updatedChats = prev.chats.map(chat =>
        chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
      );
      
      const updatedFolders = prev.folders.filter(folder => folder.id !== folderId);
      
      saveChats(updatedChats);
      saveFolders(updatedFolders);
      
      return {
        ...prev,
        chats: updatedChats,
        folders: updatedFolders
      };
    });
  }, [saveChats, saveFolders]);

  // Move chat to folder
  const moveChatToFolder = useCallback((chatId: string, folderId?: string) => {
    setState(prev => {
      const updatedChats = prev.chats.map(chat =>
        chat.id === chatId ? { ...chat, folderId } : chat
      );
      
      saveChats(updatedChats);
      
      return {
        ...prev,
        chats: updatedChats,
        currentChat: prev.currentChat?.id === chatId 
          ? { ...prev.currentChat, folderId }
          : prev.currentChat
      };
    });
  }, [saveChats]);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Get filtered chats based on search
  const getFilteredChats = useCallback(() => {
    if (!state.searchQuery) return state.chats;
    
    return state.chats.filter(chat =>
      chat.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      chat.messages.some(msg => 
        msg.content.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    );
  }, [state.chats, state.searchQuery]);

  return {
    ...state,
    createNewChat,
    addMessage,
    selectChat,
    renameChat,
    deleteChat,
    createFolder,
    renameFolder,
    deleteFolder,
    moveChatToFolder,
    setSearchQuery,
    getFilteredChats
  };
}