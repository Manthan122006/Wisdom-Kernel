/**
 * Button.jsx
 * ----------
 * Centralized Button component adhering to strict hierarchy:
 * - PRIMARY: Blue background (#2563EB), white text
 * - SECONDARY: White background, blue border, blue text (#2563EB)
 * - TERTIARY / GHOST: Transparent background, dark text, subtle blue hover
 * - DANGER: Semantic red action
 */

import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-600/25 active:translate-y-0 font-semibold",
  secondary:
    "bg-white text-blue-600 border border-blue-500/40 shadow-subtle hover:bg-blue-50/80 hover:border-blue-600 hover:text-blue-700 hover:-translate-y-0.5 active:translate-y-0 font-semibold",
  ghost:
    "bg-transparent text-ink-2 border border-transparent hover:bg-blue-50/80 hover:text-blue-600 font-medium",
  danger:
    "bg-white text-wrong border border-wrong/30 hover:bg-wrong-tint hover:border-wrong active:translate-y-0 font-semibold",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  icon: Icon,
  ...rest
}) {
  const classes = [
    "inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].join(" ");

  const content = (
    <>
      {Icon && !loading && <Icon size={16} aria-hidden="true" />}
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
