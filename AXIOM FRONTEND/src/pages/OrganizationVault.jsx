/**
 * OrganizationVault.jsx
 * ---------------------
 * Private Organization Knowledge Vault.
 *
 * Section 14 Requirements:
 * - White foundation
 * - Light blue sections
 * - Blue private/restricted indicators
 * - Dark navy important information
 */

import { useMemo, useState } from "react";
import {
  Brain,
  Building2,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserMinus,
  Wrench,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { formatDate, humanizeKey, renderValue } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card } from "../components/Card";
import { ProgressBar, Stat } from "../components/Metrics";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import KnowledgeIntelligence from "../components/KnowledgeIntelligence";

const TABS = [
  { id: "intelligence", label: "Knowledge Intelligence", icon: Brain },
  { id: "vault", label: "Vault Assets", icon: ShieldCheck },
  { id: "onboarding", label: "Onboarding", icon: GraduationCap },
  { id: "troubleshooting", label: "Troubleshooting", icon: Wrench },
  { id: "postmortems", label: "Post-Mortems", icon: FileWarning },
  { id: "retirement", label: "Retirement Risk", icon: UserMinus },
  { id: "kri", label: "KRI Telemetry", icon: Building2 },
  { id: "dashboard", label: "Summary", icon: LayoutDashboard },
];


const RISK_TONE = { high: "wrong", medium: "caution", low: "correct" };

function NotTracked({ children }) {
  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs leading-relaxed text-ink-2">
      {children}
    </div>
  );
}

