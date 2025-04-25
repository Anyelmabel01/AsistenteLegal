import { createClient } from '@supabase/supabase-js';

// Read Supabase URL and Anon Key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Function to create supabase client to avoid initialization issues
const createSupabaseClient = () => {
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
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

// Create and export the Supabase client instance
export const supabase = createSupabaseClient(); 