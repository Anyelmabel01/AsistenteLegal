'use client';
import Link from 'next/link';
import React from 'react';
import { useAuth } from '../src/contexts/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Asistente Legal
        </Link>
        <div className="space-x-4">
          {user && (
            <>
              <Link href="/dashboard" className="hover:text-gray-300">
                Panel de Control
              </Link>
              <Link href="/documentos" className="hover:text-gray-300">
                Documentos Legales
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 