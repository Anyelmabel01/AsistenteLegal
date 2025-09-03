'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// Import supabase function since we're in a client component
import { getSupabaseClient } from './supabaseClient';

// Define proper types for the context value
type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

// Create a default value for the context
const defaultAuthContext: AuthContextType = {
  session: null,
  user: null,
  signIn: async () => ({ 
    error: { message: 'Auth not initialized', name: 'AuthError' } 
  }),
  signUp: async () => ({ 
    error: { message: 'Auth not initialized', name: 'AuthError' } 
  }),
  signOut: async () => { 
    console.warn('Auth not initialized - signOut called'); 
  },
  loading: true
};

// Define the AuthContext
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// The AuthProvider component that wraps your app and provides the context value
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null);
        
        // Get supabase client
        const supabaseClient = getSupabaseClient();
        
        // Check if supabaseClient is available
        if (!supabaseClient) {
          console.error('Supabase client is not available - check environment variables');
          setError('Supabase client not available');
          setLoading(false);
          return;
        }

    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Redirect to chat after successful sign in
        if (event === 'SIGNED_IN' && newSession?.user && typeof window !== 'undefined') {
          window.location.href = '/chat';
        }
      }
    );

        // Clean up subscription
        return () => {
          if (authListener?.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Error initializing authentication');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.error('Supabase client is not initialized');
        return { error: new Error('Authentication service unavailable') };
      }
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        return { error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error };
    }
  };

  // Sign up function
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.error('Supabase client is not initialized');
        return { error: new Error('Authentication service unavailable') };
      }
      
      const { data, error } = await supabaseClient.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        return { error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.error('Supabase client is not initialized');
        return;
      }
      
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Context value with auth state and functions
  const value: AuthContextType = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  // If Supabase client is not available, show error message
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient && !loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex justify-center items-center min-h-screen bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Error de Configuración</h2>
            <p className="text-red-600 mb-4">
              Las variables de entorno de Supabase no están configuradas correctamente.
            </p>
            <div className="text-left text-sm text-gray-600 bg-gray-100 p-4 rounded">
              <p className="font-semibold mb-2">Verifica en .env.local:</p>
              <ul className="space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  try {
    const context = useContext(AuthContext);
    
    if (context === undefined || context === null) {
      console.warn('useAuth: Context not available, returning defaults');
      return {
        ...defaultAuthContext,
        loading: true // Indicate we're still loading
      };
    }
    
    return context;
  } catch (error) {
    console.error('useAuth: Error accessing context:', error);
    return {
      ...defaultAuthContext,
      loading: true
    };
  }
}