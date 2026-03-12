function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

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
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    block && "ui-button--block",
    className
  );

  if (Component !== "button") {
    return (
      <Component className={classes} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
