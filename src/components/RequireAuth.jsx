import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container py-5">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
