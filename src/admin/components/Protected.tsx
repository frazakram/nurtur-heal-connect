import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { can } from "../access";
import { ReactNode } from "react";

export const Protected = ({ children, page }: { children: ReactNode; page?: string }) => {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex h-screen w-full items-center justify-center text-primary-deep font-semibold">Loading Auth...</div>;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc }} replace />;
  if (page && !can(user.role, page)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};