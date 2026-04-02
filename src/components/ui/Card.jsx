function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function Card({
  as: Component = "article",
  interactive = false,
  tone = "default",
  padding = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={joinClasses(
        "ui-card",
        `ui-card--${tone}`,
        `ui-card--pad-${padding}`,
        interactive ? "ui-card--interactive" : "",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  className = "",
  stacked = false,
  children,
  ...props
}) {
  return (
    <div
      className={joinClasses(
        "ui-card__header",
        stacked ? "ui-card__header--stacked" : "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardEyebrow({ className = "", children, ...props }) {
  return (
    <p className={joinClasses("ui-card__eyebrow", className)} {...props}>
      {children}
    </p>
  );
}

export function CardTitle({
  as: Component = "h3",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={joinClasses("ui-card__title", className)} {...props}>
      {children}
    </Component>
  );
}

export function CardDescription({ className = "", children, ...props }) {
  return (
    <p className={joinClasses("ui-card__description", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={joinClasses("ui-card__content", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children, ...props }) {
  return (
    <div className={joinClasses("ui-card__content", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  align = "start",
  children,
  ...props
}) {
  return (
    <div
      className={joinClasses("ui-card__footer", `ui-card__footer--${align}`, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
