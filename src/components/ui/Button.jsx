function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const VARIANT_CLASS = {
  primary: "app-button--primary",
  secondary: "app-button--secondary",
  ghost: "app-button--ghost",
  danger: "app-button--danger",
};

const SIZE_CLASS = {
  sm: "app-button--sm",
  md: "",
  lg: "app-button--lg",
};

export default function Button({
  as: Component = "button",
  type = "button",
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  children,
  ...props
}) {
  const classes = joinClasses(
    "app-button",
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || "",
    block ? "app-button--block" : "",
    className,
  );

  if (Component === "button") {
    return (
      <button type={type} className={classes} {...props}>
        {children}
      </button>
    );
  }

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
