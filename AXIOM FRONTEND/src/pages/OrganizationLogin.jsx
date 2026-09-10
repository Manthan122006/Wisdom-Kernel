/**
 * OrganizationLogin.jsx
 * ---------------------
 * Private Organization Knowledge Vault Gateway.
 *
 * Section 14 Requirements:
 * - White foundation
 * - Light blue sections
 * - Blue private/restricted indicators
 * - Dark navy important information
 */

import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, LogIn, ShieldCheck, Building2, KeyRound, ArrowRight } from "lucide-react";

import { describeError } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import { Card } from "../components/Card";

export default function OrganizationLogin() {
  const { isAuthenticated, login, sessionExpired, clearExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from || "/organization/vault";

  // Typing again dismisses the expired-session notice.
  useEffect(() => {
    if (sessionExpired && (organizationName || password)) clearExpiredNotice();
  }, [organizationName, password, sessionExpired, clearExpiredNotice]);

  if (isAuthenticated) {
    return <Navigate to="/organization/vault" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!organizationName.trim() || !password) {
      setError({ code: "bad_request", message: "Enter both an organization name and a password." });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(organizationName.trim(), password);
      setPassword("");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const described = describeError(err);
      setError(
        described.status === 401
          ? {
              code: "unauthorized",
              message: "That organization name and password do not match. Check credentials and try again.",
            }
          : described
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(org, pass) {
    setOrganizationName(org);
    setPassword(pass);
    setError(null);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-md py-6 sm:py-12 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-subtle mb-4">
          <ShieldCheck size={28} />
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
          Private Organization Vault
        </h1>
        <p className="mt-2 text-sm text-ink-2 leading-relaxed">
          Access confidential institutional knowledge, proprietary runbooks, internal incident postmortems, and retirement knowledge transfer progress.
        </p>
      </div>

      {sessionExpired && (
        <div
          role="status"
          className="flex gap-3 rounded-2xl border border-caution/25 bg-caution-tint p-4 text-sm text-ink"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-caution" aria-hidden="true" />
          <p>Your previous session has expired. Sign in again to access the vault.</p>
        </div>
      )}

      {/* Login Card: Crisp White Box */}
      <Card className="p-7 sm:p-8 border border-rule bg-white shadow-card">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="org-name"
              className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5"
            >
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              required
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Northstar Engineering"
              className="w-full rounded-xl border border-rule bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3/70 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="org-password"
              className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5"
            >
              Vault Password
            </label>
            <input
              id="org-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-rule bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3/70 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {error && (
            <div role="alert" className="flex gap-3 rounded-xl border border-wrong/25 bg-wrong-tint p-3.5 text-xs sm:text-sm text-ink">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-wrong" />
              <p>{error.message}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            icon={LogIn}
            loading={submitting}
            className="w-full mt-2 font-bold shadow-md shadow-blue-600/20"
          >
            {submitting ? "Verifying Vault Access…" : "Sign In to Organization Vault"}
          </Button>
        </form>
      </Card>

      {/* Demo Credentials Helper: Light Blue Box (#F0F6FF) */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-blue-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
            <KeyRound size={13} className="text-blue-600" />
            <span>Demo Test Credentials</span>
          </span>
          <span className="text-[0.6875rem] text-blue-700 font-bold">Click to autofill</span>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fillDemo("Northstar Engineering", "Northstar@2026")}
            className="w-full flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3 text-left text-xs hover:border-blue-600 hover:bg-blue-50 transition-all shadow-2xs"
          >
            <div>
              <p className="font-bold text-navy">Northstar Engineering</p>
              <p className="font-mono text-ink-3 text-[0.6875rem]">Northstar@2026</p>
            </div>
            <ArrowRight size={13} className="text-blue-600" />
          </button>

          <button
            type="button"
            onClick={() => fillDemo("Meridian Cloud Labs", "meridian@2026")}
            className="w-full flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3 text-left text-xs hover:border-blue-600 hover:bg-blue-50 transition-all shadow-2xs"
          >
            <div>
              <p className="font-bold text-navy">Meridian Cloud Labs</p>
              <p className="font-mono text-ink-3 text-[0.6875rem]">meridian@2026</p>
            </div>
            <ArrowRight size={13} className="text-blue-600" />
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-ink-3">
        <Link to="/" className="font-bold text-navy hover:text-blue-600 transition-colors">
          ← Return to WisdomKernel Public Platform
        </Link>
      </p>
    </div>
  );
}
