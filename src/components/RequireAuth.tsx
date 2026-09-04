import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/lib/session";

export function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
