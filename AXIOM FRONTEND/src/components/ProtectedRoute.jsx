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

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/organization" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = role || "HEAD_ADMIN";
    const isAllowed = allowedRoles.includes(userRole) || userRole === "HEAD_ADMIN";
    if (!isAllowed) {
      return (
        <div className="mx-auto max-w-xl py-16 text-center space-y-4 animate-fade-in">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 font-bold text-xl">
            403
          </div>
          <h2 className="font-sans text-2xl font-extrabold text-navy">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
            Your current account role (<strong>{userRole}</strong>) is not authorized to access this workspace section. Required role: {allowedRoles.join(" or ")}.
          </p>
          <div className="pt-2">
            <Navigate to="/organization" replace />
          </div>
        </div>
      );
    }
  }

  return children;
}

