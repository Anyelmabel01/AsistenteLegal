'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import Loading from '../../components/Loading';

// Define the AuthContext
const AuthContext = createContext(undefined);

// The AuthProvider component that wraps your app and provides the context value
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        if (!supabase) {
          console.error('Supabase client is not initialized');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.getSession();
        
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

    if (!supabase) {
      console.error('Supabase client is not initialized, auth state changes not being monitored');
      return () => {};
    }

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // Clean up subscription
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { error: new Error('Authentication service unavailable') };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
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
  const signUp = async ({ email, password }) => {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { error: new Error('Authentication service unavailable') };
      }
      
      const { data, error } = await supabase.auth.signUp({ 
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
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Context value with auth state and functions
  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  // Provide the context value to children
  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <Loading />}
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