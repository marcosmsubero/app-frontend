/**
 * A list row with three slots: leading icon/avatar, copy (title + text),
 * and trailing content (chevron, count, action). Minimum tap height of
 * 56px so every row clears the WCAG 2.5.5 target. If the row is
 * interactive, pass `to` (React Router link) or `onClick`.
 *
 * Intentionally no internal state — keep it a presentational component
 * so it composes into any list.
 */

import { Link } from "react-router-dom";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ListItem({
  leading,
  title,
  text,
  trailing,
  to,
  onClick,
  as,
  dense = false,
  className = "",
  children,
  ...props
}) {
  const resolvedAs = as || (to ? Link : onClick ? "button" : "div");
  const isInteractive = resolvedAs !== "div";

  const interactiveProps = {};
  if (resolvedAs === Link) interactiveProps.to = to;
  if (resolvedAs === "button") {
    interactiveProps.type = "button";
    interactiveProps.onClick = onClick;
  }

  const Component = resolvedAs;

  return (
    <Component
      className={joinClasses(
        "ui-list-item",
        isInteractive ? "ui-list-item--interactive" : "",
        dense ? "ui-list-item--dense" : "",
        className
      )}
      {...interactiveProps}
      {...props}
    >
      {leading != null ? (
        <span className="ui-list-item__leading">{leading}</span>
      ) : null}

      <span className="ui-list-item__copy">
        {title != null ? <span className="ui-list-item__title">{title}</span> : null}
        {text != null ? <span className="ui-list-item__text">{text}</span> : null}
        {children}
      </span>

      {trailing != null ? (
        <span className="ui-list-item__trailing">{trailing}</span>
      ) : null}
    </Component>
  );
}
