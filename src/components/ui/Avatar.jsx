function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  className = "",
  showStatus = false,
  statusLabel = "online",
}) {
  const initials = getInitials(name) || "?";

  return (
    <span
      className={joinClasses("ui-avatar", `ui-avatar--${size}`, className)}
      aria-label={alt || name || "Avatar"}
      title={name || alt || "Avatar"}
    >
      {src ? <img src={src} alt={alt || name || "Avatar"} /> : <span>{initials}</span>}
      {showStatus ? (
        <span className="ui-avatar__status" aria-label={statusLabel} title={statusLabel} />
      ) : null}
    </span>
  );
}
