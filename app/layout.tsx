import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css'; // Assuming globals.css is in a styles directory
import React from 'react'; // Añadir import de React para tipado de children
// import Navbar from '../components/Navbar'; // Remove the import

export const metadata = {
  title: 'Asistente Legal',
  description: 'Tu asistente legal personal',
};

// Añadir tipo para children
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* <Navbar /> Remove the Navbar component */}
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 