import React from 'react';
import { NavLink } from 'react-router-dom'; // Assuming we'll use react-router later
import { ArrowUpTrayIcon, FolderIcon, MagnifyingGlassIcon, ScaleIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Subir Documento', href: '/upload', icon: ArrowUpTrayIcon, current: true }, // Example: Make Upload current initially
  { name: 'Gestionar Casos', href: '/cases', icon: FolderIcon, current: false },
  { name: 'Búsqueda Semántica', href: '/search', icon: MagnifyingGlassIcon, current: false },
  // Add more navigation items here
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar: React.FC = () => {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-x-3">
        <ScaleIcon className="h-8 w-auto text-blue-500" />
        <span className="text-white font-semibold text-lg">Asistente Legal</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {/* Replace 'a' with NavLink when react-router is installed */}
                  <a
                    href={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </a>
                </li>
              ))}
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