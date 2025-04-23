import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth for user info

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth(); // Get user and signOut from context

  return (
    <div className="bg-gray-100">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content area */} 
      <div className="lg:pl-72">
        {/* Top bar (optional, can replace basic nav in App.tsx or integrate user info here) */}
         <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            {/* Placeholder for mobile sidebar toggle, search bar, etc. */}
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
                 <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" aria-hidden="true" />

                    {/* Profile dropdown/info */}
                    <div className="relative">
                         <span className="text-sm font-semibold leading-6 text-gray-900 mr-2">
                            {user?.email}
                         </span>
                         <button
                            onClick={signOut}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            Sign out
                        </button>
                     {/* Implement dropdown later if needed */}
                     </div>
                </div>
             </div>
         </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Content goes here */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 