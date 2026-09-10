/**
 * OrganizationWorkspace.jsx
 * -------------------------
 * Organization Workspace & 2-Phase Role Access Portal.
 *
 * PHASE 1: Organization Master Authentication (Org Key & Org Password)
 * PHASE 2: Role Selection (Head / Senior Engineer / Junior Employee)
 * PHASE 3: Role Security Check & Role Password Verification
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  UserCheck,
  GraduationCap,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  X,
  Sparkles,
  Unlock,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/StateViews";

export default function OrganizationWorkspace() {
  const { login, isAuthenticated, role, user, logout, isOrgUnlocked, unlockOrg } = useAuth();
  const navigate = useNavigate();

  // Phase 1 State: Organization Auth
  const [orgKey, setOrgKey] = useState("");
  const [orgPassword, setOrgPassword] = useState("");
  const [orgAuthError, setOrgAuthError] = useState(null);

  // Modal / Role Password State (Phase 3)
  const [selectedRoleTarget, setSelectedRoleTarget] = useState(null);
  const [rolePasswordInput, setRolePasswordInput] = useState("");
  const [roleAuthError, setRoleAuthError] = useState(null);

  const [loading, setLoading] = useState(false);

  // Step 1: Unlock Organization Master
  const handleOrgUnlockSubmit = (e) => {
    e.preventDefault();
    setOrgAuthError(null);

    const keyLower = orgKey.trim().toLowerCase();
    if (keyLower.includes("northstar") || keyLower === "northstar" || keyLower === "org-northstar" || orgKey === "NORTHSTAR") {
      if (orgPassword === "NorthstarOrg2026" || orgPassword === "NorthstarHead@2026" || orgPassword.length >= 4) {
        unlockOrg({ id: "org-northstar", name: "Northstar Engineering" });
        return;
      }
    }

    setOrgAuthError("Invalid Organization Key or Password. Try Org Key: NORTHSTAR & Password: NorthstarOrg2026");
  };

  const handleQuickOrgUnlock = () => {
    unlockOrg({ id: "org-northstar", name: "Northstar Engineering" });
  };

  // Step 2: Open Role Security Check Modal
  const openRoleSecurityModal = (roleConfig) => {
    if (!isOrgUnlocked && !isAuthenticated) {
      setOrgAuthError("You must first authenticate into your Organization before selecting a role.");
      return;
    }
    setSelectedRoleTarget(roleConfig);
    setRolePasswordInput("");
    setRoleAuthError(null);
  };

  // Step 3: Verify Role Password & Execute Role Login
  const handleRoleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoleTarget) return;

    try {
      setLoading(true);
      setRoleAuthError(null);

      await login(selectedRoleTarget.email, rolePasswordInput);

      if (selectedRoleTarget.id === "HEAD_ADMIN") navigate("/organization/head");
      else if (selectedRoleTarget.id === "SENIOR_ENGINEER") navigate("/organization/senior");
      else if (selectedRoleTarget.id === "JUNIOR_EMPLOYEE") navigate("/organization/junior");
      else navigate("/organization/head");
    } catch (err) {
      console.error("Role verification error:", err);
      setRoleAuthError(`Security check failed. Please enter the correct password for ${selectedRoleTarget.name}.`);
    } finally {
      setLoading(false);
    }
  };

  const rolesConfig = [
    {
      id: "HEAD_ADMIN",
      title: "👑 HEAD / ADMIN",
      badge: "ROLE 1",
      subtitle: "Organization Knowledge Intelligence & Oversight",
      description: "Understand organizational knowledge, detect knowledge gaps, evaluate expert dependencies, monitor employee learning telemetry, and manage knowledge evolution.",
      cardBorder: "border-blue-300 hover:border-blue-500",
      btnBg: "bg-navy hover:bg-navy-light",
      demoName: "Ananya Mehta",
      demoDept: "Engineering Leadership",
      email: "head@northstar.demo",
      defaultPw: "NorthstarHead@2026",
      route: "/organization/head",
    },
    {
      id: "SENIOR_ENGINEER",
      title: "🧑‍💼 SENIOR ENGINEER",
      badge: "ROLE 2",
      subtitle: "Experience Contribution & Mentorship",
      description: "Turn real-world decisions and mistakes into structured experiences via voice/text, review knowledge freshness, answer junior questions, and publish updated versions.",
      cardBorder: "border-blue-200 hover:border-blue-400",
      btnBg: "bg-blue-600 hover:bg-blue-700",
      demoName: "Vikram Rao",
      demoDept: "Platform Engineering",
      email: "senior@northstar.demo",
      defaultPw: "NorthstarSenior@2026",
      route: "/organization/senior",
    },
    {
      id: "JUNIOR_EMPLOYEE",
      title: "👨‍💻 JUNIOR EMPLOYEE",
      badge: "ROLE 3",
      subtitle: "Learn & Apply Real Experience",
      description: "Discover expert reasoning, practice on interactive incident simulators, save key experiences, and submit applicability feedback to accelerate growth.",
      cardBorder: "border-emerald-200 hover:border-emerald-400",
      btnBg: "bg-emerald-700 hover:bg-emerald-800",
      demoName: "Riya Shah",
      demoDept: "Backend Systems",
      email: "junior@northstar.demo",
      defaultPw: "NorthstarJunior@2026",
      route: "/organization/junior",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3 pt-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full">
          <Building2 size={14} />
          <span>Organization Knowledge Workspace</span>
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
          ORGANIZATION ACCESS PORTAL
        </h1>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-ink-2 leading-relaxed">
          Secure multi-tiered authorization for enterprise teams: Organization authentication followed by role security verification.
        </p>
      </div>

      {/* ACTIVE AUTHENTICATION STATUS BANNER */}
      {isAuthenticated && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-navy block">
                Signed in as: <strong className="text-emerald-800">{user?.name || "Organization User"}</strong> ({role})
              </span>
              <span className="text-[0.6875rem] text-ink-2">
                Active Organization: <strong>Northstar Engineering</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (role === "HEAD_ADMIN") navigate("/organization/head");
                else if (role === "SENIOR_ENGINEER") navigate("/organization/senior");
                else navigate("/organization/junior");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy-light transition-colors"
            >
              Enter My Workspace →
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      )}

      {/* PHASE 1: ORGANIZATION MASTER LOGIN (If not yet unlocked) */}
      {!isOrgUnlocked && !isAuthenticated && (
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-blue-200 bg-white p-6 sm:p-8 space-y-6 shadow-card">
          <div className="flex items-center gap-3 border-b border-rule pb-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">STEP 1: ORGANIZATION SIGN-IN</h2>
              <p className="text-xs text-ink-2">Enter Organization Access Credentials to unlock role selection</p>
            </div>
          </div>

          {orgAuthError && <ErrorState error={{ message: orgAuthError }} title="Organization Access Denied" />}

          <form onSubmit={handleOrgUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Organization Key or Name</label>
              <input
                type="text"
                value={orgKey}
                onChange={(e) => setOrgKey(e.target.value)}
                placeholder="e.g. NORTHSTAR or Northstar Engineering"
                className="w-full p-3 rounded-xl border border-rule text-xs font-mono text-navy focus:border-blue-500 focus:outline-none bg-paper/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Organization Master Password</label>
              <input
                type="password"
                value={orgPassword}
                onChange={(e) => setOrgPassword(e.target.value)}
                placeholder="Enter organization password..."
                className="w-full p-3 rounded-xl border border-rule text-xs font-mono text-navy focus:border-blue-500 focus:outline-none bg-paper/50"
                required
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-extrabold text-xs hover:bg-navy-light transition-all shadow-xs"
              >
                <Unlock size={16} />
                <span>Authenticate & Unlock Roles</span>
              </button>
              <button
                type="button"
                onClick={handleQuickOrgUnlock}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                ⚡ Quick Demo Unlock
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-[0.6875rem] text-blue-900 space-y-1">
            <span className="font-bold uppercase tracking-wider block">Demo Organization Credentials</span>
            <div>Key: <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">NORTHSTAR</code> | Password: <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">NorthstarOrg2026</code></div>
          </div>
        </div>
      )}

      {/* PHASE 2: ROLE SELECTION CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-navy bg-paper px-3 py-1 rounded-lg border border-rule">
              STEP 2: SELECT WORKSPACE ROLE
            </span>
            {isOrgUnlocked && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Northstar Engineering Unlocked
              </span>
            )}
          </div>
          {!isOrgUnlocked && !isAuthenticated && (
            <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <Lock size={12} /> Roles Locked Until Org Sign-In
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {rolesConfig.map((r) => {
            const isLocked = !isOrgUnlocked && !isAuthenticated;
            return (
              <div
                key={r.id}
                className={`rounded-3xl border-2 bg-white p-6 sm:p-7 space-y-5 shadow-card transition-all flex flex-col justify-between group ${
                  isLocked ? "opacity-75 border-rule bg-paper/40" : `${r.cardBorder} hover:shadow-card-hover`
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                      {r.id === "HEAD_ADMIN" ? <Crown size={24} /> : r.id === "SENIOR_ENGINEER" ? <UserCheck size={24} /> : <GraduationCap size={24} />}
                    </div>
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-sans text-xl font-extrabold text-navy">
                      {r.title}
                    </h2>
                    <span className="text-xs font-semibold text-blue-700 block mt-0.5">
                      {r.subtitle}
                    </span>
                    <p className="text-xs text-ink-2 mt-2 leading-relaxed">
                      {r.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-rule bg-paper/60 p-3 space-y-1 text-xs">
                    <span className="font-bold text-navy block text-[0.6875rem] uppercase tracking-wider">Default Account</span>
                    <div className="font-mono text-ink-2 text-[0.6875rem]">{r.demoName} ({r.demoDept})</div>
                    <div className="font-mono text-navy font-bold text-[0.6875rem]">{r.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => openRoleSecurityModal(r)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-xs transition-all shadow-xs ${
                    isLocked
                      ? "bg-ink-3 text-white cursor-not-allowed"
                      : `${r.btnBg} text-white`
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock size={14} />
                      <span>Authenticate Org First</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Enter {r.title.split("/")[0]} Workspace</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 3: ROLE SECURITY VERIFICATION MODAL */}
      {selectedRoleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 space-y-6 shadow-elevated border border-rule relative">
            <button
              onClick={() => setSelectedRoleTarget(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-ink-3 hover:bg-paper hover:text-navy transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-navy text-white flex items-center justify-center font-bold shrink-0">
                <KeyRound size={22} />
              </div>
              <div>
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  SECURITY CHECK
                </span>
                <h3 className="text-lg font-extrabold text-navy">
                  Verify Role Password
                </h3>
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              Enter the security password to authenticate into <strong>{selectedRoleTarget.title}</strong> workspace.
            </p>

            {roleAuthError && (
              <ErrorState error={{ message: roleAuthError }} title="Verification Failed" />
            )}

            <form onSubmit={handleRoleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">User Account</label>
                <input
                  type="text"
                  value={`${selectedRoleTarget.demoName} (${selectedRoleTarget.email})`}
                  disabled
                  className="w-full p-3 rounded-xl border border-rule text-xs font-mono text-ink-2 bg-paper cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Role Security Password</label>
                <input
                  type="password"
                  value={rolePasswordInput}
                  onChange={(e) => setRolePasswordInput(e.target.value)}
                  placeholder={`Enter password for ${selectedRoleTarget.demoName}...`}
                  className="w-full p-3 rounded-xl border border-rule text-xs font-mono text-navy focus:border-navy focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[0.6875rem] text-blue-900 flex items-center justify-between">
                <span>Default Security Password:</span>
                <button
                  type="button"
                  onClick={() => setRolePasswordInput(selectedRoleTarget.defaultPw)}
                  className="font-mono font-bold bg-white px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {selectedRoleTarget.defaultPw} (Auto-Fill)
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoleTarget(null)}
                  className="flex-1 py-3 rounded-xl border border-rule text-ink-2 text-xs font-bold hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-navy text-white text-xs font-extrabold hover:bg-navy-light transition-all shadow-xs"
                >
                  {loading ? "Verifying..." : "Verify & Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
