function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Input({
  label,
  hint,
  error,
  className = "",
  inputClassName = "",
  id,
  ...props
}) {
  const generatedId =
    id || props.name || `input-${Math.random().toString(36).slice(2, 10)}`;

  return (
    <div className={joinClasses("ui-field", error && "ui-field--error", className)}>
      {label ? (
        <label className="ui-field__label" htmlFor={generatedId}>
          {label}
        </label>
      ) : null}

      <input id={generatedId} className={joinClasses("ui-input", inputClassName)} {...props} />

      {error ? <p className="ui-field__error">{error}</p> : null}
      {!error && hint ? <p className="ui-field__hint">{hint}</p> : null}
    </div>
  );
}
