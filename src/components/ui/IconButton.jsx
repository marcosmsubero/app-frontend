/**
 * A button whose visible surface is just an icon. Always provides a
 * 44×44 hit area (WCAG 2.5.5) even if the icon itself is smaller —
 * the extra space is transparent padding around the glyph.
 *
 * Must receive an `aria-label` because there is no visible text to
 * announce to screen readers.
 *
 * Variants:
 *  - ghost (default): transparent background, subtle hover highlight.
 *  - solid: filled surface — use when the button lives on a busy
 *    background and needs its own chip.
 *  - tonal: soft primary tint — use for sparingly-used accent actions
 *    (favourite, upvote).
 */

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const SIZE_CLASS = {
  sm: "ui-iconbtn--sm",
  md: "ui-iconbtn--md",
  lg: "ui-iconbtn--lg",
};

const VARIANT_CLASS = {
  ghost: "ui-iconbtn--ghost",
  solid: "ui-iconbtn--solid",
  tonal: "ui-iconbtn--tonal",
  danger: "ui-iconbtn--danger",
};

export default function IconButton({
  as: Component = "button",
  type = "button",
  variant = "ghost",
  size = "md",
  pressed = false,
  loading = false,
  disabled,
  className = "",
  children,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
  ...props
}) {
  const isDisabled = disabled || loading;

  if (import.meta.env.DEV && !ariaLabel) {
    // eslint-disable-next-line no-console
    console.warn("IconButton is missing aria-label — screen readers will not have a hint.");
  }

  return (
    <Component
      type={Component === "button" ? type : undefined}
      aria-label={ariaLabel}
      aria-disabled={isDisabled || undefined}
      aria-pressed={ariaPressed ?? (pressed || undefined)}
      aria-busy={loading || undefined}
      disabled={Component === "button" ? isDisabled : undefined}
      className={joinClasses(
        "ui-iconbtn",
        SIZE_CLASS[size] || SIZE_CLASS.md,
        VARIANT_CLASS[variant] || VARIANT_CLASS.ghost,
        pressed ? "is-pressed" : "",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="ui-iconbtn__spinner" aria-hidden="true" />
      ) : (
        <span className="ui-iconbtn__glyph" aria-hidden="true">
          {children}
        </span>
      )}
    </Component>
  );
}
