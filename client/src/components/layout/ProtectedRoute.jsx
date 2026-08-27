import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center space-x-3">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading WorkRadar session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect employee to employee dashboard if trying to access manager pages
    return user.role === 'MANAGER' ? (
      <Navigate to="/manager/dashboard" replace />
    ) : (
      <Navigate to="/employee/dashboard" replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
