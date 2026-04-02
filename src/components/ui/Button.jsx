function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const VARIANT_CLASS = {
  primary: "app-button--primary",
  brand: "app-button--primary",
  secondary: "app-button--secondary",
  ghost: "app-button--ghost",
  danger: "app-button--danger",
};

const SIZE_CLASS = {
  sm: "app-button--sm",
  md: "app-button--md",
  lg: "app-button--lg",
};

export default function Button({
  as: Component = "button",
  type = "button",
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  iconOnly = false,
  leadingIcon = null,
  trailingIcon = null,
  className = "",
  disabled,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  const classes = joinClasses(
    "app-button",
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    block ? "app-button--block" : "",
    iconOnly ? "app-button--icon-only" : "",
    loading ? "is-loading" : "",
    className,
  );

  const content = (
    <>
      {loading ? <span className="app-button__spinner" aria-hidden="true" /> : null}

      {!loading && leadingIcon ? (
        <span className="app-button__icon app-button__icon--leading" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}

      {!iconOnly ? <span className="app-button__label">{children}</span> : null}

      {!loading && trailingIcon && !iconOnly ? (
        <span className="app-button__icon app-button__icon--trailing" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}

      {iconOnly && !loading ? (
        <span className="app-button__icon" aria-hidden="true">
          {leadingIcon || trailingIcon || children}
        </span>
      ) : null}
    </>
  );

  if (Component === "button") {
    return (
      <button
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <Component
      className={classes}
      aria-disabled={isDisabled ? "true" : undefined}
      {...props}
    >
      {content}
    </Component>
  );
}
