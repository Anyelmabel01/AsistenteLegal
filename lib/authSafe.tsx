'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

// Define proper types for the context value
type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: ({ email, password }: { email: string; password: string }) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
} | null;

// Create context with null default
const AuthContext = createContext<AuthContextType>(null);

// The AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth with proper error boundaries
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Simulate Supabase initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Safe sign in function
  const signIn = async (email: string, password: string) => {
    try {
      // Mock successful sign in for now
      const mockUser = { id: '1', email, name: email.split('@')[0] } as User;
      setUser(mockUser);
      setSession({ user: mockUser } as Session);
      
      return { data: { user: mockUser }, error: null };
    } catch (error) {
      return { error: { message: 'Sign in failed' } };
    }
  };

  // Safe sign up function
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      // Mock sign up for now
      return { data: { user: null }, error: null };
    } catch (error) {
      return { error: { message: 'Sign up failed' } };
    }
  };

  // Safe sign out function
  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Safe hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Return safe defaults if context is not available
  if (!context) {
    return {
      session: null,
      user: null,
      signIn: async () => ({ error: { message: 'Auth not available' } }),
      signUp: async () => ({ error: { message: 'Auth not available' } }),
      signOut: async () => {},
      loading: true,
    };
  }
  
  return context;
}