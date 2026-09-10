/**
 * Sidebar.jsx
 * -----------
 * Primary navigation. Eight destinations, no nesting, no overflow menus.
 * The active route is marked with a royal rule on the left edge plus a
 * tinted background, and carries aria-current for screen readers.
 *
 * The footer shows whether the backend is reachable. That status is read
 * from GET / — it is never assumed.
 */

import { NavLink } from "react-router-dom";
import {
  Building2,
  Gauge,
  Home,
  Lightbulb,
  Mic,
  Search,
  ShieldAlert,
  Waypoints,
} from "lucide-react";

import logo from "../assets/logo.png";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/record", label: "Record Experience", icon: Mic },
  { to: "/search", label: "Ask Experience", icon: Search },
  { to: "/mistakes", label: "Mistakes", icon: ShieldAlert },
  { to: "/simulator", label: "Simulator", icon: Waypoints },
  { to: "/score", label: "Transfer Score", icon: Gauge },
  { to: "/advice", label: "What I Wish I Knew", icon: Lightbulb },
  { to: "/organization", label: "Organization", icon: Building2 },
];

export function Wordmark({ compact = false }) {
  return (
    <div className="flex items-center gap-0">
      <img
        src={logo}
        alt="WisdomKernel"
        className="h-24 w-24 shrink-0 rounded-lg object-contain"
      />
      {!compact && (
        <span className="font-serif text-xl font-semibold leading-none tracking-tight text-ink">
          WisdomKernel
        </span>
      )}
      {!compact && <span className="sr-only">Experience should never retire</span>}
    </div>
  );
}

export function NavList({ onNavigate }) {
  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl border-l-2 py-2 pl-3 pr-3 text-[0.9375rem] transition-colors duration-150",
                isActive
                  ? "border-royal bg-royal-tint font-medium text-royal-dark"
                  : "border-transparent text-ink-2 hover:bg-paper hover:text-ink",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  aria-hidden="true"
                  className={isActive ? "text-royal" : "text-ink-3"}
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/** Live backend reachability, sourced from GET /. */
export function BackendStatus({ status }) {
  const map = {
    checking: { dot: "bg-ink-3", text: "Checking backend…" },
    online: { dot: "bg-correct", text: "Backend connected" },
    offline: { dot: "bg-wrong", text: "Backend unreachable" },
  };
  const state = map[status] || map.checking;

  return (
    <div className="flex items-center gap-2 text-xs text-ink-3" aria-live="polite">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${state.dot}`} aria-hidden="true" />
      {state.text}
    </div>
  );
}

export default function Sidebar({ status }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-rule bg-surface lg:flex lg:flex-col">
      <div className="px-5 py-6">
        <Wordmark />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6">
        <NavList />
      </nav>

      <div className="border-t border-rule px-5 py-4">
        <BackendStatus status={status} />
      </div>
    </aside>
  );
}
