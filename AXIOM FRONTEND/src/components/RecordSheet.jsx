/**
 * RecordSheet.jsx
 * ---------------
 * The product's signature layout: a ruled field list with a fixed label
 * column, modelled on an engineering incident report form.
 *
 * It is used anywhere a structured experience is shown — the extraction
 * result, the search detail view, and the mistakes library — so the same
 * knowledge always reads the same way.
 *
 * A field the speaker never covered renders as "Not covered in this
 * recording", never as blank space and never filled in by the frontend.
 */

import { renderValue } from "../utils/format";

/**
 * @param {{label: string, value: any, emphasis?: boolean, emptyText?: string}[]} fields
 */
export default function RecordSheet({ fields, className = "", emptyText }) {
  const visible = fields.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <dl className={`record-sheet ${className}`}>
      {visible.map((field) => {
        const text = renderValue(field.value);
        const missing = text === null;

        return (
          <div key={field.label} className="record-row">
            <dt className="record-label">{field.label}</dt>
            <dd
              className={
                missing
                  ? "record-value-empty"
                  : field.emphasis
                    ? "record-value font-medium text-ink"
                    : "record-value"
              }
            >
              {missing ? field.emptyText || emptyText || "Not recorded" : text}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * The nine canonical WisdomKernel fields, in the order the backend
 * defines them. "Lesson" is emphasised because it is the transferable part.
 */
export const EXPERIENCE_FIELDS = [
  { key: "problem", label: "Problem" },
  { key: "context", label: "Context" },
  { key: "decision", label: "Decision" },
  { key: "reasoning", label: "Reasoning" },
  { key: "mistake", label: "Mistake" },
  { key: "root_cause", label: "Root cause" },
  { key: "outcome", label: "Outcome" },
  { key: "lesson", label: "Lesson", emphasis: true },
  { key: "what_i_wish_i_knew", label: "What I wish I knew" },
];

/** Maps a backend experience object onto the sheet's field list. */
export function experienceToFields(experience, emptyText) {
  if (!experience) return [];
  return EXPERIENCE_FIELDS.map((field) => ({
    label: field.label,
    value: experience[field.key],
    emphasis: field.emphasis,
    emptyText,
  }));
}
