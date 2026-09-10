/**
 * Card.jsx / Badge
 * ----------------
 * Quiet containers. Borders carry the structure rather than shadows, so
 * the record sheet stays the loudest element on any page.
 */

export function Card({ children, className = "", as: Tag = "div", interactive = false, ...rest }) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-rule bg-surface-tint shadow-soft",
        interactive ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg hover:border-royal/25" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const BADGE_TONES = {
  neutral: "bg-paper text-ink-2 border-rule",
  royal: "bg-royal-tint text-royal-dark border-royal/20",
  correct: "bg-correct-tint text-correct border-correct/20",
  wrong: "bg-wrong-tint text-wrong border-wrong/20",
  caution: "bg-caution-tint text-caution border-caution/25",
};

export function Badge({ children, tone = "neutral", className = "", icon: Icon }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium",
        BADGE_TONES[tone] || BADGE_TONES.neutral,
        className,
      ].join(" ")}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Marks content that comes from the bundled fictional dataset.
 * Used wherever demo records are shown, so nothing is mistaken for
 * real production data.
 */
export function DemoBadge({ className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded border border-rule bg-paper px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-3",
        className,
      ].join(" ")}
      title="This record comes from the bundled demo dataset."
    >
      Demo data
    </span>
  );
}

export default Card;