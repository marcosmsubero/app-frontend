/**
 * AvatarStack — overlapping avatar row with optional "+N" count.
 *
 * Uses the `.avatar-stack` / `.avatar-stack__count` utility classes
 * defined in app.css (micro-interaction layer).
 *
 * Props
 * ─────
 *  users       Array<{ avatar_url?, display_name?, id }>  (required)
 *  max         number   — visible avatars before "+N" (default 3)
 *  size        number   — avatar diameter in px (default 28)
 *  className   string   — extra class on the wrapper
 *  onClickMore function — fires when "+N" pill is tapped
 */
export default function AvatarStack({
  users = [],
  max = 3,
  size = 28,
  className = "",
  onClickMore,
}) {
  if (!users.length) return null;

  const visible = users.slice(0, max);
  const remaining = users.length - max;

  function initials(name = "") {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("");
  }

  return (
    <div className={`avatar-stack ${className}`.trim()}>
      {visible.map((user, i) => {
        const key = user.id || user.user_id || i;
        const name = user.display_name || user.full_name || user.handle || "";
        const alt = name || "User";
        const dims = { width: size, height: size };

        const userInitials = initials(name);

        return user.avatar_url ? (
          <img
            key={key}
            src={user.avatar_url}
            alt={alt}
            className="avatar-stack__img"
            style={{ ...dims, objectFit: "cover", borderRadius: "999px" }}
          />
        ) : (
          <span
            key={key}
            className="avatar-stack__fallback"
            style={{
              ...dims,
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.08)",
              color: "var(--text-soft)",
              fontSize: `${Math.max(size * 0.38, 9)}px`,
              fontWeight: 700,
              lineHeight: 1,
            }}
            aria-label={alt}
          >
            {userInitials || (
              <svg
                viewBox="0 0 24 24"
                width="58%"
                height="58%"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.8 20c1.2-3.4 4.1-5.2 7.2-5.2S17.9 16.6 19.2 20" />
              </svg>
            )}
          </span>
        );
      })}

      {remaining > 0 ? (
        <span
          className="avatar-stack__count"
          style={{ height: size, minWidth: size }}
          role={onClickMore ? "button" : undefined}
          tabIndex={onClickMore ? 0 : undefined}
          onClick={onClickMore}
          onKeyDown={
            onClickMore
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClickMore();
                  }
                }
              : undefined
          }
        >
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
