/**
 * ExperienceDetail.jsx
 * --------------------
 * Editorial deep reading view for a single experience record.
 * Integrated with WisdomKernel Knowledge Intelligence Features:
 * - Feature 1: Learner Feedback, Discussion Comments & Grounded Community Insights
 * - Feature 2: Knowledge Validity Status, Review Info, Status History & Evolution Tree
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  History,
  GitCommit,
  AlertTriangle,
  Clock,
  Send,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import { Badge, DemoBadge } from "../components/Card";
import { LoadingState, ErrorState } from "../components/StateViews";

export default function ExperienceDetail() {
  const { id } = useParams();

  // User state for prototype (default active learner)
  const currentUserId = "usr-001";
  const currentUserName = "Alex Rivera";
  const currentUserRole = "Senior Backend Engineer";

  const { data, loading, error, reload } = useApi(
    () => api.experienceDetail(id),
    [id]
  );

  const exp = data?.experience;
  const related = data?.related || [];

  // Telemetry: record view event on mount
  useEffect(() => {
    if (id) {
      api.recordActivity("VIEWED_EXPERIENCE", { experience_id: id, user_name: currentUserName }).catch(() => {});
    }
  }, [id]);

  // Feature 1 State: Feedback & Comments
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [userChoice, setUserChoice] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Feature 2 State: Status History & Evolution
  const [statusHistory, setStatusHistory] = useState([]);
  const [evolutionData, setEvolutionData] = useState(null);

  // Load Feedback, Comments, Status History & Evolution
  useEffect(() => {
    if (!id) return;

    // Load Feedback
    api
      .getFeedback(id, currentUserId)
      .then((res) => {
        setFeedbackSummary(res);
        setUserChoice(res.user_feedback);
      })
      .catch((err) => console.error("Error loading feedback:", err));

    // Load Comments
    api
      .getComments(id)
      .then((res) => setComments(res))
      .catch((err) => console.error("Error loading comments:", err));

    // Load Status History
    api
      .getStatusHistory(id)
      .then((res) => setStatusHistory(res))
      .catch((err) => console.error("Error loading status history:", err));

    // Load Knowledge Evolution
    api
      .getEvolution(id)
      .then((res) => setEvolutionData(res))
      .catch((err) => console.error("Error loading evolution:", err));
  }, [id]);

  // Handle submitting learner feedback
  const handleFeedback = async (choice) => {
    try {
      setFeedbackLoading(true);
      const res = await api.submitFeedback(id, {
        user_id: currentUserId,
        user_name: currentUserName,
        feedback_type: choice,
      });
      setFeedbackSummary(res);
      setUserChoice(choice);
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Handle adding a discussion comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentSubmitting(true);
      const res = await api.addComment(id, {
        user_id: currentUserId,
        user_name: currentUserName,
        user_role: currentUserRole,
        comment: newComment.trim(),
      });
      setComments([res, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle deleting own comment
  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId, currentUserId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 animate-fade-in max-w-4xl mx-auto">
        <LoadingState message="Opening experience document archive…" rows={4} />
      </div>
    );
  }

  if (error || !exp) {
    return (
      <div className="py-12 animate-fade-in max-w-4xl mx-auto">
        <ErrorState
          error={error || { message: `No experience record found for id "${id}".` }}
          title="Could not load this experience"
          onRetry={reload}
        />
        <div className="mt-4">
          <Button to="/experiences" variant="secondary" icon={ArrowLeft}>
            Back to Experience Library
          </Button>
        </div>
      </div>
    );
  }

  // Format Status Badge
  const status = exp.knowledge_status || "CURRENT";
  const getStatusBadge = () => {
    switch (status) {
      case "CURRENT":
        return {
          label: "CURRENT",
          color: "bg-emerald-50 text-emerald-700 border-emerald-300",
          dot: "bg-emerald-500",
          icon: "🟢",
          desc: "Reviewed and validated for active engineering use.",
        };
      case "AGING":
        return {
          label: "AGING",
          color: "bg-amber-50 text-amber-800 border-amber-300",
          dot: "bg-amber-500",
          icon: "🟠",
          desc: "Has not been reviewed recently; validation recommended.",
        };
      case "OUTDATED":
        return {
          label: "OUTDATED",
          color: "bg-rose-50 text-rose-800 border-rose-300",
          dot: "bg-rose-500",
          icon: "🔴",
          desc: "Explicitly superseded or deprecated by modern practices.",
        };
      case "CONTEXT-SPECIFIC":
        return {
          label: "CONTEXT-SPECIFIC",
          color: "bg-sky-50 text-sky-800 border-sky-300",
          dot: "bg-sky-500",
          icon: "🔵",
          desc: "Valid only under specific infrastructure or legacy constraints.",
        };
      default:
        return {
          label: "CURRENT",
          color: "bg-emerald-50 text-emerald-700 border-emerald-300",
          dot: "bg-emerald-500",
          icon: "🟢",
          desc: "Reviewed and validated.",
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <article className="mx-auto max-w-4xl animate-fade-in pb-16">
      {/* Top back navigation and document metadata */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
        <Link
          to="/experiences"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-3">
          {exp.is_demo && <DemoBadge />}
          {exp.verified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-correct bg-correct-tint px-2.5 py-1 rounded-full border border-correct/20">
              <CheckCircle2 size={13} /> Verified Peer Account
            </span>
          )}
          <span className="font-mono text-xs text-ink-3">ID: {exp.id}</span>
        </div>
      </div>

      {/* FEATURE 2.4: SUPERSEDED NEWER EXPERIENCE WARNING BANNER */}
      {evolutionData?.is_superseded && evolutionData?.superseded_by && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-sm text-navy">A Newer Experience is Available</h4>
              <p className="text-xs text-ink-2 mt-0.5">
                This experience has been superseded by:{" "}
                <span className="font-semibold text-navy">&ldquo;{evolutionData.superseded_by.title}&rdquo;</span>
              </p>
            </div>
          </div>
          <Link
            to={`/experiences/${evolutionData.superseded_by.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy-light transition-colors shrink-0"
          >
            <span>View Newer Experience</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Main Editorial White Document Sheet */}
      <div className="rounded-3xl border border-rule bg-white p-8 sm:p-12 shadow-card space-y-8">
        {/* DOCUMENT HEADER & KNOWLEDGE STATUS STRIP */}
        <header className="space-y-5">
          {/* FEATURE 2.1 & 2.3: KNOWLEDGE STATUS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-blue-50/50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">Knowledge Validity:</span>
              <span className={`inline-flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 rounded-xl border ${statusBadge.color}`}>
                <span>{statusBadge.icon}</span>
                <span>{statusBadge.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-blue-600" />
                <span>Last Reviewed: {exp.last_reviewed_at ? new Date(exp.last_reviewed_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently"}</span>
              </span>
              {exp.review_source && (
                <span className="hidden sm:inline-block text-ink-3">
                  Source: <strong className="text-navy font-semibold">{exp.review_source}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
              WisdomKernel Experience Brief
            </span>
            {exp.domain && <Badge tone="royal">{exp.domain}</Badge>}
            {exp.expertise && <Badge tone="neutral">{exp.expertise}</Badge>}
            {exp.experience_level && (
              <Badge tone="neutral" className="font-mono">
                {exp.experience_level}
              </Badge>
            )}
          </div>

          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-navy leading-tight">
            {exp.title}
          </h1>

          {/* Contributor Credential Strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-ink-2">
            <div className="flex items-center gap-2 font-bold text-navy">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <User size={15} />
              </div>
              <span>{exp.contributor_name}</span>
            </div>
            {exp.role && <span className="font-medium text-ink-2">{exp.role}</span>}
            {exp.years_experience != null && (
              <span className="text-ink-3 font-mono">
                {exp.years_experience} years engineering
              </span>
            )}
            {exp.company && (
              <span className="inline-flex items-center gap-1.5 text-ink-3">
                <Building size={13} /> {exp.company}
              </span>
            )}
            {exp.year && (
              <span className="inline-flex items-center gap-1.5 font-mono text-ink-3">
                <Calendar size={13} /> {exp.year}
              </span>
            )}
          </div>
        </header>

        {/* FEATURE 2.6: CONTEXT-SPECIFIC KNOWLEDGE INFO BOX */}
        {status === "CONTEXT-SPECIFIC" && (exp.valid_context || exp.invalid_context) && (
          <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800">
              <Info size={16} />
              <span>Contextual Applicability Scope</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {exp.valid_context && (
                <div className="bg-white p-3.5 rounded-xl border border-sky-100">
                  <span className="font-bold text-emerald-700 block mb-1">✓ Valid For:</span>
                  <span className="text-ink-2">{exp.valid_context}</span>
                </div>
              )}
              {exp.invalid_context && (
                <div className="bg-white p-3.5 rounded-xl border border-sky-100">
                  <span className="font-bold text-rose-700 block mb-1">✕ Not Recommended For:</span>
                  <span className="text-ink-2">{exp.invalid_context}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 1. THE PROBLEM (WHITE) */}
        {exp.problem && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">
              01 · The Problem Encountered
            </h2>
            <div className="rounded-2xl border border-rule bg-white p-5 sm:p-6 shadow-xs">
              <p className="font-sans text-base leading-relaxed text-ink-2">
                {exp.problem}
              </p>
            </div>
          </section>
        )}

        {/* 2. CONTEXT (VERY LIGHT BLUE: #F0F6FF) */}
        {exp.context && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
              02 · Operating Context & Constraints
            </h2>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5 sm:p-6">
              <p className="font-sans text-sm sm:text-base leading-relaxed text-navy">
                {exp.context}
              </p>
            </div>
          </section>
        )}

        {/* 3. THE DECISION (WHITE) */}
        {exp.decision && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">
              03 · The Decision Taken
            </h2>
            <div className="rounded-2xl border border-rule bg-white p-5 sm:p-6 shadow-xs">
              <p className="font-sans text-base font-semibold text-navy leading-relaxed">
                {exp.decision}
              </p>
            </div>
          </section>
        )}

        {/* 4. REASONING (SOFT BLUE: #DCEBFF / #EAF3FF) */}
        {exp.reasoning && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
              04 · Engineering Reasoning
            </h2>
            <div className="rounded-2xl border border-blue-200 bg-blue-100/60 p-5 sm:p-6">
              <p className="font-sans text-sm sm:text-base leading-relaxed text-navy">
                {exp.reasoning}
              </p>
            </div>
          </section>
        )}

        {/* 5. WHAT HAPPENED / OUTCOME (WHITE) */}
        {exp.outcome && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy mb-2">
              05 · System Outcome & Resolution
            </h2>
            <div className="rounded-2xl border border-rule bg-white p-5 sm:p-6 shadow-xs">
              <p className="font-sans text-sm sm:text-base leading-relaxed text-ink-2">
                {exp.outcome}
              </p>
            </div>
          </section>
        )}

        {/* 6. THE CORE LESSON (STRONGER BLUE / NAVY HIGHLIGHT: #102A56) */}
        {exp.lesson && (
          <section className="border-t border-rule pt-7">
            <div className="rounded-3xl border border-navy-deep bg-navy text-white p-8 sm:p-10 shadow-elevated">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider mb-3">
                <Lightbulb size={18} />
                <span>06 · Transferred Engineering Lesson</span>
              </div>
              <blockquote className="font-serif text-xl sm:text-2xl font-normal leading-relaxed text-white">
                &ldquo;{exp.lesson}&rdquo;
              </blockquote>
              <p className="mt-4 text-xs text-blue-200/80">
                Extracted from debrief with {exp.contributor_name} ({exp.role})
              </p>
            </div>
          </section>
        )}

        {/* 7. WHAT I WISH I KNEW (SOFT BLUE) */}
        {exp.what_i_wish_i_knew && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
              07 · What I Wish I Had Known
            </h2>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
              <p className="font-serif text-base leading-relaxed text-navy">
                {exp.what_i_wish_i_knew}
              </p>
            </div>
          </section>
        )}

        {/* 8. WRONG ASSUMPTION & ROOT CAUSE */}
        {(exp.mistake || exp.root_cause) && (
          <section className="border-t border-rule pt-7">
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy mb-3 flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-wrong" />
              <span>08 · False Assumption vs Root Cause</span>
            </h2>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
              <div className="bg-wrong-tint/50 p-5">
                <span className="text-label font-bold uppercase tracking-wider text-wrong">
                  Wrong Initial Assumption
                </span>
                <p className="mt-2 text-sm leading-relaxed text-ink font-medium">
                  {exp.mistake || "No separate false assumption recorded"}
                </p>
              </div>
              <div className="bg-white p-5">
                <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                  Actual Root Cause
                </span>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {exp.root_cause || "Root cause covered in reasoning"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* FEATURE 1: LEARNER FEEDBACK & EXPERIENCE DISCUSSION              */}
        {/* ================================================================= */}
        <section className="border-t-2 border-blue-100 pt-10 space-y-8">
          {/* FEATURE 1.1: LEARNER FEEDBACK */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
                <ThumbsUp size={18} className="text-blue-600" />
                <span>How useful was this experience in your situation?</span>
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Provide structured applicability feedback. Learner feedback measures usefulness and does not alter official Knowledge Validity Status.
              </p>
            </div>

            {/* 3 Choices Buttons */}
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleFeedback("EFFECTIVE")}
                disabled={feedbackLoading}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-bold transition-all ${
                  userChoice === "EFFECTIVE"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-2 ring-emerald-400/30"
                    : "border-rule bg-white text-navy hover:border-emerald-300 hover:bg-emerald-50/30"
                }`}
              >
                <span>Effective</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {feedbackSummary?.counts?.effective ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFeedback("PARTIALLY_EFFECTIVE")}
                disabled={feedbackLoading}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-bold transition-all ${
                  userChoice === "PARTIALLY_EFFECTIVE"
                    ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs ring-2 ring-amber-400/30"
                    : "border-rule bg-white text-navy hover:border-amber-300 hover:bg-amber-50/30"
                }`}
              >
                <span>Partially Effective</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {feedbackSummary?.counts?.partially_effective ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFeedback("NOT_APPLICABLE")}
                disabled={feedbackLoading}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-bold transition-all ${
                  userChoice === "NOT_APPLICABLE"
                    ? "border-slate-500 bg-slate-100 text-slate-800 shadow-xs ring-2 ring-slate-400/30"
                    : "border-rule bg-white text-navy hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>Not Applicable</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {feedbackSummary?.counts?.not_applicable ?? 0}
                </span>
              </button>
            </div>

            {/* FEATURE 1.3: COMMUNITY INSIGHT */}
            <div className="mt-4 rounded-xl border border-blue-200/80 bg-white p-4">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                Community Insight
              </span>
              <p className="text-xs text-navy leading-relaxed font-medium">
                {feedbackSummary?.community_insight || "Not enough learner feedback yet."}
              </p>
            </div>
          </div>

          {/* FEATURE 1.2: EXPERIENCE DISCUSSION */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                <span>Share your perspective</span>
              </h3>
              <span className="text-xs font-mono text-ink-3">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>
            </div>

            {/* Post Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share usefulness, applicability, limitations, context or alternative approaches..."
                rows={3}
                className="w-full rounded-2xl border border-rule p-4 text-xs text-navy placeholder:text-ink-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting || !newComment.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={13} />
                  <span>{commentSubmitting ? "Posting..." : "Post Perspective"}</span>
                </button>
              </div>
            </form>

            {/* Editorial Discussion Feed */}
            <div className="space-y-3 pt-2">
              {comments.length === 0 ? (
                <p className="text-xs text-ink-3 italic text-center py-4">
                  No perspective shared yet. Be the first to add your engineering context.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-rule bg-white p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy">{c.user_name}</span>
                        {c.user_role && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[0.6875rem]">
                            {c.user_role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6875rem] font-mono text-ink-3">{c.created_at}</span>
                        {c.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-ink-3 hover:text-rose-600 p-1 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-2 font-sans">{c.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FEATURE 2: KNOWLEDGE EVOLUTION & STATUS HISTORY                   */}
        {/* ================================================================= */}
        <section className="border-t-2 border-blue-100 pt-10 space-y-8">
          {/* FEATURE 2.4: KNOWLEDGE EVOLUTION TREE */}
          {evolutionData && (
            <div className="rounded-2xl border border-rule bg-white p-6 space-y-4">
              <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
                <GitCommit size={18} className="text-blue-600" />
                <span>Knowledge Evolution Tree</span>
              </h3>
              <p className="text-xs text-ink-3">
                Tracks how engineering practices evolve over time across superseding records.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {/* Earlier */}
                <div className="w-full sm:w-1/3 rounded-xl border border-rule p-3 bg-slate-50 text-center">
                  <span className="text-[0.6875rem] font-bold uppercase text-ink-3 block">Earlier Practice</span>
                  {evolutionData.earlier_experiences.length > 0 ? (
                    <Link
                      to={`/experiences/${evolutionData.earlier_experiences[0].id}`}
                      className="mt-1 block text-xs font-bold text-blue-600 hover:underline truncate"
                    >
                      {evolutionData.earlier_experiences[0].title}
                    </Link>
                  ) : (
                    <span className="mt-1 block text-xs text-ink-3 italic">Original Foundation</span>
                  )}
                </div>

                <div className="text-blue-400 font-bold text-sm sm:rotate-0 rotate-90">↓</div>

                {/* Current Item */}
                <div className="w-full sm:w-1/3 rounded-xl border-2 border-blue-500 p-3 bg-blue-50 text-center shadow-xs">
                  <span className="text-[0.6875rem] font-bold uppercase text-blue-700 block">This Experience</span>
                  <span className="mt-1 block text-xs font-extrabold text-navy truncate">{exp.title}</span>
                </div>

                <div className="text-blue-400 font-bold text-sm sm:rotate-0 rotate-90">↓</div>

                {/* Newer */}
                <div className="w-full sm:w-1/3 rounded-xl border border-rule p-3 bg-slate-50 text-center">
                  <span className="text-[0.6875rem] font-bold uppercase text-ink-3 block">Newer Practice</span>
                  {evolutionData.newer_experiences.length > 0 ? (
                    <Link
                      to={`/experiences/${evolutionData.newer_experiences[0].id}`}
                      className="mt-1 block text-xs font-bold text-blue-600 hover:underline truncate"
                    >
                      {evolutionData.newer_experiences[0].title}
                    </Link>
                  ) : (
                    <span className="mt-1 block text-xs text-emerald-600 font-semibold">Current State of Art</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FEATURE 2.5: STATUS HISTORY TIMELINE */}
          <div className="rounded-2xl border border-rule bg-white p-6 space-y-4">
            <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <span>Status History Audit Timeline</span>
            </h3>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-ink-3 italic">Initial status review set upon experience record creation.</p>
            ) : (
              <div className="relative border-l-2 border-blue-200 ml-3 pl-5 space-y-4 pt-1">
                {statusHistory.map((h) => (
                  <div key={h.id} className="relative space-y-1">
                    <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-navy">{h.created_at || "Recent"}</span>
                      <span className="font-mono text-[0.6875rem] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {h.previous_status} → {h.new_status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2 font-medium">{h.reason}</p>
                    <span className="text-[0.6875rem] text-ink-3 block">
                      Reviewed by {h.reviewed_by} ({h.review_source})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PROVENANCE FOOTER */}
        <footer className="mt-10 border-t border-rule pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
          <span>Source: {exp.source || "Recorded debrief"}</span>
          <span>Knowledge Archive Index · WisdomKernel</span>
          {exp.extraction_mode && <span>Structured by: {exp.extraction_mode}</span>}
        </footer>
      </div>

      {/* RELATED EXPERIENCES */}
      {related.length > 0 && (
        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h3 className="font-sans text-lg font-bold text-navy flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" />
              <span>More Experiences in {exp.domain}</span>
            </h3>
            <Link to="/experiences" className="text-xs font-bold text-blue-600 hover:underline">
              View All Library Records
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((item, idx) => {
              const isBlue = idx === 1;
              return (
                <Link
                  key={item.id}
                  to={`/experiences/${item.id}`}
                  className={`group flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover ${
                    isBlue
                      ? "border border-blue-200 bg-blue-50/70 shadow-subtle hover:border-blue-400"
                      : "border border-rule bg-white shadow-subtle hover:border-blue-300"
                  }`}
                >
                  <div>
                    <span className="font-mono text-[0.6875rem] text-ink-3">{item.year || "Archive"}</span>
                    <h4 className="mt-1 font-sans text-sm font-bold text-navy group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-xs text-ink-2 line-clamp-3 leading-relaxed">
                      {item.lesson}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-rule/70 pt-2.5 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>{item.contributor_name}</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
