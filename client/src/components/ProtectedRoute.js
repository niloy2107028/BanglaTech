import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading ...</p>;

  if (!user) return <Navigate to="/login" replace />;
  // Not logged in → redirect to login page

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
    // Logged in but wrong role → redirect home
  }

  return children;
  // All checks passed → show the page
};

export default ProtectedRoute;
