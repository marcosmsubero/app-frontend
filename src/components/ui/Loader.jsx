function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Loader({
  label = "Cargando...",
  centered = false,
  block = false,
  className = "",
}) {
  return (
    <div
      className={joinClasses(
        "ui-loader",
        centered && "ui-loader--center",
        block && "ui-loader--block",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="ui-loader__spinner" aria-hidden="true" />
      {label ? <span className="ui-loader__label">{label}</span> : null}
    </div>
  );
}
