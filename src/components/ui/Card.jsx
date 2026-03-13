function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function Card({
  as: Component = "article",
  interactive = false,
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={joinClasses(
        "ui-card",
        interactive ? "ui-card--interactive" : "",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={joinClasses("ui-card__header", className)} {...props}>
      {children}
    </div>
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

export function CardFooter({ className = "", children, ...props }) {
  return (
    <div className={joinClasses("ui-card__footer", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
