function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = "",
  contentClassName = "",
}) {
  return (
    <div className={joinClasses("ui-section-header", className)}>
      <div className={joinClasses("ui-section-header__content", contentClassName)}>
        {eyebrow ? <p className="ui-section-header__eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="ui-section-header__title">{title}</h2> : null}
        {description ? (
          <p className="ui-section-header__description">{description}</p>
        ) : null}
      </div>

      {action ? <div className="ui-section-header__action">{action}</div> : null}
    </div>
  );
}
