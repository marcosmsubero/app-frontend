import Button from "./Button";

export default function EmptyState({
  icon = "✦",
  title = "Nada por aquí todavía",
  description,
  text,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  className = "",
}) {
  const resolvedDescription =
    description || text || "Todavía no hay contenido disponible para mostrar.";

  return (
    <div className={`ui-empty-state ${className}`.trim()}>
      <div className="ui-empty-state__icon" aria-hidden="true">
        <span>{icon}</span>
      </div>

      <div className="ui-stack-xs">
        <h3 className="ui-empty-state__title">{title}</h3>
        <p className="ui-empty-state__description">{resolvedDescription}</p>
      </div>

      {(actionLabel || secondaryActionLabel || children) && (
        <div className="ui-empty-state__actions">
          {actionLabel ? (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}

          {secondaryActionLabel ? (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}

          {children}
        </div>
      )}
    </div>
  );
}
