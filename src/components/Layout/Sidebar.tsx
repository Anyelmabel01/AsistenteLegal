'use client'; // Add use client directive

import React, { useState } from 'react';
// Remove react-router-dom imports
// import { NavLink, useLocation } from 'react-router-dom';
import Link from 'next/link'; // Import Link from next/link
import { usePathname } from 'next/navigation'; // Import usePathname
import {
  ScaleIcon, // Keep for logo
  ChatBubbleLeftRightIcon, // For Chat
  DocumentTextIcon, // For Documentos
  BookOpenIcon, // For Guía
  ArrowUpTrayIcon, // For Actualizaciones
} from '@heroicons/react/24/outline';

const navigationItems = [
  // We no longer need the 'current' property here, it will be determined dynamically
  { name: 'Chat', href: '/', icon: ChatBubbleLeftRightIcon },
  { name: 'Documentos Legales', href: '/documentos', icon: DocumentTextIcon },
  { name: 'Guía', href: '/guia', icon: BookOpenIcon },
  { name: 'Actualizaciones', href: '/actualizaciones', icon: ArrowUpTrayIcon }, // Add new item
  // Add more navigation items here
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar: React.FC = () => {
  // const location = useLocation(); // Remove useLocation
  const pathname = usePathname(); // Get current pathname from next/navigation
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    // Charcoal background (bg-gray-800), full height
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-secondary-800 to-secondary-900 px-6 pb-4 h-full">
      <div className="flex h-16 shrink-0 items-center gap-x-3 mt-2 animate-fade-in">
        <div className="relative">
          <ScaleIcon className="h-8 w-auto text-primary-400 animate-pulse-slow" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping"></div>
        </div>
        <span className="text-white font-semibold text-lg tracking-wide">Asistente Legal</span>
      </div>
      <nav className="flex flex-1 flex-col animate-slide-in">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.name;
                
                return (
                  <li 
                    key={item.name} 
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="relative"
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={classNames(
                        isActive
                          ? 'bg-primary-600 text-white' 
                          : 'text-secondary-300 hover:text-white hover:bg-secondary-700',
                        'group flex gap-x-3 rounded-xl p-2.5 text-sm font-medium transition-all duration-300 ease-in-out',
                        isHovered && !isActive ? 'bg-secondary-700 scale-[1.02]' : ''
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-white' : 'text-secondary-300 group-hover:text-white',
                          'h-6 w-6 shrink-0 transition-transform duration-300',
                          isHovered ? 'scale-110' : ''
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                      
                      {isActive && (
                        <span className="absolute inset-y-0 right-0 w-1 bg-primary-300 rounded-l-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto px-3 py-3 text-xs text-secondary-400 bg-secondary-800/50 rounded-lg">
            <div className="flex flex-col space-y-1">
              <span>© {new Date().getFullYear()} Asistente Legal</span>
              <span>Versión 1.2.0</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 