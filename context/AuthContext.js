'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient'; // Assuming supabaseClient is in the root
import Loading from '../components/Loading'; // Assuming Loading component exists

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error("Supabase client is not initialized");
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error.message);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error("Error checking user:", e.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Only set up listener if supabase client exists
    let authListener = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
      
      authListener = data;
    } catch (e) {
      console.error("Error setting up auth listener:", e.message);
    }

    // Cleanup function
    return () => {
      if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    signUp: (data) => supabase ? supabase.auth.signUp(data) : Promise.reject('Supabase client not initialized'),
    signIn: (data) => supabase ? supabase.auth.signInWithPassword(data) : Promise.reject('Supabase client not initialized'),
    signOut: () => supabase ? supabase.auth.signOut() : Promise.reject('Supabase client not initialized'),
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context itself if needed directly (e.g., in class components or specific scenarios)
export { AuthContext }; 