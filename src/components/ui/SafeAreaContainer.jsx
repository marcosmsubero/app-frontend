/**
 * Wrapper that applies `env(safe-area-inset-*)` padding on the edges the
 * caller opts into. Use it on any fixed element (composers, floating
 * action bars, sheets) so content never sits on the iOS notch or home
 * indicator.
 *
 * Edges are opt-in: pass the edges you want padded — by default no
 * padding is applied so the wrapper can be layered inside existing
 * layouts without breaking them.
 */

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function SafeAreaContainer({
  as: Component = "div",
  top = false,
  bottom = false,
  left = false,
  right = false,
  minTop = 0,
  minBottom = 0,
  className = "",
  children,
  style,
  ...props
}) {
  const safeStyle = {
    ...(top ? { paddingTop: `max(${minTop}px, env(safe-area-inset-top))` } : null),
    ...(bottom
      ? { paddingBottom: `max(${minBottom}px, env(safe-area-inset-bottom))` }
      : null),
    ...(left ? { paddingLeft: "env(safe-area-inset-left)" } : null),
    ...(right ? { paddingRight: "env(safe-area-inset-right)" } : null),
    ...style,
  };

  return (
    <Component
      className={joinClasses("ui-safe-area", className)}
      style={safeStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
