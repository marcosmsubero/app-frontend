function RoleBadge({ role }) {
  const map = {
    owner: "👑 Owner",
    mod: "🛠 Admin",
    member: "👤 Miembro",
  };
  return <span className="badge">{map[role] || role}</span>;
}

export default function GroupList({
  isAuthed,
  groups = [],
  loadingGroups,
  onLoadGroups,
  onOpenGroup,
}) {
  const safeGroups = Array.isArray(groups) ? groups : [];

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      {/* Header (si lo quieres aquí también) */}
      {!isAuthed && (
        <p className="muted">
          Inicia sesión para ver y unirte a grupos.
        </p>
      )}

      <hr className="hr" />

      {loadingGroups && <p className="muted">Cargando grupos…</p>}

      {!loadingGroups && safeGroups.length === 0 && (
        <p className="muted">No hay grupos todavía.</p>
      )}

      <div className="stack">
        {safeGroups.map((g) => {
          const isMember = !!g.my_role;
          const isPrivate = !!g.is_private;
          const membersCount =
            g.members_count ?? g.member_count ?? g.membersCount ?? g.memberCount ?? "—";

          let label = "Unirme →";
          let disabled = false;

          if (isMember) {
            label = "Entrar →";
          } else if (isPrivate) {
            label = "Invitación 🔒";
            disabled = true;
          }

          return (
            <div
              key={g.id}
              className="stack"
              style={{
                padding: 14,
                borderRadius: 8,
                background: "#1e1e1e",
                opacity: disabled ? 0.75 : 1,
              }}
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <strong>{g.name}</strong>
                  {isMember && <RoleBadge role={g.my_role} />}
                </div>

                <span className="badge">{isPrivate ? "Privado" : "Público"}</span>
              </div>

              <div className="small-muted">
                🏙 {g.city} · 🏃 {g.sport} · 👥 {membersCount}
              </div>

              <button
                className="link-btn"
                disabled={disabled || !onOpenGroup}
                onClick={() => !disabled && onOpenGroup?.(g)}
              >
                {label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}