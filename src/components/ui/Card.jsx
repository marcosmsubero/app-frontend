function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Card({
  as: Component = "section",
  className = "",
  children,
  interactive = false,
  compact = false,
  ...props
}) {
  const classes = joinClasses(
    "ui-card",
    interactive && "ui-card--interactive",
    compact && "ui-card--compact",
    className
  );

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={joinClasses("ui-card__header", className)} {...props}>
      {children}
    </Component>
  );
}

export function CardBody({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={joinClasses("ui-card__body", className)} {...props}>
      {children}
    </Component>
  );
}

export function CardFooter({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={joinClasses("ui-card__footer", className)} {...props}>
      {children}
    </Component>
  );
}
