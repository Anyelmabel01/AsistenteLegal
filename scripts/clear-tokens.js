/**
 * This script clears all stored Supabase tokens from local storage
 * Use this if you encounter "Invalid Refresh Token" errors
 */

// Check if window is defined (browser environment)
if (typeof window !== 'undefined') {
  // Clear Supabase tokens from local storage
  const clearTokens = () => {
    console.log('Clearing Supabase auth tokens from local storage...');
    
    // Clear specific Supabase tokens
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-access-token');
    
    // Also clear any legacy token formats
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        console.log(`Removing token: ${key}`);
        localStorage.removeItem(key);
      }
    }
    
    console.log('All Supabase tokens cleared. Please try logging in again.');
  };
  
  // Execute the function
  clearTokens();
} else {
  console.error('This script must be run in a browser environment.');
} 