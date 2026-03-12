function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Chip({
  children,
  active = false,
  size = "md",
  className = "",
  as: Component = "button",
  type = "button",
  ...props
}) {
  const classes = joinClasses(
    "ui-chip",
    `ui-chip--${size}`,
    active && "ui-chip--active",
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
