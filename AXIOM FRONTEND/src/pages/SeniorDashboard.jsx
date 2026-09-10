/**
 * SeniorDashboard.jsx
 * -------------------
 * Senior Engineer Experience Contribution & Mentorship Workspace.
 * Role: SENIOR_ENGINEER
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mic,
  PlusCircle,
  BookOpen,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  GitCommit,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileEdit,
  Sparkles,
} from "lucide-react";

import { api } from "../api/api";
import { LoadingState, ErrorState } from "../components/StateViews";
import { Stat } from "../components/Metrics";
import { Badge } from "../components/Card";

import Record from "./Record";

export default function SeniorDashboard() {
  const [seniorData, setSeniorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showCaptureStudio, setShowCaptureStudio] = useState(false);

  const loadSeniorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSeniorDashboard();
      setSeniorData(res);
    } catch (err) {
      console.error("Senior dashboard load error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeniorData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Senior Engineer Contribution & Mentorship Workspace…" rows={4} />;
  }

  if (error || !seniorData) {
    return <ErrorState error={error || { message: "Could not load Senior dashboard." }} onRetry={loadSeniorData} />;
  }

  const { metrics, my_experiences, knowledge_needing_review } = seniorData;

  const filteredExperiences = my_experiences.filter((exp) => {
    if (filterStatus === "ALL") return true;
    return exp.status === filterStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BANNER & PROMINENT CAPTURE EXPERIENCE ACTION */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/70 p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-md">
              🧑‍💼 Role: Senior Engineer & Mentor
            </span>
            <span className="text-[0.6875rem] font-mono text-ink-3">Northstar Engineering</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy leading-tight">
            EXPERIENCE CONTRIBUTION
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
            Turn real-world engineering decisions, post-mortems, mistakes, and lessons into structured, reusable knowledge for junior employees.
          </p>
        </div>

        {/* 6.2 PROMINENT + CAPTURE EXPERIENCE BUTTON */}
        <button
          onClick={() => setShowCaptureStudio(!showCaptureStudio)}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-sm shadow-md hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <Mic size={18} />
          <span>{showCaptureStudio ? "Close Capture Studio" : "+ CAPTURE EXPERIENCE"}</span>
        </button>
      </div>

      {/* INLINE EXPERIENCE CAPTURE STUDIO */}
      {showCaptureStudio && (
        <div className="rounded-3xl border-2 border-blue-300 bg-white p-6 sm:p-8 shadow-card space-y-4 animate-fade-in relative">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
              ORGANIZATION CAPTURE STUDIO
            </span>
            <button
              onClick={() => {
                setShowCaptureStudio(false);
                loadSeniorData();
              }}
              className="text-xs font-bold text-ink-2 hover:text-navy px-3 py-1 rounded-lg border border-rule"
            >
              Close Studio
            </button>
          </div>
          <Record />
        </div>
      )}

      {/* 6.1 CONTRIBUTION METRICS CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.my_experiences} label="My Contributed Experiences" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.total_views} label="Total Views by Learners" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.learner_feedback_count} label="Learner Feedbacks" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={`${metrics.effective_feedback_percent}%`} label="Effective Rating" tone="correct" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat
            value={metrics.experiences_needing_review}
            label="Needing Review"
            tone={metrics.experiences_needing_review > 0 ? "caution" : "correct"}
          />
        </div>
      </div>

      {/* 6.7 KNOWLEDGE REVIEW REQUESTS */}
      {knowledge_needing_review && knowledge_needing_review.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={18} />
              <span>Knowledge Validity Review Requests</span>
            </h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Assigned to Senior
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {knowledge_needing_review.map((item) => (
              <div key={item.id} className="rounded-2xl border border-amber-200 bg-white p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy">{item.domain}</span>
                    <span className="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-amber-100 text-amber-800">
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-navy mt-1">{item.title}</h4>
                  <p className="text-xs text-ink-2 mt-1">{item.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-rule">
                  <span className="text-[0.6875rem] text-ink-3">Last Reviewed: {item.last_reviewed_at}</span>
                  <Link
                    to={`/experiences/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <span>Review Experience</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6.3 MY CONTRIBUTED EXPERIENCES LIBRARY */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 space-y-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
          <div>
            <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              <span>My Experience Library</span>
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Experiences you have authored and contributed to the organization knowledge base.
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-rule text-xs font-semibold">
            {["ALL", "CURRENT", "AGING", "OUTDATED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white text-navy font-bold shadow-xs border border-rule"
                    : "text-ink-2 hover:text-navy"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredExperiences.length === 0 ? (
            <p className="text-xs text-ink-3 italic py-6 text-center">No experiences match the selected filter.</p>
          ) : (
            filteredExperiences.map((exp) => (
              <div
                key={exp.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-rule bg-white hover:bg-blue-50/30 transition-all gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6875rem] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {exp.domain || "Engineering"}
                    </span>
                    <span className={`text-[0.6875rem] font-extrabold px-2 py-0.5 rounded border ${
                      exp.status === "CURRENT"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : exp.status === "AGING"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {exp.status}
                    </span>
                    <span className="font-mono text-xs text-ink-3">{exp.year}</span>
                  </div>

                  <h4 className="font-bold text-sm text-navy">{exp.title}</h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/experiences/${exp.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rule bg-white text-xs font-bold text-navy hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    <span>View & Manage</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
