'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearTokens() {
  const router = useRouter();
  const [message, setMessage] = useState('Clearing authentication tokens...');

  useEffect(() => {
    // Clear Supabase tokens
    const clearTokens = () => {
      try {
        // Clear specific Supabase tokens
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        
        // Also clear any other Supabase tokens
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        
        // Remove keys in a separate loop to avoid issues with changing array length
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        setMessage('Authentication tokens have been cleared. You can now log in again.');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (error) {
        console.error('Error clearing tokens:', error);
        setMessage('Error clearing tokens. Please try again or clear your browser cache manually.');
      }
    };
    
    clearTokens();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Clear Authentication</h1>
        <p className="mb-4">{message}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Login
        </button>
      </main>
    </div>
  );
} 