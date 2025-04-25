'use client'; // Add use client directive

import React from 'react';
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

  return (
    // Charcoal background (bg-gray-800), full height
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 pb-4 h-full">
      <div className="flex h-16 shrink-0 items-center gap-x-3">
        <ScaleIcon className="h-8 w-auto text-blue-500" />
        <span className="text-white font-semibold text-lg">Asistente Legal</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href; // Determine if the link is active
                return (
                  <li key={item.name}>
                    {/* Replace NavLink with Link */}
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-gray-900 text-white' // Active style
                          : 'text-gray-400 hover:text-white hover:bg-gray-700', // Inactive style
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold' // Base style
                      )}
                      aria-current={isActive ? 'page' : undefined} // Add aria-current for accessibility
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          {/* Optional: Add other sections like user profile, settings at the bottom */}
          {/* <li className="mt-auto">
            <a
              href="#"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
              Settings
            </a>
          </li> */}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 