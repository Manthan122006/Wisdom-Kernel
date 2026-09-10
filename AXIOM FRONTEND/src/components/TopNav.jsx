/**
 * TopNav.jsx
 * ----------
 * Primary top navigation for WisdomKernel.
 *
 * Section 5 & 6 Branding Requirements:
 * - Logo Visual Height: 48–60px (Rendered at 56px container / 50px mark)
 * - Wordmark: 24–30px (Rendered at 28px / text-[1.75rem]), Weight: 800 (extrabold)
 * - Wordmark Color: Strong Dark Navy (#102A56) for contrast against blue logo
 * - Relationship: [ LARGE BLUE LOGO ] WISDOMKERNEL
 *
 * Section 7 Navigation Requirements:
 * - Mostly white / off-white background
 * - Dark navy / ink navigation text
 * - Blue active indicator (blue text + crisp bottom underline indicator)
 * - Blue hover states without bulky pills everywhere
 */

import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Building2,
  Gauge,
  Home,
  Lightbulb,
  Mic,
  Search,
  ShieldAlert,
  Waypoints,
  BookOpen,
  Menu,
  X,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import logo from "../assets/wisdomkernel-logo.png";
import { useAuth } from "../context/AuthContext";

export const PRIMARY_NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/experiences", label: "Experiences", icon: BookOpen },
  { to: "/record", label: "Record Experience", icon: Mic },
  { to: "/search", label: "Ask Experience", icon: Search },
  { to: "/mistakes", label: "Mistakes", icon: ShieldAlert },
  { to: "/simulator", label: "Simulator", icon: Waypoints },
  { to: "/score", label: "Transfer Score", icon: Gauge },
  { to: "/advice", label: "What I Wish I Knew", icon: Lightbulb },
  { to: "/organization", label: "Organization", icon: Building2 },
];

export function BackendStatusBadge({ status }) {
  const map = {
    checking: { dot: "bg-ink-3 animate-pulse", text: "Checking API", border: "border-rule text-ink-3 bg-white" },
    online: { dot: "bg-correct shadow-[0_0_6px_rgba(5,150,105,0.4)]", text: "System Online", border: "border-correct/30 bg-correct-tint/70 text-correct" },
    offline: { dot: "bg-wrong", text: "System Offline", border: "border-wrong/30 bg-wrong-tint/70 text-wrong" },
  };
  const state = map[status] || map.checking;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${state.border}`}
      title={status === "online" ? "WisdomKernel backend is healthy" : "Backend unreachable at configured URL"}
      aria-live="polite"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${state.dot}`} aria-hidden="true" />
      <span className="hidden sm:inline font-mono text-[0.6875rem] uppercase tracking-wider">{state.text}</span>
    </div>
  );
}

