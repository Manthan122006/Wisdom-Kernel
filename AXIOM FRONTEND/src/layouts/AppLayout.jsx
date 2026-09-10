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
import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav";
import { api } from "../api/api";

export default function AppLayout() {
  const [status, setStatus] = useState("checking");

  // Health check on mount
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

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink selection:bg-blue-100 selection:text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Header & Secondary Horizontal Navigation Strip */}
      <TopNav status={status} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Product Footer */}
      <footer className="border-t border-rule bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-3">
            <div>
              <p className="font-semibold text-ink-2">
                WisdomKernel — Human Experience Knowledge Platform
              </p>
              <p className="mt-1">
                Team AXIOM · Smart India Hackathon 2026 · Experience should never retire
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span>All bundled records are fictional demo data</span>
              <span className="h-3 w-px bg-rule" aria-hidden="true" />
              <span>FastAPI + React</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
