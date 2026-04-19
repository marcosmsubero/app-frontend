/**
 * Numeric display that uses tabular figures so the width doesn't jitter
 * as the value grows (100 → 1,000 → 10,000). Used for follower counts,
 * stats, timers, and anywhere digits change in place.
 */

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function formatNumber(value, locale) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(locale || undefined);
}

export default function Counter({
  value,
  locale,
  format,
  size = "md",
  weight = "bold",
  className = "",
  as: Component = "span",
  ...props
}) {
  const text = typeof format === "function" ? format(value) : formatNumber(value, locale);

  return (
    <Component
      className={joinClasses(
        "ui-counter",
        `ui-counter--${size}`,
        `ui-counter--${weight}`,
        className
      )}
      {...props}
    >
      {text}
    </Component>
  );
}
