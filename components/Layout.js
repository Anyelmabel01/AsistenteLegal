import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-2xl font-bold text-blue-600">Asistente Legal</h1>
        {/* Puedes añadir aquí navegación, botones de perfil, etc. */}
      </header>
      <main className="container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-200 text-center p-4 mt-8">
        © {new Date().getFullYear()} Asistente Legal
      </footer>
    </div>
  );
};

export default Layout; 