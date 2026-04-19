/**
 * Loading placeholder. Renders a muted shape that shimmers so the user
 * perceives the app as responsive while data is in flight. Replaces
 * blank screens and long spinners.
 *
 * Variants:
 *  - line: a rectangular block (default); `width`/`height` configurable.
 *  - circle: round shape, e.g. avatars; pass `size`.
 *  - row: an icon + two lines of text, common for list pages.
 */

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Skeleton({
  variant = "line",
  width,
  height,
  size,
  radius,
  className = "",
  style,
  ...props
}) {
  if (variant === "row") {
    return <SkeletonRow className={className} {...props} />;
  }

  if (variant === "circle") {
    const s = size || 40;
    return (
      <span
        className={joinClasses("ui-skeleton", "ui-skeleton--circle", className)}
        style={{ width: s, height: s, ...style }}
        aria-hidden="true"
        {...props}
      />
    );
  }

  return (
    <span
      className={joinClasses("ui-skeleton", "ui-skeleton--line", className)}
      style={{
        width: width || "100%",
        height: height || 14,
        borderRadius: radius || 8,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonRow({ className = "" }) {
  return (
    <div className={joinClasses("ui-skeleton-row", className)} aria-hidden="true">
      <Skeleton variant="circle" size={40} />
      <div className="ui-skeleton-row__copy">
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
  );
}
