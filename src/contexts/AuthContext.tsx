import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Define Profile type with role
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Error getting session:', sessionError);
            throw sessionError;
        }
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single<Profile>();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile (other than not found):', profileError);
                throw profileError;
            }
            setProfile(userProfile);
            if (userProfile) {
                console.log('User profile loaded:', userProfile);
            } else {
                console.warn('User profile not found for id:', currentUser.id);
            }
           } catch (profileCatchError) {
             console.error('Caught error during profile fetch block:', profileCatchError);
             setProfile(null);
           }
        } else {
           setProfile(null);
        }
      } catch (error) {
        console.error('Error in outer fetchSessionAndProfile catch:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        console.log('[Initial Load] Entering finally block. Current loading state:', loading);
        setLoading(false);
        console.log('[Initial Load] Exiting finally block. Loading set to false.');
      }
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
       console.log('Auth state changed:', _event, newSession);
       setSession(newSession);
       const newUser = newSession?.user ?? null;
       setUser(newUser);
       console.log('[Auth Change] New user:', newUser);

       if (newUser) {
          console.log('[Auth Change] User found, setting loading true and fetching profile...');
          setLoading(true);
          try {
             const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newUser.id)
                .single<Profile>();

             if (profileError && profileError.code !== 'PGRST116') {
                 console.error('Error fetching profile on auth change (other than not found):', profileError);
                 setProfile(null);
             } else {
                 setProfile(userProfile);
                 if (userProfile) {
                    console.log('User profile updated on auth change:', userProfile);
                 } else {
                    console.warn('User profile not found on auth change for id:', newUser.id);
                 }
             }
          } catch (error) {
             console.error('Error fetching profile on auth change catch:', error);
             setProfile(null);
          } finally {
            console.log('[Auth Change] Entering finally block. Current loading state:', loading);
            setLoading(false);
            console.log('[Auth Change] Exiting finally block. Loading set to false.');
          }
       } else {
          console.log('[Auth Change] No user found, setting loading false.');
          setProfile(null);
          setLoading(false);
       }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="flex items-center justify-center min-h-screen bg-gray-100">Cargando...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 