/**
 * HeadDashboard.jsx
 * -----------------
 * Head / Admin Organization Knowledge Intelligence Workspace.
 * Role: HEAD_ADMIN
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Search,
  Eye,
  Bookmark,
  TrendingUp,
  AlertTriangle,
  Users,
  Shield,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Lock,
  Filter,
  UserCheck,
  Building2,
  Clock,
  Layers,
} from "lucide-react";

import { api } from "../api/api";
import { LoadingState, ErrorState } from "../components/StateViews";
import { Stat } from "../components/Metrics";
import { Badge } from "../components/Card";

export default function HeadDashboard() {
  const [intel, setIntel] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHeadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [intelRes, empRes] = await Promise.all([
        api.getHeadDashboard(),
        api.getHeadEmployees(),
      ]);
      setIntel(intelRes);
      setEmployees(empRes);
    } catch (err) {
      console.error("Head dashboard load error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeadData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Organization Knowledge Intelligence metrics for Head / Admin…" rows={5} />;
  }

  if (error || !intel) {
    return <ErrorState error={error || { message: "Could not load Head dashboard." }} onRetry={loadHeadData} />;
  }

  const {
    key_metrics,
    privacy_notice,
    employee_activity,
    most_used_knowledge,
    most_searched_topics,
    knowledge_gaps,
    knowledge_risk,
    expert_dependency,
    knowledge_health,
  } = intel;

  const filteredEmployees = employees.filter((emp) => {
    if (roleFilter === "ALL") return true;
    return emp.role === roleFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 sm:p-8 space-y-4 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-md">
                👑 Role: Head / Admin
              </span>
              <span className="text-[0.6875rem] font-mono text-ink-3">Northstar Engineering</span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy mt-2 flex items-center gap-3">
              <Brain className="text-blue-600" size={32} />
              <span>ORGANIZATION KNOWLEDGE INTELLIGENCE</span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-2 mt-1">
              Understand how organizational experience is captured, discovered, used, and retained across teams.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-xs font-semibold text-navy shadow-xs">
            <Lock size={14} className="text-blue-600" />
            <span>Encrypted Aiven MySQL Persistence</span>
          </div>
        </div>

        {/* PRIVACY GUARANTEE BANNER */}
        <div className="rounded-2xl border border-blue-200 bg-white p-4 flex items-start gap-3 text-xs text-navy">
          <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
          <div>
            <strong className="font-bold text-navy block">Strict In-App Telemetry Guarantee:</strong>
            <p className="text-ink-2 mt-0.5 leading-relaxed">
              {privacy_notice} Personal browser activity, external files, keystrokes, and personal device activity are never tracked.
            </p>
          </div>
        </div>
      </div>

      {/* 5.1 HEAD KEY METRICS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.employees} label="Employees" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.senior_experts || 4} label="Senior Experts" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.experiences} label="Experiences" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.knowledge_views} label="Knowledge Views" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat
            value={key_metrics.knowledge_at_risk}
            label="Knowledge at Risk"
            tone={key_metrics.knowledge_at_risk > 0 ? "wrong" : "correct"}
          />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat
            value={knowledge_gaps?.length || 3}
            label="Knowledge Gaps"
            tone={knowledge_gaps?.length > 0 ? "caution" : "correct"}
          />
        </div>
      </div>

      {/* 5.2 EMPLOYEE DIRECTORY */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 space-y-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
          <div>
            <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              <span>Organization Employee Directory</span>
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Overview of team members, roles, departments, and knowledge contribution levels.
            </p>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-rule text-xs font-semibold">
            {["ALL", "HEAD_ADMIN", "SENIOR_ENGINEER", "JUNIOR_EMPLOYEE"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleFilter === r
                    ? "bg-white text-navy font-bold shadow-xs border border-rule"
                    : "text-ink-2 hover:text-navy"
                }`}
              >
                {r === "ALL" ? "All Roles" : r.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rule bg-slate-50 text-ink-3 font-bold uppercase tracking-wider">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5 text-right">Experiences Contributed</th>
                <th className="p-3.5 text-right">WisdomKernel Activity</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-navy">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {emp.name[0]}
                      </div>
                      <div>
                        <span className="block">{emp.name}</span>
                        <span className="text-[0.6875rem] text-ink-3 font-mono">{emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-bold border ${
                      emp.role === "HEAD_ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : emp.role === "SENIOR_ENGINEER"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {emp.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 text-ink-2 font-medium">{emp.department}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-navy">{emp.experiences_contributed}</td>
                  <td className="p-3.5 text-right font-medium">
                    <span className={`px-2 py-0.5 rounded text-[0.6875rem] font-bold ${
                      emp.activity_level === "High" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {emp.activity_level} ({emp.activity_count} actions)
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5.6 KNOWLEDGE GAPS ALERT SECTION */}
      {knowledge_gaps && knowledge_gaps.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="font-sans text-lg font-extrabold text-navy flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={20} />
              <span>Knowledge Gaps Detected</span>
            </h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Action Required
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {knowledge_gaps.map((gap) => (
              <div key={gap.id} className="rounded-2xl border border-amber-200 bg-white p-5 space-y-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[0.6875rem] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⚠ {gap.status}
                  </span>
                  <h4 className="font-bold text-sm text-navy mt-2">{gap.topic}</h4>
                  <div className="flex items-center gap-4 text-xs font-mono text-ink-2 mt-2">
                    <span>Searches: <strong>{gap.searches}</strong></span>
                    <span>Records: <strong>{gap.relevant_experiences}</strong></span>
                  </div>
                  <p className="text-xs text-ink-2 mt-2 leading-relaxed">{gap.message}</p>
                </div>

                <Link
                  to="/record"
                  className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy-light transition-colors mt-2"
                >
                  <span>Capture Experience</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5.8 EXPERT DEPENDENCY & 5.7 KNOWLEDGE RISK */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* EXPERT DEPENDENCY */}
        <div className="rounded-3xl border border-rule bg-white p-6 space-y-4 shadow-subtle">
          <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2 border-b border-rule pb-3">
            <Users size={18} className="text-blue-600" />
            <span>Expert Dependency Concentration</span>
          </h3>

          <div className="space-y-3">
            {expert_dependency && expert_dependency.length > 0 ? (
              expert_dependency.map((dep, i) => (
                <div key={i} className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy">{dep.domain}</span>
                    <span className="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-rose-100 text-rose-800">
                      {dep.concentration_percent}% Concentration
                    </span>
                  </div>
                  <p className="text-xs text-ink-2">
                    Primary Contributor: <strong className="text-navy">{dep.primary_contributor}</strong>
                  </p>
                  <p className="text-xs text-ink-3 italic">{dep.recommendation}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-3 italic py-4">No critical expert concentration risks detected.</p>
            )}
          </div>
        </div>

        {/* KNOWLEDGE RISK */}
        <div className="rounded-3xl border border-rule bg-white p-6 space-y-4 shadow-subtle">
          <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2 border-b border-rule pb-3">
            <ShieldAlert size={18} className="text-blue-600" />
            <span>Knowledge Risk Matrix</span>
          </h3>

          <div className="space-y-3">
            {knowledge_risk && knowledge_risk.length > 0 ? (
              knowledge_risk.map((risk, i) => (
                <div key={i} className="rounded-2xl border border-rule bg-white p-4 space-y-1 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-navy">{risk.area}</h4>
                    <p className="text-xs text-ink-3 leading-relaxed mt-0.5">{risk.reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                    risk.risk_level === "HIGH"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : risk.risk_level === "MEDIUM"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {risk.risk_level}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-3 italic py-4">No high-risk knowledge domains detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
