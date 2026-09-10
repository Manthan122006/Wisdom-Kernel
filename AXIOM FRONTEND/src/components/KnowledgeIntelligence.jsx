/**
 * KnowledgeIntelligence.jsx
 * -------------------------
 * Enterprise Organization Knowledge Intelligence Dashboard.
 * Feature 3 integration:
 * - Calculated key metrics from MySQL
 * - In-app telemetry activity (NO surveillance)
 * - Most used knowledge & searched topics
 * - Automated Knowledge Gaps detection
 * - Transparent Rule-based Knowledge Risk calculation
 * - Expert Dependency concentration alerts
 * - Knowledge Health Progress Bars
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
} from "lucide-react";

import { api } from "../api/api";
import { LoadingState, ErrorState } from "./StateViews";
import { Stat } from "./Metrics";

export default function KnowledgeIntelligence() {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOrganizationIntelligence();
      setIntel(res);
    } catch (err) {
      console.error("Intelligence load error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  if (loading) {
    return <LoadingState message="Calculating organization knowledge intelligence metrics from MySQL database…" rows={4} />;
  }

  if (error || !intel) {
    return <ErrorState error={error || { message: "Could not load knowledge intelligence data." }} onRetry={fetchIntelligence} />;
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER STRIP & PRIVACY GUARANTEE BANNER */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 sm:p-8 space-y-4 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-md">
              Enterprise Knowledge Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mt-2 flex items-center gap-3">
              <Brain className="text-blue-600" size={28} />
              <span>Organization Knowledge Intelligence</span>
            </h2>
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

      {/* 3.1 KEY METRICS CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.employees} label="Employees" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={key_metrics.experiences} label="Captured Experiences" tone="royal" />
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
      </div>

      {/* 3.8 ORGANIZATION KNOWLEDGE HEALTH */}
      {knowledge_health && (
        <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 space-y-6 shadow-subtle">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              <span>Organization Knowledge Health</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Overall Status: {knowledge_health.overall_health}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-navy mb-1.5">
                <span>Knowledge Coverage</span>
                <span className="font-mono text-blue-700">{knowledge_health.coverage_percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-50 border border-blue-200 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${knowledge_health.coverage_percent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-navy mb-1.5">
                <span>Knowledge Freshness</span>
                <span className="font-mono text-blue-700">{knowledge_health.freshness_percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-50 border border-blue-200 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${knowledge_health.freshness_percent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-navy mb-1.5">
                <span>Knowledge Diversity</span>
                <span className="font-mono text-blue-700">{knowledge_health.diversity_percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-50 border border-blue-200 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${knowledge_health.diversity_percent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-navy mb-1.5">
                <span>Knowledge Usage</span>
                <span className="font-mono text-blue-700">{knowledge_health.usage_percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-50 border border-blue-200 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${knowledge_health.usage_percent}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 KNOWLEDGE GAPS ALERT SECTION */}
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

      {/* 3.7 EXPERT DEPENDENCY & 3.6 KNOWLEDGE RISK */}
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

      {/* 3.2 EMPLOYEE KNOWLEDGE ACTIVITY TABLE */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <span>Employee Knowledge Activity (Inside WisdomKernel)</span>
          </h3>
          <span className="text-xs text-ink-3">Live Telemetry Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rule bg-slate-50 text-ink-3 font-bold uppercase tracking-wider">
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5 text-right">Viewed</th>
                <th className="p-3.5 text-right">Searches</th>
                <th className="p-3.5 text-right">Simulations</th>
                <th className="p-3.5 text-right">Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {employee_activity.map((emp, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-navy flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[0.6875rem]">
                      {emp.name[0]}
                    </div>
                    <span>{emp.name}</span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-navy font-semibold">{emp.viewed}</td>
                  <td className="p-3.5 text-right font-mono text-navy font-semibold">{emp.searches}</td>
                  <td className="p-3.5 text-right font-mono text-navy font-semibold">{emp.simulations}</td>
                  <td className="p-3.5 text-right font-mono text-navy font-semibold">{emp.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.3 MOST USED KNOWLEDGE & 3.4 MOST SEARCHED TOPICS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MOST USED KNOWLEDGE */}
        <div className="rounded-3xl border border-rule bg-white p-6 space-y-4 shadow-subtle">
          <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2 border-b border-rule pb-3">
            <Eye size={18} className="text-blue-600" />
            <span>Most Used Knowledge</span>
          </h3>

          <div className="space-y-3">
            {most_used_knowledge.map((item) => (
              <Link
                key={item.id}
                to={`/experiences/${item.id}`}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-rule bg-white hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="font-bold text-xs text-navy group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </h4>
                  <span className="text-[0.6875rem] text-ink-3">{item.domain}</span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs font-bold shrink-0">
                  {item.views} views
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* MOST SEARCHED TOPICS */}
        <div className="rounded-3xl border border-rule bg-white p-6 space-y-4 shadow-subtle">
          <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2 border-b border-rule pb-3">
            <Search size={18} className="text-blue-600" />
            <span>Most Searched Topics</span>
          </h3>

          <div className="space-y-3">
            {most_searched_topics.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border border-rule bg-white">
                <span className="font-bold text-xs text-navy">{topic.topic}</span>
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                  {topic.count} searches
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
