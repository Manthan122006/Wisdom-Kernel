/**
 * Button.jsx
 * ----------
 * One button component for the whole product, so every action looks and
 * behaves the same. Renders as <button> by default, or as a router link
 * when `to` is given, so a link that looks like a button is still a link.
 */

import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-royal text-white border border-royal hover:bg-royal-dark hover:border-royal-dark",
  secondary:
    "bg-white text-ink border border-rule-strong hover:border-ink-3 hover:bg-paper",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-paper hover:text-ink",
  danger: "bg-white text-wrong border border-wrong/30 hover:bg-wrong-tint",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-[0.9375rem] gap-2",
  lg: "px-5 py-3 text-base gap-2",
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
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-55",
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
