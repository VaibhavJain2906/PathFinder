import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their respective dashboard if they try to access something unauthorized
      if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
      if (user.role === 'ORGANIZATION') return <Navigate to="/org/dashboard" replace />;
      if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (e) {
    // If JSON parsing fails or user object is corrupt
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;
