/**
 * AppLayout.jsx
 * -------------
 * The application shell: fixed sidebar on desktop, a top bar with a
 * drawer on smaller screens, and one consistent content container.
 *
 * The drawer closes on route change and on Escape, and the page content
 * is a real <main> element targeted by the skip link.
 */

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Sidebar, { BackendStatus, NavList, Wordmark } from "../components/Sidebar";
import { api } from "../api/api";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState("checking");
  const location = useLocation();

  // One health check on mount tells the user whether the backend is up
  // before they hit a page that needs it.
  useEffect(() => {
    let active = true;
    api
      .health()
      .then(() => active && setStatus("online"))
      .catch(() => active && setStatus("offline"));
    return () => {
      active = false;
    };
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-paper">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Sidebar status={status} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <Wordmark compact />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            aria-label="Open menu"
            className="rounded-md p-2 text-ink-2 transition-colors hover:bg-paper hover:text-ink"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </header>

        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-ink/25 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div
              id="mobile-nav"
              className="fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85vw] animate-fade-in flex-col border-l border-rule bg-surface lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                <Wordmark compact />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 text-ink-2 transition-colors hover:bg-paper hover:text-ink"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
                <NavList onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <div className="border-t border-rule px-5 py-4">
                <BackendStatus status={status} />
              </div>
            </div>
          </>
        )}

        <main id="main-content" className="flex-1">
          <div className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-rule px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-1 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
            <p>WisdomKernel — Team AXIOM, Smart India Hackathon 2026</p>
            <p>All bundled records are fictional demo data.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
