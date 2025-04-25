'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginHelp({ onClose }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clearLocalTokens = () => {
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
      
      alert('Tokens cleared successfully. Please try logging in again.');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error clearing tokens:', error);
      alert('Error clearing tokens. Please try the advanced option or clear your browser cache manually.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4">Login Help</h2>
      
      <div className="mb-4">
        <p className="mb-2">If you're experiencing problems with login, such as:</p>
        <ul className="list-disc pl-5 mb-3">
          <li>Invalid Refresh Token errors</li>
          <li>Being logged out unexpectedly</li>
          <li>Unable to log in even with correct credentials</li>
        </ul>
        <p>Try these solutions:</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={clearLocalTokens}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Clear Login Tokens
        </button>
        
        <Link href="/clear-tokens" className="block text-center py-2 px-4 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition">
          Advanced Token Reset Page
        </Link>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
        
        {showAdvanced && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-2">Manual Reset Steps:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Clear your browser cookies and cache</li>
              <li>Close all browser windows and restart your browser</li>
              <li>Try logging in again</li>
              <li>If issues persist, contact support</li>
            </ol>
          </div>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
        >
          Close
        </button>
      )}
    </div>
  );
} 