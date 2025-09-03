'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authSafe';
import { 
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  FolderIcon,
  Cog6ToothIcon,
  HomeIcon,
  BuildingLibraryIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Chat Legal', href: '/chat', icon: ChatBubbleLeftIcon },
    { name: 'Nuevo Caso', href: '/casos/nuevo', icon: FolderIcon },
    { name: 'Documentos', href: '/documentos', icon: DocumentTextIcon },
    { name: 'Panel', href: '/dashboard', icon: Cog6ToothIcon },
    { name: 'Sitios Oficiales', href: '/sitios-oficiales', icon: BuildingLibraryIcon },
  ];

  const isCurrentPath = (path: string) => pathname === path;

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
        fixed top-0 left-0 h-full w-64 bg-white border-r border-steel-200 z-50 transform transition-transform duration-300 ease-in-out shadow-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-steel-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚖️</span>
            <span className="font-heading font-bold text-navy text-lg">Lexi</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-lg hover:bg-steel-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-navy-600" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 border-b border-steel-200 bg-steel-50">
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

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPath(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${current 
                      ? 'bg-royal text-white shadow-sm' 
                      : 'text-navy-600 hover:bg-royal-50 hover:text-royal'
                    }
                  `}
                  onClick={() => {
                    // Close mobile sidebar on navigation
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors
                    ${current ? 'text-white' : 'text-navy-400 group-hover:text-royal'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer / Sign out */}
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
    </>
  );
};

export default Sidebar;