function SectionHeading({ children, note }) {
  return (
    <div className="mb-5 border-b border-rule pb-3">
      <h2 className="font-sans text-xl font-extrabold text-navy">{children}</h2>
      {note && <p className="mt-1 text-xs sm:text-sm text-ink-2 leading-relaxed">{note}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Vault Tab                                                        */
/* ------------------------------------------------------------------ */

function VaultTab({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];
  const restricted = safeItems.filter((item) => item.confidentiality === "restricted").length;
  const recent = [...safeItems].sort((a, b) =>
    String(b.last_updated || "").localeCompare(String(a.last_updated || ""))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat row: Alternating White & Light Blue */}
      <div className="grid grid-cols-2 gap-6 rounded-3xl border border-blue-200 bg-blue-50/70 p-6 sm:grid-cols-3 shadow-subtle">
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <Stat value={safeItems.length} label="Private Knowledge Assets" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <Stat
            value={restricted}
            label="Restricted Access Assets"
            tone={restricted > 0 ? "wrong" : "ink"}
          />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <Stat value={safeItems.length - restricted} label="Internal Organization Access" />
        </div>
      </div>

      <div>
        <SectionHeading note="Ordered chronologically by latest updates to internal documentation.">
          Private Knowledge Assets
        </SectionHeading>

        <ul className="divide-y divide-rule border-y border-rule rounded-2xl bg-white overflow-hidden shadow-subtle">
          {recent.map((item, idx) => (
            <li
              key={item.id}
              className={`p-5 sm:p-6 transition-colors ${
                idx % 2 === 1 ? "bg-paper/60 hover:bg-blue-50/50" : "bg-white hover:bg-blue-50/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans text-base font-bold text-navy">{item.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-2">
                    {item.summary}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {item.category && <Badge tone="royal">{item.category}</Badge>}
                  {item.confidentiality && (
                    <Badge
                      tone={item.confidentiality === "restricted" ? "wrong" : "neutral"}
                      icon={item.confidentiality === "restricted" ? Lock : undefined}
                    >
                      {item.confidentiality.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-3">
                {item.owner && `Asset Owner: ${item.owner}`}
                {item.owner && item.last_updated && " · "}
                {item.last_updated && `Updated ${formatDate(item.last_updated)}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Onboarding Tab                                                   */
/* ------------------------------------------------------------------ */

function OnboardingTab({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];
  const sorted = [...safeItems].sort((a, b) => (a.week || 0) - (b.week || 0));
  const lastWeek = sorted.length > 0 ? sorted[sorted.length - 1].week : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 gap-6 rounded-3xl border border-blue-200 bg-blue-50/70 p-6 sm:grid-cols-3 shadow-subtle">
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <Stat value={sorted.length} label="Curriculum Modules" tone="royal" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <Stat value={lastWeek ? `${lastWeek} Weeks` : "—"} label="Curriculum Duration" />
        </div>
        <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
          <p className="font-mono text-2xl font-bold tabular-nums text-navy">—</p>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-ink-2">Completion Rate</p>
          <p className="mt-0.5 text-xs text-ink-3">Telemetry not integrated</p>
        </div>
      </div>

      <NotTracked>
        Per-engineer task completion, onboarding cohort analytics, and ramp-up metrics are not yet exposed by the core API.
      </NotTracked>

      <div>
        <SectionHeading note="Curriculum modules derived from senior engineer debriefs.">
          Engineer Onboarding Programme
        </SectionHeading>

        <ol className="space-y-4">
          {sorted.map((item, idx) => {
            const isLightBlue = idx % 2 === 1;
            return (
              <li key={item.id}>
                <div
                  className={`p-6 rounded-2xl shadow-subtle transition-all ${
                    isLightBlue
                      ? "border border-blue-200 bg-blue-50/70"
                      : "border border-rule bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Week {item.week}
                      </span>
                      <h3 className="mt-1 font-sans text-lg font-extrabold text-navy">{item.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                        {item.objective}
                      </p>
                    </div>
                    {item.mentor && <Badge tone="royal">Mentor: {item.mentor}</Badge>}
                  </div>

                  {item.resources?.length > 0 && (
                    <p className="mt-4 border-t border-rule/70 pt-3 text-xs text-ink-2">
                      <span className="font-bold text-navy">Required Resources: </span>
                      {item.resources.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Troubleshooting Tab                                              */
/* ------------------------------------------------------------------ */

function TroubleshootingTab({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading note="Symptom-driven incident runbooks compiled from past production outages.">
        Production Troubleshooting Runbooks
      </SectionHeading>

      <div className="space-y-6">
        {safeItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-rule bg-white shadow-subtle">
            <header className="border-b border-blue-200/80 bg-blue-50/60 px-6 sm:px-8 py-5">
              <span className="text-label font-bold uppercase tracking-wider text-blue-700">
                Reported Outage Symptom
              </span>
              <h3 className="mt-1 font-sans text-xl font-extrabold text-navy">{item.symptom}</h3>
            </header>

            <div className="grid gap-px bg-rule/70 sm:grid-cols-2">
              {item.first_checks?.length > 0 && (
                <div className="bg-white p-6">
                  <h4 className="text-label font-bold uppercase tracking-wider text-correct flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>First Checks (Triage)</span>
                  </h4>
                  <ol className="mt-3 space-y-2">
                    {item.first_checks.map((check, index) => (
                      <li key={index} className="flex gap-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                        <span className="font-mono text-xs font-bold text-blue-600">{index + 1}.</span>
                        <span>{check}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {item.common_causes?.length > 0 && (
                <div className="bg-white p-6">
                  <h4 className="text-label font-bold uppercase tracking-wider text-ink-3">
                    Verified Common Causes
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {item.common_causes.map((cause, index) => (
                      <li key={index} className="flex gap-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                        <span className="font-bold text-blue-600">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {item.escalate_when && (
              <div className="border-t border-caution/30 bg-caution-tint/50 px-6 py-4 flex items-start gap-2.5 text-xs sm:text-sm">
                <AlertTriangle size={16} className="text-caution shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy">Escalation Trigger: </span>
                  <span className="text-ink-2">{item.escalate_when}</span>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Postmortems Tab                                                  */
/* ------------------------------------------------------------------ */

function PostmortemsTab({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading note="Post-incident reviews documenting system impact, root causes, and verified corrective actions.">
        Incident Post-Mortems Archive
      </SectionHeading>

      <div className="space-y-6">
        {safeItems.map((item, idx) => {
          const isLightBlue = idx % 2 === 1;
          return (
            <div
              key={item.id}
              className={`p-6 sm:p-7 rounded-3xl shadow-subtle space-y-4 ${
                isLightBlue
                  ? "border border-blue-200 bg-blue-50/70"
                  : "border border-rule bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule/80 pb-3">
                <div>
                  <h3 className="font-sans text-xl font-extrabold text-navy">{item.title}</h3>
                  {item.date && (
                    <p className="mt-1 font-mono text-xs text-ink-3">Incident Date: {formatDate(item.date)}</p>
                  )}
                </div>
                {item.status && (
                  <Badge tone={item.status === "closed" ? "correct" : "caution"}>
                    {item.status.toUpperCase()}
                  </Badge>
                )}
              </div>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                {item.impact && (
                  <div>
                    <span className="text-label font-bold uppercase tracking-wider text-ink-3">Impact Summary</span>
                    <p className="mt-1 text-ink-2">{item.impact}</p>
                  </div>
                )}

                {item.root_cause && (
                  <div>
                    <span className="text-label font-bold uppercase tracking-wider text-wrong">Root Cause Identified</span>
                    <p className="mt-1 text-navy font-semibold">{item.root_cause}</p>
                  </div>
                )}

                {item.corrective_actions?.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xs">
                    <span className="text-label font-bold uppercase tracking-wider text-blue-700">
                      Verified Corrective Actions
                    </span>
                    <ul className="mt-2 space-y-1.5">
                      {item.corrective_actions.map((act, index) => (
                        <li key={index} className="flex gap-2 text-xs sm:text-sm text-navy font-medium">
                          <span className="text-blue-600 font-bold">✓</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Retirement Risk Tab                                              */
/* ------------------------------------------------------------------ */

function RetirementTab({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalRecorded = safeItems.reduce((sum, item) => sum + (item.sessions_recorded || 0), 0);
  const totalTarget = safeItems.reduce((sum, item) => sum + (item.sessions_target || 0), 0);
  const overall = totalTarget > 0 ? Math.round((totalRecorded / totalTarget) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-7 sm:p-8 shadow-subtle space-y-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
            <Stat
              value={safeItems.length}
              label="Senior Engineers in Register"
              tone={safeItems.length > 0 ? "wrong" : "ink"}
            />
          </div>
          <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
            <Stat value={`${totalRecorded}/${totalTarget}`} label="Capture Sessions Completed" />
          </div>
          <div className="rounded-2xl border border-rule bg-white p-4 shadow-xs">
            <Stat value={`${overall}%`} label="Overall Knowledge Transferred" tone="royal" />
          </div>
        </div>

        <div className="pt-2">
          <ProgressBar
            value={totalRecorded}
            max={totalTarget || 1}
            label="Total Knowledge Transfer Progress Against Target"
            valueLabel={`${overall}% (${totalRecorded} / ${totalTarget})`}
            tone={overall >= 70 ? "correct" : overall >= 40 ? "caution" : "wrong"}
          />
        </div>
      </div>

      <div>
        <SectionHeading note="Senior personnel approaching retirement with critical institutional knowledge.">
          Key Staff Knowledge Register
        </SectionHeading>

        <div className="space-y-5">
          {safeItems.map((item, idx) => {
            const recorded = item.sessions_recorded || 0;
            const target = item.sessions_target || 0;
            const percent = target > 0 ? Math.round((recorded / target) * 100) : 0;
            const isLightBlue = idx % 2 === 1;

            return (
              <div
                key={item.id}
                className={`p-6 sm:p-7 rounded-3xl shadow-subtle space-y-4 ${
                  isLightBlue ? "border border-blue-200 bg-blue-50/70" : "border border-rule bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule/80 pb-3">
                  <div>
                    <h3 className="font-sans text-xl font-extrabold text-navy">{item.engineer}</h3>
                    <p className="mt-0.5 text-xs font-medium text-ink-2">
                      {item.role}
                      {item.years_experience != null && ` · ${item.years_experience} years in domain`}
                    </p>
                  </div>
                  {item.capture_status && (
                    <Badge
                      tone={
                        item.capture_status === "in_progress"
                          ? "caution"
                          : item.capture_status === "not_started"
                            ? "wrong"
                            : "correct"
                      }
                    >
                      {humanizeKey(item.capture_status)}
                    </Badge>
                  )}
                </div>

                {item.critical_knowledge_areas?.length > 0 && (
                  <div>
                    <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                      Critical Knowledge Domains
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.critical_knowledge_areas.map((area) => (
                        <Badge key={area} tone="royal">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <ProgressBar
                    value={recorded}
                    max={target || 1}
                    label="Recorded Sessions Progress"
                    valueLabel={`${recorded} of ${target} sessions (${percent}%)`}
                    tone={percent >= 70 ? "correct" : percent >= 40 ? "caution" : "wrong"}
                  />
                </div>

                {item.successor && (
                  <p className="text-xs font-semibold text-ink-2 border-t border-rule/70 pt-3">
                    Designated Successor: <span className="text-navy font-bold">{item.successor}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Knowledge Risk Indicators (KRI) Tab                              */
/* ------------------------------------------------------------------ */

function KriTab({ data }) {
  const indicators = Array.isArray(data?.indicators) ? data.indicators : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading note={data?.description || "High-priority signals of operational knowledge vulnerability."}>
        Knowledge Risk Indicators (KRI)
      </SectionHeading>

      {indicators.length === 0 ? (
        <EmptyState
          title="No KRI indicators returned"
          message="No knowledge risk telemetry records found for this organization."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {indicators.map((ind, idx) => {
            const isLightBlue = idx % 2 === 1;
            return (
              <div
                key={ind.id}
                className={`flex flex-col justify-between p-6 rounded-2xl shadow-subtle ${
                  isLightBlue
                    ? "border border-blue-200 bg-blue-50/70"
                    : "border border-rule bg-white"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-sans text-base font-extrabold text-navy">{ind.name}</h3>
                    {ind.risk_level && (
                      <Badge tone={RISK_TONE[ind.risk_level] || "neutral"}>
                        {ind.risk_level.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <div className="my-4">
                    <span className="font-mono text-4xl font-extrabold text-navy tabular-nums">
                      {ind.value}
                    </span>
                    {ind.unit === "percent" ? (
                      <span className="font-mono text-2xl font-bold text-ink-3 ml-1">%</span>
                    ) : ind.unit ? (
                      <span className="text-xs font-semibold text-ink-3 ml-2">{ind.unit}</span>
                    ) : null}
                  </div>

                  {ind.unit === "percent" && (
                    <div className="mb-4">
                      <ProgressBar
                        value={ind.value}
                        max={100}
                        size="sm"
                        tone={RISK_TONE[ind.risk_level] === "wrong" ? "wrong" : "royal"}
                      />
                    </div>
                  )}
                </div>

                {ind.note && (
                  <p className="border-t border-rule/70 pt-3 text-xs leading-relaxed text-ink-2">
                    {ind.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Summary Dashboard Tab                                            */
/* ------------------------------------------------------------------ */

function DashboardTab({ data }) {
  const entries = Object.entries(data || {}).filter(
    ([key, value]) =>
      !["note", "is_demo", "organization"].includes(key) &&
      (typeof value === "number" || typeof value === "string")
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading note={data?.note}>
        {data?.organization ? `${data.organization} Executive Summary` : "Organization Summary"}
      </SectionHeading>

      {entries.length === 0 ? (
        <EmptyState
          title="No summary figures"
          message="The backend returned no summary telemetry for this organization."
        />
      ) : (
        <div className="grid grid-cols-2 gap-6 rounded-3xl border border-blue-200 bg-blue-50/70 p-7 sm:grid-cols-3 shadow-subtle">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-rule bg-white p-5 shadow-xs">
              <Stat value={renderValue(value)} label={humanizeKey(key)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section Loader                                                      */
/* ------------------------------------------------------------------ */

function VaultSection({ section }) {
  if (section === "intelligence") {
    return <KnowledgeIntelligence />;
  }

  const { data, loading, error, reload } = useApi(
    () => api.organizationSection(section),
    [section]
  );

  if (loading) {
    return <LoadingState message={`Loading ${section} knowledge records…`} rows={3} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const payload = data?.data;
  const isList = Array.isArray(payload);

  if ((isList && payload.length === 0) || (!isList && !payload)) {
    return (
      <EmptyState
        title="No records found in this section"
        message={`Your organization has no ${section} data recorded yet in WisdomKernel.`}
      />
    );
  }

  switch (section) {
    case "vault":
      return <VaultTab items={payload} />;
    case "onboarding":
      return <OnboardingTab items={payload} />;
    case "troubleshooting":
      return <TroubleshootingTab items={payload} />;
    case "postmortems":
      return <PostmortemsTab items={payload} />;
    case "retirement":
      return <RetirementTab items={payload} />;
    case "kri":
      return <KriTab data={payload} />;
    case "dashboard":
      return <DashboardTab data={payload} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main Page Component                                                 */
/* ------------------------------------------------------------------ */

export default function OrganizationVault() {
  const { organization, logout } = useAuth();
  const [active, setActive] = useState("intelligence");


  const activeTab = useMemo(() => TABS.find((tab) => tab.id === active), [active]);

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title={organization?.name ? `${organization.name} Vault` : "Organization Knowledge Vault"}
        description="Private institutional repository: onboarding paths, troubleshooting runbooks, internal post-mortems, and retirement knowledge transfer telemetry."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Organization", to: "/organization" },
          { label: "Vault" },
        ]}
        actions={
          <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        }
      />

      {/* Vault Sub-Tabs Bar: White & Blue Active Pills */}
      <div className="border-b border-rule pb-2">
        <div
          role="tablist"
          aria-label="Vault Sections"
          className="no-scrollbar flex gap-2 overflow-x-auto py-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActive(id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-xs border border-blue-600"
                    : "border border-blue-200 bg-white text-navy hover:bg-blue-50"
                }`}
              >
                <Icon size={15} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Panel */}
      <div id="vault-panel" role="tabpanel" aria-label={activeTab?.label}>
        <VaultSection section={active} />
      </div>
    </div>
  );
}
