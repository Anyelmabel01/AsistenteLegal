"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import { Session, User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase types

// Use SupabaseUser or define a simpler User interface if needed
interface User extends SupabaseUser {} // Example: Using SupabaseUser directly

// Define the structure of the authentication context
interface AuthContextType {
  user: User | null;
  session: Session | null; // Add session state
  loading: boolean; // Indicates if the initial auth state check is complete
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; // Make signOut async
  signUp: (email: string, password: string) => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined); // Initialize as undefined

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start loading as true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not available in AuthProvider.");
      setLoading(false);
      setError("Supabase client not initialized.");
      return;
    }

    // Set initial loading state
    setLoading(true);
    setError(null);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
    }).catch((err) => {
      console.error("Error getting initial session:", err);
      setError("Failed to retrieve initial session.");
    }).finally(() => {
       // Always set loading to false after initial check attempt
       // This ensures the client and server match initial render (loading state)
       setLoading(false);
    });

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Supabase auth event: ${event}`, session);
        setSession(session);
        setUser(session?.user ?? null);
        setError(null); // Clear errors on successful auth change
        setLoading(false); // Ensure loading is false after state change
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Function to sign in
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      setError("Supabase client not available.");
      return;
    }
    try {
      setLoading(true); // Set loading during async operation
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      console.error("Error signing in:", err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Function to sign out
  const signOut = async () => {
    if (!supabase) {
      setError("Supabase client not available.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err: any) {
      console.error("Error signing out:", err);
      setError(err.message || 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Function to sign up
  const signUp = async (email: string, password: string) => {
     if (!supabase) {
       setError("Supabase client not available.");
       return;
     }
    try {
      setLoading(true);
      setError(null);
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      // Optional: Maybe sign in the user automatically after signup or show a confirmation message
    } catch (err: any) {
      console.error("Error signing up:", err);
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    signUp
  };

  // Render loading indicator when authentication state is being determined
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          Cargando...
        </div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Note: Default export is not needed if you primarily use useAuth and AuthProvider
// export default AuthContext; // Remove or keep based on usage patterns

export default AuthContext; 