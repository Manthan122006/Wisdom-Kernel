/**
 * JuniorDashboard.jsx
 * -------------------
 * Junior Employee Learn & Apply Workspace.
 * Role: JUNIOR_EMPLOYEE
 *
 * Keeps experience reading inline inside the Organization Workspace without
 * bouncing the user out to public routes.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Waypoints,
  Bookmark,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Clock,
  ThumbsUp,
  Brain,
  X,
  User,
  Building,
  Calendar,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";

import { api } from "../api/api";
import { LoadingState, ErrorState } from "../components/StateViews";
import { Stat } from "../components/Metrics";
import { Badge } from "../components/Card";

export default function JuniorDashboard() {
  const navigate = useNavigate();
  const [juniorData, setJuniorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Inline Experience Reader Modal State
  const [selectedExpId, setSelectedExpId] = useState(null);
  const [expDetailData, setExpDetailData] = useState(null);
  const [expDetailLoading, setExpDetailLoading] = useState(false);
  const [expDetailError, setExpDetailError] = useState(null);

  // Learner Feedback & Comments for Inline Reader
  const [userChoice, setUserChoice] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const loadJuniorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getJuniorDashboard();
      setJuniorData(res);
    } catch (err) {
      console.error("Junior dashboard load error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJuniorData();
  }, []);

  // Open inline experience detail
  const openExperienceDetail = async (expId) => {
    setSelectedExpId(expId);
    setExpDetailLoading(true);
    setExpDetailError(null);
    try {
      const data = await api.experienceDetail(expId);
      setExpDetailData(data);

      // Load feedback & comments
      api.getFeedback(expId, "usr-001").then((res) => {
        setFeedbackSummary(res);
        setUserChoice(res.user_feedback);
      }).catch(() => {});

      api.getComments(expId).then((res) => setComments(res)).catch(() => {});
    } catch (err) {
      console.error("Error loading experience detail:", err);
      setExpDetailError(err);
    } finally {
      setExpDetailLoading(false);
    }
  };

  const handleFeedback = async (choice) => {
    if (!selectedExpId) return;
    try {
      const res = await api.submitFeedback(selectedExpId, {
        user_id: "usr-001",
        user_name: "Riya Shah",
        feedback_type: choice,
      });
      setFeedbackSummary(res);
      setUserChoice(choice);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedExpId) return;
    try {
      const res = await api.addComment(selectedExpId, {
        user_id: "usr-001",
        user_name: "Riya Shah",
        user_role: "Junior Employee",
        comment: newComment.trim(),
      });
      setComments([res, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleToggleSave = async (e, expId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.toggleSavedExperience(expId);
      loadJuniorData();
    } catch (err) {
      console.error("Save toggle error:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Junior Learn & Apply Workspace…" rows={4} />;
  }

  if (error || !juniorData) {
    return <ErrorState error={error || { message: "Could not load Junior dashboard." }} onRetry={loadJuniorData} />;
  }

  const { metrics, recommended_experiences, saved_experiences } = juniorData;
  const exp = expDetailData?.experience;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 p-6 sm:p-8 space-y-4 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-md">
                👨‍💻 Role: Junior Employee
              </span>
              <span className="text-[0.6875rem] font-mono text-ink-3">Northstar Engineering</span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy mt-2">
              LEARN FROM EXPERIENCE
            </h1>
            <p className="text-xs sm:text-sm text-ink-2 mt-1">
              Learn how senior engineers solved real production problems—and why they made those decisions.
            </p>
          </div>
        </div>

        {/* 7.2 QUICK ASK EXPERIENCE SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="relative mt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask WisdomKernel e.g. 'How should I approach a production API slowdown?'..."
            className="w-full rounded-2xl border border-blue-300 bg-white py-3.5 pl-12 pr-28 text-xs sm:text-sm text-navy placeholder:text-ink-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
          <Search className="absolute left-4 top-3.5 text-blue-600" size={18} />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Ask Experience
          </button>
        </form>
      </div>

      {/* 7.7 PERSONAL LEARNING PROGRESS METRICS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.experiences_viewed} label="Experiences Viewed" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.simulations_completed} label="Simulations Completed" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.saved_knowledge_count} label="Saved Experiences" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
          <Stat value={metrics.topics_explored} label="Topics Explored" tone="correct" />
        </div>
      </div>

      {/* 7.6 INCIDENT SIMULATOR LAUNCHER BANNER */}
      <div className="rounded-3xl border border-navy bg-navy text-white p-6 sm:p-8 space-y-3 shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-300">
            Interactive Learning
          </span>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Waypoints size={20} className="text-blue-400" />
            <span>Interactive Incident Simulator</span>
          </h3>
          <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
            Test your decision-making in realistic production outage scenarios. Observe evidence, decide, receive instant feedback, and learn senior reasoning.
          </p>
        </div>

        <Link
          to="/simulator"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-500 transition-colors shrink-0 shadow-md"
        >
          <span>Launch Simulator</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 7.1 RECOMMENDED EXPERIENCES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            <span>Recommended for Your Learning</span>
          </h3>
          <span className="text-xs font-bold text-ink-3">
            Click &ldquo;Read Reasoning&rdquo; to inspect senior decisions inline
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended_experiences.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-rule bg-white p-5 space-y-3 shadow-subtle hover:border-blue-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {item.domain}
                  </span>
                  <button
                    onClick={(e) => handleToggleSave(e, item.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      item.is_saved
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-ink-3 border-rule hover:text-blue-600"
                    }`}
                    title={item.is_saved ? "Saved" : "Save experience"}
                  >
                    <Bookmark size={14} />
                  </button>
                </div>

                <h4 className="font-bold text-sm text-navy group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                  &ldquo;{item.lesson}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-rule flex items-center justify-between text-xs">
                <span className="text-ink-3 font-mono">{item.year}</span>
                <button
                  onClick={() => openExperienceDetail(item.id)}
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                >
                  <span>Read Reasoning</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7.8 MY SAVED KNOWLEDGE */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
            <Bookmark size={18} className="text-blue-600" />
            <span>My Saved Knowledge ({saved_experiences.length})</span>
          </h3>
        </div>

        {saved_experiences.length === 0 ? (
          <p className="text-xs text-ink-3 italic py-4">No bookmarked experiences saved yet.</p>
        ) : (
          <div className="space-y-3">
            {saved_experiences.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-rule bg-white">
                <div className="min-w-0 pr-3 space-y-1">
                  <span className="text-[0.6875rem] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {item.domain}
                  </span>
                  <h4 className="font-bold text-xs text-navy">{item.title}</h4>
                </div>
                <button
                  onClick={() => openExperienceDetail(item.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rule text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                >
                  <span>View</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INLINE EXPERIENCE DETAIL READER MODAL (Preserves Junior Workspace Context) */}
      {selectedExpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 space-y-6 shadow-elevated border border-rule relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedExpId(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-ink-3 hover:bg-paper hover:text-navy transition-colors z-10"
            >
              <X size={20} />
            </button>

            {expDetailLoading ? (
              <LoadingState message="Loading experience document…" rows={3} />
            ) : expDetailError ? (
              <ErrorState error={expDetailError} title="Could not load experience document" />
            ) : exp ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 border-b border-rule pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                      {exp.domain}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                      {exp.knowledge_status || "CURRENT"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-navy">{exp.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-ink-2">
                    <span className="font-bold text-navy">{exp.contributor_name} ({exp.role})</span>
                    <span>·</span>
                    <span className="font-mono text-ink-3">{exp.year}</span>
                  </div>
                </div>

                {/* Structured Fields */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold uppercase text-navy block text-[0.6875rem] mb-1">01 · Problem</span>
                    <p className="p-3.5 rounded-xl border border-rule bg-paper text-ink-2 leading-relaxed">{exp.problem}</p>
                  </div>

                  <div>
                    <span className="font-bold uppercase text-blue-700 block text-[0.6875rem] mb-1">02 · Decision</span>
                    <p className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-navy font-bold leading-relaxed">{exp.decision}</p>
                  </div>

                  <div>
                    <span className="font-bold uppercase text-blue-700 block text-[0.6875rem] mb-1">03 · Reasoning</span>
                    <p className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-navy leading-relaxed">{exp.reasoning}</p>
                  </div>

                  <div>
                    <span className="font-bold uppercase text-blue-700 block text-[0.6875rem] mb-1">04 · Transferred Lesson</span>
                    <blockquote className="p-4 rounded-xl border border-navy bg-navy text-white font-serif text-sm italic leading-relaxed">
                      &ldquo;{exp.lesson}&rdquo;
                    </blockquote>
                  </div>

                  {exp.mistake && (
                    <div>
                      <span className="font-bold uppercase text-wrong block text-[0.6875rem] mb-1">05 · False Assumption</span>
                      <p className="p-3.5 rounded-xl border border-wrong/30 bg-wrong-tint/40 text-navy leading-relaxed">{exp.mistake}</p>
                    </div>
                  )}
                </div>

                {/* Learner Feedback Section */}
                <div className="pt-4 border-t border-rule space-y-3">
                  <span className="text-xs font-bold text-navy block">Was this experience effective for your learning?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback("EFFECTIVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        userChoice === "EFFECTIVE" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-navy border-rule hover:bg-emerald-50"
                      }`}
                    >
                      Effective ({feedbackSummary?.counts?.effective ?? 0})
                    </button>
                    <button
                      onClick={() => handleFeedback("PARTIALLY_EFFECTIVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        userChoice === "PARTIALLY_EFFECTIVE" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-navy border-rule hover:bg-amber-50"
                      }`}
                    >
                      Partially Effective ({feedbackSummary?.counts?.partially_effective ?? 0})
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-rule space-y-3">
                  <span className="text-xs font-bold text-navy block">Discussion ({comments.length})</span>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add your junior perspective or question..."
                      className="flex-1 p-2.5 rounded-xl border border-rule text-xs font-sans text-navy focus:border-blue-500 focus:outline-none"
                    />
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light">
                      Post
                    </button>
                  </form>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-rule bg-paper text-xs space-y-1">
                        <div className="flex justify-between font-bold text-navy text-[0.6875rem]">
                          <span>{c.user_name} ({c.user_role})</span>
                          <span className="font-mono text-ink-3">{c.created_at}</span>
                        </div>
                        <p className="text-ink-2">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-rule flex justify-end">
                  <button
                    onClick={() => setSelectedExpId(null)}
                    className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light"
                  >
                    Back to Junior Workspace
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
