function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Textarea({
  label,
  hint,
  error,
  className = "",
  textareaClassName = "",
  id,
  rows = 5,
  ...props
}) {
  const generatedId =
    id || props.name || `textarea-${Math.random().toString(36).slice(2, 10)}`;

  return (
    <div className={joinClasses("ui-field", error && "ui-field--error", className)}>
      {label ? (
        <label className="ui-field__label" htmlFor={generatedId}>
          {label}
        </label>
      ) : null}

      <textarea
        id={generatedId}
        rows={rows}
        className={joinClasses("ui-textarea", textareaClassName)}
        {...props}
      />

      {error ? <p className="ui-field__error">{error}</p> : null}
      {!error && hint ? <p className="ui-field__hint">{hint}</p> : null}
    </div>
  );
}
