import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { can } from "../access";
import { ReactNode } from "react";

export const Protected = ({ children, page }: { children: ReactNode; page?: string }) => {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/admin/login" state={{ from: loc }} replace />;
  if (page && !can(user.role, page)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};