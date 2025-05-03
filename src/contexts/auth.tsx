'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// Import supabase directly since we're in a client component
import { supabase as supabaseClient } from '../lib/supabaseClient';

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
  signIn: async () => ({ error: new Error('Auth not initialized') }),
  signUp: async () => ({ error: new Error('Auth not initialized') }),
  signOut: async () => { console.error('Auth not initialized') },
  loading: false
};

// Define the AuthContext
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// The AuthProvider component that wraps your app and provides the context value
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    if (!supabaseClient) {
      console.error('Supabase client is not available');
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
      }
    );

    // Clean up subscription
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
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
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 