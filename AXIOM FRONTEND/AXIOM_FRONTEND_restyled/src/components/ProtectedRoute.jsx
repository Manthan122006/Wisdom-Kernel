/**
 * ProtectedRoute.jsx
 * ------------------
 * Guards the organization vault.
 *
 * No token -> redirect to /organization, remembering where the user was
 * heading so login can return them there. The redirect uses `replace` so
 * the back button does not bounce between login and vault.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/organization" state={{ from: location.pathname }} replace />;
  }

  return children;
}
