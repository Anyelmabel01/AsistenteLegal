'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Fixed import path
import LoginHelp from './LoginHelp';

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Call signIn with email and password directly (not as an object)
      const { error } = await signIn(email, password);
      if (error) {
        console.error("Login error:", error.message);
        setError(error.message || 'Error logging in. Please try again.');
        
        // If error is related to refresh token, suggest using the login help
        if (error.message && error.message.includes('Refresh Token')) {
          setError(error.message + '. Try using the "Login Help" option below to clear tokens.');
        }
        return;
      }
      // Login successful, AuthContext will handle redirect/UI update
      console.log('Login successful');
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.message || 'Error logging in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showHelp ? (
        <LoginHelp onClose={() => setShowHelp(false)} />
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Login</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="text-center mt-2">
            <button 
              type="button" 
              onClick={() => setShowHelp(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Having trouble logging in?
            </button>
          </div>
          <div className="text-center text-sm">
            <p>Don't have an account? <button 
              type="button"
              onClick={onSwitch}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Register
            </button></p>
          </div>
        </form>
      )}
    </div>
  );
} 