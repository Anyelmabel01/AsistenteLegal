import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string; // Optional: Where to redirect if access denied
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = '/upload' }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    // Show a loading indicator while auth/profile is loading
    // You might want a more sophisticated loading screen
    return <div className="flex items-center justify-center pt-20">Verificando permisos...</div>;
  }

  // Check if user is logged in and profile is loaded
  if (!profile) {
    // User not logged in or profile not loaded yet, redirect to login (or a generic redirect path)
    // App.tsx already handles redirecting unauthenticated users, but this is a fallback.
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is included in the allowed roles
  if (allowedRoles.includes(profile.role)) {
    return <Outlet />; // Render the nested route (e.g., <CaseList />)
  } else {
    // User does not have the required role, redirect
    console.warn(`Access denied: User role "${profile.role}" not in allowed roles [${allowedRoles.join(', ')}]`);
    // Optional: Show an "Access Denied" page instead of redirecting
    // return <AccessDeniedPage />;
    return <Navigate to={redirectPath} replace />;
  }
};

export default ProtectedRoute; 