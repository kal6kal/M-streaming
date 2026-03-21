// src/components/PrivateRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
}

export default function PrivateRoute({ children }: Props) {
  const { hasAccess } = useAuth();
  if (!hasAccess) return <Navigate to="/login" replace />;
  return <>{children}</>;
}