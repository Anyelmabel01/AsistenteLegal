import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowUpTrayIcon, FolderIcon, MagnifyingGlassIcon, ScaleIcon } from '@heroicons/react/24/outline';

const navigationItems = [
  // Setting current manually for now
  { name: 'Subir Documento', href: '/upload', icon: ArrowUpTrayIcon, current: true }, 
  { name: 'Gestionar Casos', href: '/cases', icon: FolderIcon, current: false },
  { name: 'Búsqueda Semántica', href: '/search', icon: MagnifyingGlassIcon, current: false },
  // Add more navigation items here
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar: React.FC = () => {
  const location = useLocation(); // Get current location

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
                // Use NavLink's default active state determination
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => // Use NavLink's isActive prop
                        classNames(
                          isActive
                            ? 'bg-gray-900 text-white' // Active style
                            : 'text-gray-400 hover:text-white hover:bg-gray-700', // Inactive style
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold' // Base style
                      )}
                    >
                      {({ isActive }) => ( // Render prop for icon styling based on active state
                        <>
                          <item.icon
                            className={classNames(
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </>
                      )}
                    </NavLink>
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