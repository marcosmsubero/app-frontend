import { Link } from "react-router-dom";

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

/**
 * A small inline person icon used as the fallback when a user has no
 * photo AND we cannot derive initials. Scales via `currentColor`.
 */
function PersonGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="58%"
      height="58%"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c1.2-3.4 4.1-5.2 7.2-5.2S17.9 16.6 19.2 20" />
    </svg>
  );
}

/**
 * Round avatar primitive. Always a perfect circle via CSS.
 *
 * Props:
 *  - src, alt, name, size: visual content
 *  - profileId: if provided, the avatar is wrapped in a Link to the
 *    owner's profile page; any tap anywhere on the avatar navigates there.
 *  - onClick: optional handler used instead of navigation (e.g. opening
 *    a viewer for the current user's own avatar).
 */
export default function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  className = "",
  showStatus = false,
  statusLabel = "online",
  profileId,
  onClick,
}) {
  const initials = getInitials(name);
  const label = alt || name || "Avatar";

  const content = (
    <>
      {src ? (
        <img src={src} alt={label} />
      ) : initials ? (
        <span className="ui-avatar__initials">{initials}</span>
      ) : (
        <span className="ui-avatar__glyph" aria-hidden="true">
          <PersonGlyph />
        </span>
      )}
      {showStatus ? (
        <span className="ui-avatar__status" aria-label={statusLabel} title={statusLabel} />
      ) : null}
    </>
  );

  const sharedProps = {
    className: joinClasses(
      "ui-avatar",
      `ui-avatar--${size}`,
      (profileId != null || onClick) ? "ui-avatar--interactive" : "",
      className
    ),
    "aria-label": label,
    title: name || alt || undefined,
  };

  if (profileId != null) {
    return (
      <Link to={`/perfil/${profileId}`} {...sharedProps}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} {...sharedProps}>
        {content}
      </button>
    );
  }

  return <span {...sharedProps}>{content}</span>;
}
