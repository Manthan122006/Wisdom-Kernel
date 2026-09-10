/**
 * OrganizationLogin.jsx
 * ---------------------
 * Organization sign-in.
 *
 * States: idle, submitting, invalid credentials, server unreachable,
 * and success (redirect). The password field is type="password" and is
 * never logged, stored or echoed anywhere.
 *
 * If ProtectedRoute sent the user here, they return to where they were
 * heading after a successful sign-in.
 */

import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, LogIn } from "lucide-react";

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
              message: "That organization name and password do not match. Check both and try again.",
            }
          : described
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-md py-6 sm:py-12">
      <div className="mb-8">
        <span
          aria-hidden="true"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rule bg-white"
        >
          <Lock size={18} className="text-royal" />
        </span>
        <h1 className="text-title text-ink">Organization sign-in</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
          The private vault holds knowledge that belongs to one organization: onboarding paths,
          troubleshooting guides, post-mortems and retirement risk.
        </p>
      </div>

      {sessionExpired && (
        <div
          role="status"
          className="mb-5 flex gap-3 rounded-lg border border-caution/25 bg-caution-tint p-4"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-caution" aria-hidden="true" />
          <p className="text-[0.9375rem] leading-relaxed text-ink">
            Your session has expired. Sign in again to continue.
          </p>
        </div>
      )}

      <Card className="p-6 sm:p-7">
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div>
              <label htmlFor="organization-name" className="mb-1.5 block text-sm text-ink-2">
                Organization name
              </label>
              <input
                id="organization-name"
                name="organization"
                type="text"
                autoComplete="organization"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                aria-invalid={error?.code === "unauthorized" || undefined}
                className="w-full rounded-md border border-rule-strong bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                placeholder="Northwind Power Systems"
              />
            </div>

            <div>
              <label htmlFor="organization-password" className="mb-1.5 block text-sm text-ink-2">
                Password
              </label>
              <input
                id="organization-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error?.code === "unauthorized" || undefined}
                className="w-full rounded-md border border-rule-strong bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-md border border-wrong/25 bg-wrong-tint p-3.5"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-wrong" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-ink">{error.message}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            icon={LogIn}
            loading={submitting}
            className="mt-6 w-full"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>

      <div className="mt-6 rounded-lg border border-rule bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Demo organizations</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-2">Northwind Power Systems</dt>
            <dd className="font-mono text-xs text-ink-3">northwind@2026</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-2">Meridian Cloud Labs</dt>
            <dd className="font-mono text-xs text-ink-3">meridian@2026</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          Prototype authentication for the demo. Sign in as both to see that each organization only
          ever receives its own data.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-ink-3">
        <Link to="/" className="rounded transition-colors hover:text-royal">
          Back to WisdomKernel
        </Link>
      </p>
    </div>
  );
}
