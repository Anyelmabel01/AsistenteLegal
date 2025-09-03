'use client';

import { useState } from 'react';
import ChatSidebarSimple from '../../components/ChatSidebarSimple';
import ChatInterfaceSimple from '../../components/ChatInterfaceSimple';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-steel-50">
      {/* Chat Sidebar */}
      <ChatSidebarSimple isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-steel-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-steel-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-navy-600" />
          </button>
          <h1 className="font-heading font-semibold text-navy">Lexi</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        {/* Chat interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterfaceSimple />
        </div>
      </div>
    </div>
  );
}