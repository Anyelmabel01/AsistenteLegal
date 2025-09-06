// Tipos para el sistema de gestión de chats

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  folderId?: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
  isPrivate: boolean;
  createdAt: Date;
  userId: string;
}

export interface ChatState {
  currentChat: Chat | null;
  chats: Chat[];
  folders: ChatFolder[];
  searchQuery: string;
}