export default function TopNav({ status }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, role, organization, logout, activeMode, setActiveMode } = useAuth();

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => e.key === "Escape" && setMobileMenuOpen(false);
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Dynamically filter primary nav links based on active mode
  const filteredNav = PRIMARY_NAV.filter((item) => {
    if (activeMode === "STUDENT") {
      // Students should NOT see Record Experience or Organization in top nav
      return item.to !== "/record" && item.to !== "/organization";
    }
    if (activeMode === "SENIOR") {
      // Senior mode gets Record Experience, but not Organization link unless in Org mode
      return item.to !== "/organization";
    }
    return true; // ORGANIZATION mode gets full nav
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rule bg-white shadow-subtle">
      {/* 1. TOP BRAND BAR */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between gap-6">
          {/* Brand Identity: Prominent Logo + Wordmark */}
          <Link to="/" className="group flex items-center gap-4 focus-visible:outline-none">
            <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md border-2 border-blue-200/90 transition-all duration-200 group-hover:scale-105 group-hover:border-blue-500/80 group-hover:shadow-lg">
              <img
                src={logo}
                alt="WisdomKernel Logo"
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="font-sans text-[1.875rem] sm:text-[2.125rem] font-extrabold tracking-tight text-navy uppercase leading-none transition-colors group-hover:text-blue-600">
                  WISDOMKERNEL
                </span>
                <span className="hidden md:inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[0.6875rem] font-bold tracking-wider text-blue-600 uppercase">
                  Human Knowledge
                </span>
              </div>
              <span className="text-xs sm:text-[0.8125rem] font-medium text-ink-3 mt-1.5">
                Experience should never retire.
              </span>
            </div>
          </Link>

          {/* Right Utility Bar & Persona Switcher */}
          <div className="flex items-center gap-3">
            <BackendStatusBadge status={status} />

            {/* PERSONA / MODE SWITCHER PILL (Student vs Senior Engineer) */}
            <div className="hidden md:flex items-center rounded-2xl border border-rule bg-paper p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode("STUDENT")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                  activeMode === "STUDENT"
                    ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                    : "text-ink-2 hover:text-navy"
                }`}
                title="Student Mode: Learning, Ask Experience, Simulator, Mistakes"
              >
                <span>🎓 Student</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("SENIOR")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                  activeMode === "SENIOR"
                    ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                    : "text-ink-2 hover:text-navy"
                }`}
                title="Senior Engineer Mode: Record Experience, Mentorship, Advice"
              >
                <span>🧑‍💼 Senior</span>
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={
                    role === "HEAD_ADMIN"
                      ? "/organization/head"
                      : role === "SENIOR_ENGINEER"
                      ? "/organization/senior"
                      : "/organization/junior"
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition-all hover:bg-blue-600 hover:text-white shadow-xs"
                >
                  <Building2 size={15} />
                  <span>
                    {user?.name ? user.name.split(" ")[0] : "Org"}{" "}
                    <span className="opacity-75 font-mono text-[0.6875rem]">({role?.replace("_ADMIN", "").replace("_ENGINEER", "").replace("_EMPLOYEE", "")})</span>
                  </span>
                </Link>
                <Link
                  to="/organization"
                  title="Switch Role Workspace"
                  className="hidden sm:inline-flex items-center text-[0.6875rem] font-bold text-blue-600 hover:underline px-2 py-1"
                >
                  Switch Role
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out of organization"
                  className="rounded-xl p-2 text-ink-3 hover:bg-paper hover:text-wrong transition-colors border border-rule"
                >
                  <LogOut size={16} />
                  <span className="sr-only">Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/organization"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
              >
                <Building2 size={15} />
                <span>Organization Portal</span>
              </Link>
            )}

            {/* Mobile menu hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex lg:hidden rounded-xl border border-rule p-2 text-ink-2 hover:bg-paper hover:text-ink focus-visible:outline-none"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECOND NAVIGATION ROW: Hidden on Organization Portal Pages */}
      {!location.pathname.startsWith("/organization") && (
        <div className="border-t border-rule bg-paper/60">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Primary Navigation"
              className="no-scrollbar flex items-center gap-1 overflow-x-auto text-sm"
            >
              {filteredNav.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      "group relative flex shrink-0 items-center gap-2 px-4 py-3 text-[0.875rem] font-medium transition-all duration-150 border-b-2",
                      isActive
                        ? "border-blue-600 text-blue-600 font-bold bg-white shadow-xs"
                        : "border-transparent text-ink-2 hover:text-blue-600 hover:border-blue-300 hover:bg-white/60",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={15}
                        aria-hidden="true"
                        className={`transition-colors ${isActive ? "text-blue-600" : "text-ink-3 group-hover:text-blue-600"}`}
                      />
                      <span className="whitespace-nowrap">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-[144px] z-40 bg-ink/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            aria-label="Mobile Navigation"
            className="fixed inset-x-0 top-[144px] z-50 max-h-[calc(100vh-144px)] overflow-y-auto border-b border-rule bg-white px-5 py-6 shadow-elevated animate-fade-in"
          >
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-rule">
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Navigation Directory
              </span>
              <BackendStatusBadge status={status} />
            </div>

            <ul className="space-y-1">
              {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-[0.9375rem] font-medium transition-all",
                        isActive
                          ? "bg-blue-50 text-blue-600 font-bold border border-blue-200"
                          : "text-ink-2 hover:bg-paper hover:text-ink",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={isActive ? "text-blue-600" : "text-ink-3"}
                          aria-hidden="true"
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-rule pt-4">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy">
                    Organization: {organization?.name}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 text-sm text-wrong hover:underline font-medium"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/organization"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Building2 size={16} />
                  Organization Portal Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
