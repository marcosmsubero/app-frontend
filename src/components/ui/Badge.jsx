function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Badge({
  children,
  variant = "neutral",
  className = "",
  as: Component = "span",
  ...props
}) {
  return (
    <Component
      className={joinClasses("ui-badge", `ui-badge--${variant}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
