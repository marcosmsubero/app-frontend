/**
 * UrgencyBadge — colour-coded pill for social proof / scarcity.
 *
 * Uses the `.urgency-badge` utility classes defined in app.css.
 *
 * Variants
 * ────────
 *  "hot"   — red, for "1 spot left!" / "Sold out"
 *  "warm"  — amber, for "3 spots left"
 *  "open"  — green, for "Open" / "Plenty of room"
 *
 * Props
 * ─────
 *  variant   "hot" | "warm" | "open"  (default "open")
 *  icon      ReactNode (optional leading icon)
 *  children  label text
 *  className string
 */
export default function UrgencyBadge({
  variant = "open",
  icon,
  children,
  className = "",
}) {
  return (
    <span
      className={`urgency-badge urgency-badge--${variant} ${className}`.trim()}
    >
      {icon ? <span className="urgency-badge__icon">{icon}</span> : null}
      {children}
    </span>
  );
}
