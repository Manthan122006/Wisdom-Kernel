/**
 * OrganizationVault.jsx
 * ---------------------
 * The protected organization workspace. Seven tabs, each calling its own
 * backend endpoint and holding its own loading, error and empty state.
 *
 * DATA INTEGRITY NOTE
 * Every figure here is either returned by the backend or counted directly
 * from the records it returned. Where the backend does not yet expose a
 * measure, the page says so instead of inventing a number.
 */

import { useMemo, useState } from "react";
import {
  Building2,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserMinus,
  Wrench,
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

const TABS = [
  { id: "vault", label: "Vault", icon: ShieldCheck },
  { id: "onboarding", label: "Onboarding", icon: GraduationCap },
  { id: "troubleshooting", label: "Troubleshooting", icon: Wrench },
  { id: "postmortems", label: "Post-Mortems", icon: FileWarning },
  { id: "retirement", label: "Retirement", icon: UserMinus },
  { id: "kri", label: "KRI", icon: Building2 },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const RISK_TONE = { high: "wrong", medium: "caution", low: "correct" };

/** Shown when the backend does not provide a measure the tab would like. */
function NotTracked({ children }) {
  return (
    <p className="mt-3 rounded-md border border-rule bg-paper px-3.5 py-2.5 text-xs leading-relaxed text-ink-3">
      {children}
    </p>
  );
}

function SectionHeading({ children, note }) {
  return (
    <div className="mb-4">
      <h2 className="text-heading text-ink">{children}</h2>
      {note && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">{note}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab renderers                                                       */
/* ------------------------------------------------------------------ */

function VaultTab({ items }) {
  const restricted = items.filter((item) => item.confidentiality === "restricted").length;
  const recent = [...items].sort((a, b) =>
    String(b.last_updated || "").localeCompare(String(a.last_updated || ""))
  );

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-6 rounded-lg border border-rule bg-surface p-6 sm:grid-cols-3">
        <Stat value={items.length} label="Knowledge items" />
        <Stat value={restricted} label="Restricted access" tone={restricted > 0 ? "wrong" : "ink"} />
        <Stat value={items.length - restricted} label="Internal access" />
      </div>

      <SectionHeading note="Ordered by when each item was last updated.">
        Recent knowledge
      </SectionHeading>

      <ul className="divide-y divide-rule border-y border-rule">
        {recent.map((item) => (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[0.9375rem] font-medium text-ink">{item.title}</h3>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-2">
                  {item.summary}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {item.category && <Badge>{item.category}</Badge>}
                {item.confidentiality && (
                  <Badge tone={item.confidentiality === "restricted" ? "wrong" : "neutral"}>
                    {item.confidentiality}
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-3">
              {item.owner && `Owner: ${item.owner}`}
              {item.owner && item.last_updated && " · "}
              {item.last_updated && `Updated ${formatDate(item.last_updated)}`}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

function OnboardingTab({ items }) {
  const sorted = [...items].sort((a, b) => (a.week || 0) - (b.week || 0));
  const lastWeek = sorted.length > 0 ? sorted[sorted.length - 1].week : null;

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-6 rounded-lg border border-rule bg-surface p-6 sm:grid-cols-3">
        <Stat value={sorted.length} label="Onboarding modules" />
        <Stat value={lastWeek ? `${lastWeek} weeks` : "—"} label="Programme length" />
        <div>
          <p className="font-mono text-2xl tabular-nums text-ink-3">—</p>
          <p className="mt-1 text-sm text-ink-2">Completed tasks</p>
          <p className="mt-0.5 text-xs text-ink-3">Not tracked yet</p>
        </div>
      </div>

      <NotTracked>
        Per-engineer completion and time to productivity are not part of the current API. They are
        left blank rather than estimated. See "Suggested backend additions" in the README.
      </NotTracked>

      <div className="mt-8">
        <SectionHeading>Programme</SectionHeading>

        <ol className="space-y-4">
          {sorted.map((item) => (
            <li key={item.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-royal">Week {item.week}</p>
                    <h3 className="mt-1 font-serif text-lg text-ink">{item.title}</h3>
                    <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
                      {item.objective}
                    </p>
                  </div>
                  {item.mentor && <Badge tone="royal">Mentor: {item.mentor}</Badge>}
                </div>

                {item.resources?.length > 0 && (
                  <p className="mt-4 border-t border-rule pt-3 text-sm text-ink-2">
                    Resources: {item.resources.join(", ")}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function TroubleshootingTab({ items }) {
  return (
    <>
      <SectionHeading note="Symptom-driven guides written from incidents this organization has already worked through.">
        Past incidents
      </SectionHeading>

      <div className="space-y-5">
        {items.map((item) => (
          <Card key={item.id} as="article" className="overflow-hidden">
            <header className="border-b border-rule bg-paper px-5 py-4">
              <h3 className="text-label font-medium uppercase tracking-wide text-ink-3">Symptom</h3>
              <p className="mt-1 font-serif text-lg text-ink">{item.symptom}</p>
            </header>

            <div className="grid gap-px bg-rule sm:grid-cols-2">
              {item.first_checks?.length > 0 && (
                <div className="bg-surface p-5">
                  <h4 className="text-label font-medium uppercase tracking-wide text-correct">
                    What to check first
                  </h4>
                  <ol className="mt-2 space-y-1.5">
                    {item.first_checks.map((check, index) => (
                      <li key={index} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                        <span className="font-mono text-xs text-ink-3">{index + 1}</span>
                        {check}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {item.common_causes?.length > 0 && (
                <div className="bg-surface p-5">
                  <h4 className="text-label font-medium uppercase tracking-wide text-ink-3">
                    Common causes
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {item.common_causes.map((cause, index) => (
                      <li key={index} className="text-[0.9375rem] leading-relaxed text-ink-2">
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {item.escalate_when && (
              <div className="border-t-2 border-caution bg-caution-tint px-5 py-4">
                <h4 className="text-label font-medium uppercase tracking-wide text-caution">
                  Escalate when
                </h4>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
                  {item.escalate_when}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function PostmortemsTab({ items }) {
  return (
    <>
      <SectionHeading note="Closed and open incident reviews belonging to this organization.">
        Post-mortems
      </SectionHeading>

      <div className="space-y-5">
        {items.map((item) => (
          <Card key={item.id} as="article" className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg leading-snug text-ink">{item.title}</h3>
                {item.date && <p className="mt-1 text-sm text-ink-3">{formatDate(item.date)}</p>}
              </div>
              {item.status && (
                <Badge tone={item.status === "closed" ? "correct" : "caution"}>{item.status}</Badge>
              )}
            </div>

            <dl className="mt-5 space-y-4 border-t border-rule pt-4">
              {item.impact && (
                <div>
                  <dt className="text-label font-medium uppercase tracking-wide text-ink-3">
                    Impact
                  </dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{item.impact}</dd>
                </div>
              )}

              {item.root_cause && (
                <div>
                  <dt className="text-label font-medium uppercase tracking-wide text-wrong">
                    Root cause
                  </dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
                    {item.root_cause}
                  </dd>
                </div>
              )}

              {item.corrective_actions?.length > 0 && (
                <div className="border-l-2 border-royal pl-3">
                  <dt className="text-label font-medium uppercase tracking-wide text-royal">
                    What changed afterwards
                  </dt>
                  <dd className="mt-1.5">
                    <ul className="space-y-1.5">
                      {item.corrective_actions.map((action, index) => (
                        <li key={index} className="text-[0.9375rem] leading-relaxed text-ink">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}

function RetirementTab({ items }) {
  const totalRecorded = items.reduce((sum, item) => sum + (item.sessions_recorded || 0), 0);
  const totalTarget = items.reduce((sum, item) => sum + (item.sessions_target || 0), 0);
  const overall = totalTarget > 0 ? Math.round((totalRecorded / totalTarget) * 100) : 0;

  return (
    <>
      <div className="mb-8 rounded-lg border border-rule bg-surface p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <Stat value={items.length} label="Engineers at risk" tone={items.length > 0 ? "wrong" : "ink"} />
          <Stat value={`${totalRecorded}/${totalTarget}`} label="Sessions recorded" />
          <Stat value={`${overall}%`} label="Capture progress" tone="royal" />
        </div>

        <div className="mt-6">
          <ProgressBar
            value={totalRecorded}
            max={totalTarget || 1}
            label="Knowledge capture across the register"
            valueLabel={`${overall}%`}
            tone={overall >= 70 ? "correct" : overall >= 40 ? "caution" : "wrong"}
          />
        </div>
      </div>

      <SectionHeading note="Counts come from the sessions recorded against each engineer's target.">
        Knowledge at risk
      </SectionHeading>

      <div className="space-y-5">
        {items.map((item) => {
          const recorded = item.sessions_recorded || 0;
          const target = item.sessions_target || 0;
          const percent = target > 0 ? Math.round((recorded / target) * 100) : 0;

          return (
            <Card key={item.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg text-ink">{item.engineer}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {item.role}
                    {item.years_experience != null && ` · ${item.years_experience} years`}
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
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.critical_knowledge_areas.map((area) => (
                    <Badge key={area} tone="royal">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-rule pt-4">
                <ProgressBar
                  value={recorded}
                  max={target || 1}
                  label="Sessions captured"
                  valueLabel={`${recorded} of ${target}`}
                  tone={percent >= 70 ? "correct" : percent >= 40 ? "caution" : "wrong"}
                />
              </div>

              {item.successor && (
                <p className="mt-4 text-sm text-ink-2">Successor: {item.successor}</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function KriTab({ data }) {
  const indicators = data?.indicators || [];

  return (
    <>
      <SectionHeading note={data?.description}>Knowledge risk indicators</SectionHeading>

      {indicators.length === 0 ? (
        <EmptyState
          title="No indicators returned"
          message="The backend has no knowledge risk indicators for this organization."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {indicators.map((indicator) => (
            <Card key={indicator.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[0.9375rem] font-medium leading-snug text-ink">
                  {indicator.name}
                </h3>
                {indicator.risk_level && (
                  <Badge tone={RISK_TONE[indicator.risk_level] || "neutral"}>
                    {indicator.risk_level}
                  </Badge>
                )}
              </div>

              <p className="mt-4 font-mono text-4xl tabular-nums text-ink">
                {indicator.value}
                {indicator.unit === "percent" && (
                  <span className="ml-0.5 text-2xl text-ink-3">%</span>
                )}
              </p>
              {indicator.unit && indicator.unit !== "percent" && (
                <p className="mt-0.5 text-sm text-ink-3">{indicator.unit}</p>
              )}

              {indicator.unit === "percent" && (
                <div className="mt-4">
                  <ProgressBar
                    value={indicator.value}
                    max={100}
                    size="sm"
                    tone={RISK_TONE[indicator.risk_level] === "wrong" ? "wrong" : "royal"}
                    label={undefined}
                  />
                </div>
              )}

              {indicator.note && (
                <p className="mt-4 flex-1 border-t border-rule pt-3 text-sm leading-relaxed text-ink-2">
                  {indicator.note}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function DashboardTab({ data }) {
  // Rendered generically from whatever the backend returns, so no label
  // on this page can drift away from the actual API response.
  const entries = Object.entries(data || {}).filter(
    ([key, value]) =>
      !["note", "is_demo", "organization"].includes(key) &&
      (typeof value === "number" || typeof value === "string")
  );

  return (
    <>
      <SectionHeading note={data?.note}>
        {data?.organization ? `${data.organization} at a glance` : "Organization summary"}
      </SectionHeading>

      {entries.length === 0 ? (
        <EmptyState
          title="No summary available"
          message="The backend returned no dashboard figures for this organization."
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 rounded-lg border border-rule bg-surface p-6 sm:grid-cols-3">
          {entries.map(([key, value]) => (
            <Stat key={key} value={renderValue(value)} label={humanizeKey(key)} />
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section loader — one request per tab, with its own states           */
/* ------------------------------------------------------------------ */

function VaultSection({ section }) {
  const { data, loading, error, reload } = useApi(() => api.organizationSection(section), [section]);

  if (loading) {
    return <LoadingState message={`Loading ${section}…`} rows={2} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const payload = data?.data;
  const isList = Array.isArray(payload);

  if ((isList && payload.length === 0) || (!isList && !payload)) {
    return (
      <EmptyState
        title="Nothing recorded here yet"
        message={`Your organization has no ${section} records in WisdomKernel.`}
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function OrganizationVault() {
  const { organization, logout } = useAuth();
  const [active, setActive] = useState("vault");

  const activeTab = useMemo(() => TABS.find((tab) => tab.id === active), [active]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={organization?.name || "Organization vault"}
        description="Private knowledge belonging to this organization. Only signed-in members of this organization can read it."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Organization", to: "/organization" },
          { label: "Vault" },
        ]}
        actions={
          <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
            Sign out
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-8 -mx-5 overflow-x-auto border-b border-rule px-5 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Vault sections" className="flex min-w-max gap-1 pb-px">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls="vault-panel"
                onClick={() => setActive(id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[0.9375rem] transition-colors duration-150 ${
                  isActive
                    ? "border-royal font-medium text-royal"
                    : "border-transparent text-ink-2 hover:border-rule-strong hover:text-ink"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div id="vault-panel" role="tabpanel" aria-label={activeTab?.label}>
        <VaultSection section={active} />
      </div>
    </div>
  );
}
