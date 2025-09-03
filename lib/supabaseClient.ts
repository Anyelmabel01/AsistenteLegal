import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Declare the supabase client variable
let supabase: SupabaseClient | null = null;

// Function to create supabase client to avoid initialization issues
const createSupabaseClient = () => {
  // Get environment variables at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Basic validation to ensure environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!supabaseUrl) {
      console.error('Error: Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!supabaseAnonKey) {
      console.error('Error: Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    // Return null if variables are missing
    if (typeof window !== 'undefined') {
      console.error('Supabase client could not be initialized due to missing environment variables.');
    }
    return null;
  }

  // Create the client if all variables are present
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Store session in local storage
        autoRefreshToken: true, // Automatically refresh token
        detectSessionInUrl: true, // Look for auth token in URL
        storageKey: 'supabase.auth.token', // Key to use in storage
      }
    });
    
    // Verify the client has been created properly
    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

// Initialize Supabase client only on the client side
if (typeof window !== 'undefined') {
  supabase = createSupabaseClient();
  
  // Handle edge case where supabase is null
  if (!supabase) {
    console.error('Supabase client is not initialized. Authentication will not work.');
  }
}

// Function to get supabase client with lazy initialization
export const getSupabaseClient = (): SupabaseClient | null => {
  // If running on server side, return null
  if (typeof window === 'undefined') {
    return null;
  }
  
  // If client hasn't been created yet, create it
  if (!supabase) {
    supabase = createSupabaseClient();
  }
  
  return supabase;
};

// Utility function to get public URL for stored files
export const getPublicUrl = (bucket: string, filePath: string): string => {
  if (!supabase) {
    console.error('Supabase client is not initialized. Cannot get public URL.');
    return '';
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

// Get info for the signed-in user
export const getCurrentUser = async () => {
  if (!supabase) {
    console.error('Supabase client is not initialized. Cannot get current user.');
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Exception when getting user:', error);
    return null;
  }
};

// Check if a session exists
export const checkSession = async () => {
  if (!supabase) {
    console.error('Supabase client is not initialized. Cannot check session.');
    return null;
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking session:', error.message);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Exception when checking session:', error);
    return null;
  }
};

export { supabase };
export default supabase;