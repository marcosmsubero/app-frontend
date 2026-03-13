import clsx from "clsx";

function Card({
  as: Component = "section",
  className = "",
  children,
  compact = false,
  interactive = false,
  ...props
}) {
  return (
    <Component
      className={clsx(
        "ui-card",
        compact && "ui-card--compact",
        interactive && "ui-card--interactive",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={clsx("ui-card__header", className)} {...props}>
      {children}
    </Component>
  );
}

export function CardBody({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={clsx("ui-card__body", className)} {...props}>
      {children}
    </Component>
  );
}

export function CardFooter({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={clsx("ui-card__footer", className)} {...props}>
      {children}
    </Component>
  );
}

export default Card;
