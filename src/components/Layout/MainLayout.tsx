"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '../../../context/AuthContext'; // Import useAuth for user info

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth(); // Get user and signOut from context
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isChangingPage, setIsChangingPage] = useState(false);
    const pathname = usePathname();

    // Handle page transitions
    useEffect(() => {
        const handleRouteChangeStart = () => {
            setIsChangingPage(true);
        };

        const handleRouteChangeComplete = () => {
            setIsChangingPage(false);
        };

        // Adding a simulated effect for better UX
        return () => {
            setIsChangingPage(true);
            setTimeout(() => setIsChangingPage(false), 200);
        };
    }, [pathname]);

    // Track scroll position for header effects
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 min-h-screen">
            {/* Mobile sidebar backdrop */}
            {showMobileSidebar && (
                <div 
                    className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div 
                className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col animate-fade-in">
                <Sidebar />
            </div>

            {/* Main content area */} 
            <div className="lg:pl-72 transition-all duration-300">
                {/* Top bar with dynamic shadow based on scroll */}
                <div 
                    className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-primary-100 bg-white/80 backdrop-blur-md px-4 transition-all duration-300 sm:gap-x-6 sm:px-6 lg:px-8 ${
                        scrolled ? 'shadow-md' : ''
                    }`}
                >
                    {/* Mobile sidebar toggle */}
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
                        onClick={() => setShowMobileSidebar(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    
                    {/* Page title */}
                    <div className="flex-1 flex items-center justify-center lg:justify-start">
                        <span className="text-primary-700 font-medium">
                            {pathname === '/' ? 'Chat Asistente' : 
                             pathname === '/documentos' ? 'Documentos Legales' :
                             pathname === '/guia' ? 'Guía Legal' :
                             pathname === '/actualizaciones' ? 'Actualizaciones' : ''}
                        </span>
                    </div>
                    
                    {/* Right side profile and actions */}
                    <div className="flex gap-x-4 self-stretch lg:gap-x-6 justify-end">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* User info and sign out */}
                            <div className="relative flex items-center gap-x-3">
                                <div className="relative inline-block h-9 w-9 overflow-hidden rounded-full bg-primary-100">
                                    <span className="flex h-full w-full items-center justify-center text-sm font-medium text-primary-600">
                                        {user?.email?.substring(0, 1).toUpperCase() || 'U'}
                                    </span>
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                                </div>
                                
                                <span className="hidden md:block text-sm font-medium leading-6 text-secondary-800">
                                    {user?.email}
                                </span>
                                
                                <button
                                    onClick={signOut}
                                    className="rounded-full bg-white hover:bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-600/20 hover:ring-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    <span className="hidden sm:inline">Cerrar sesión</span>
                                    <span className="sm:hidden">Salir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <main className={`py-6 ${isChangingPage ? 'opacity-50 transition-opacity duration-150' : 'animate-fade-in'}`}>
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