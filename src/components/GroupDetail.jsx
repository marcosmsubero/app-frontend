import MeetupCard from "./MeetupCard";

function parseStartsAt(startsAt) {
  if (!startsAt) return null;

  const hasTZ = /[zZ]$/.test(startsAt) || /[+-]\d{2}:\d{2}$/.test(startsAt);
  return new Date(hasTZ ? startsAt : `${startsAt}Z`);
}

function RoleBadge({ role }) {
  const map = { owner: "👑 Owner", mod: "🛠 Admin", member: "👤 Miembro" };
  return <span className="badge">{map[role] || "—"}</span>;
}

function confirmAction(msg, fn) {
  if (window.confirm(msg)) fn();
}

function startOfDay(d) {
  const x = d instanceof Date ? new Date(d) : parseStartsAt(d);
  if (!x || isNaN(x.getTime())) return new Date(NaN);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isFutureOrToday(dateStr) {
  const d = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return d >= today;
}

export default function GroupDetail({
  selectedGroup,
  myRole,
  loadingRole,
  isAuthed,
  onBack,

  // meetups
  meetups = [],
  loadingMeetups,
  onCreateMeetup,
  onJoinMeetup,
  onLeaveMeetup,
  onCancelMeetup,
  onDoneMeetup,

  // members
  members = [],
  loadingMembers,
  onSetRole,
  onKick,

  // invites
  invites = [],
  onCreateInvite,
  onRevokeInvite,

  // meetup form
  startsAt,
  setStartsAt,
  meetingPoint,
  setMeetingPoint,
  notes,
  setNotes,
  capacity,
  setCapacity,
}) {
  const isOwner = myRole === "owner";
  const isAdmin = myRole === "mod";
  const canCreateMeetup = isOwner || isAdmin;
  const canManageInvites = isOwner || isAdmin;

  const sortedMeetups = [...meetups].sort((a, b) => {
    const da = parseStartsAt(a.starts_at);
    const db = parseStartsAt(b.starts_at);
    return da - db;
  });

  // ✅ Backend: open/full/cancelled/done
  // Próximas = futuras + no canceladas + no hechas
  const upcomingMeetups = sortedMeetups.filter((m) => {
    const status = m.status || "open";
    const isVisible = status !== "cancelled" && status !== "done";
    return isVisible && isFutureOrToday(m.starts_at);
  });

  return (
    <div className="stack">
      <button onClick={onBack}>← Volver</button>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="m0">Grupo #{selectedGroup?.id}</h2>
        {loadingRole ? (
          <span className="small-muted">Cargando rol…</span>
        ) : myRole ? (
          <RoleBadge role={myRole} />
        ) : null}
      </div>

      {/* ======================
          Crear quedada
      ====================== */}
      <hr className="hr" />
      <h3>Crear quedada</h3>

      {canCreateMeetup ? (
        <div className="stack">
          <input
            type="datetime-local"
            value={startsAt || ""}
            onChange={(e) => setStartsAt?.(e.target.value)}
          />

          <input
            placeholder="Punto de encuentro"
            value={meetingPoint || ""}
            onChange={(e) => setMeetingPoint?.(e.target.value)}
          />

          <textarea
            placeholder="Notas"
            value={notes || ""}
            onChange={(e) => setNotes?.(e.target.value)}
          />

          <input
            type="number"
            placeholder="Capacidad (opcional)"
            value={capacity ?? ""}
            onChange={(e) => setCapacity?.(e.target.value)}
          />

          <button
            disabled={!startsAt || !meetingPoint}
            onClick={() => onCreateMeetup?.()}
          >
            Crear quedada
          </button>
        </div>
      ) : (
        <p className="muted">Solo admins u owners pueden crear quedadas</p>
      )}

      {/* ======================
          Próximas quedadas
      ====================== */}
      <hr className="hr" />
      <h3>Próximas quedadas</h3>

      {loadingMeetups && <p>Cargando…</p>}

      {!loadingMeetups && upcomingMeetups.length === 0 && (
        <p className="muted">No hay próximas quedadas</p>
      )}

      <div className="stack">
        {upcomingMeetups.map((m) => (
          <MeetupCard
            key={`up-${m.id}`}
            meetup={m}
            isAuthed={isAuthed}
            onJoin={onJoinMeetup ? () => onJoinMeetup(m.id) : null}
            onLeave={onLeaveMeetup ? () => onLeaveMeetup(m.id) : null}
            onCancel={
              onCancelMeetup && canCreateMeetup
                ? () =>
                    confirmAction("¿Cancelar quedada?", () =>
                      onCancelMeetup(m.id)
                    )
                : null
            }
            onDone={
              onDoneMeetup && canCreateMeetup
                ? () =>
                    confirmAction("¿Marcar como hecha?", () => onDoneMeetup(m.id))
                : null
            }
          />
        ))}
      </div>

      {/* ======================
          Todas las quedadas
      ====================== */}
      <hr className="hr" />
      <h3>Todas las quedadas</h3>

      {!loadingMeetups && sortedMeetups.length === 0 && (
        <p className="muted">No hay quedadas aún</p>
      )}

      <div className="stack">
        {sortedMeetups.map((m) => (
          <MeetupCard
            key={m.id}
            meetup={m}
            isAuthed={isAuthed}
            onJoin={onJoinMeetup ? () => onJoinMeetup(m.id) : null}
            onLeave={onLeaveMeetup ? () => onLeaveMeetup(m.id) : null}
            onCancel={
              onCancelMeetup && canCreateMeetup
                ? () =>
                    confirmAction("¿Cancelar quedada?", () =>
                      onCancelMeetup(m.id)
                    )
                : null
            }
            onDone={
              onDoneMeetup && canCreateMeetup
                ? () =>
                    confirmAction("¿Marcar como hecha?", () => onDoneMeetup(m.id))
                : null
            }
          />
        ))}
      </div>

      {/* ======================
          Invitaciones
      ====================== */}
      {canManageInvites && (
        <>
          <hr className="hr" />
          <h3>Invitaciones</h3>

          {onCreateInvite && (
            <button onClick={onCreateInvite}>➕ Crear invitación</button>
          )}

          {invites.length === 0 && (
            <p className="muted">No hay invitaciones activas</p>
          )}

          <ul className="list">
            {invites.map((i) => (
              <li key={i.token} className="list-item row">
                <code>{i.token}</code>

                <button onClick={() => navigator.clipboard.writeText(i.token)}>
                  Copiar
                </button>

                {onRevokeInvite && (
                  <button
                    className="btn-danger"
                    onClick={() =>
                      confirmAction("¿Revocar invitación?", () =>
                        onRevokeInvite(i.token)
                      )
                    }
                  >
                    Revocar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ======================
          Miembros
      ====================== */}
      <hr className="hr" />
      <h3>Miembros</h3>

      {loadingMembers && <p>Cargando miembros…</p>}

      {!loadingMembers && (
        <ul className="list">
          {members.map((u) => (
            <li key={u.user_id} className="list-item row">
              <span>
                <b>{u.email}</b> — {u.role}
              </span>

              {isOwner && (
                <div className="row">
                  {u.role !== "mod" && (
                    <button
                      onClick={() =>
                        confirmAction(`¿Hacer admin a ${u.email}?`, () =>
                          onSetRole?.(u.user_id, "mod")
                        )
                      }
                    >
                      Admin
                    </button>
                  )}

                  {u.role !== "member" && (
                    <button
                      onClick={() =>
                        confirmAction(`¿Quitar admin a ${u.email}?`, () =>
                          onSetRole?.(u.user_id, "member")
                        )
                      }
                    >
                      Member
                    </button>
                  )}

                  <button
                    className="btn-danger"
                    onClick={() =>
                      confirmAction(`¿Expulsar a ${u.email}?`, () =>
                        onKick?.(u.user_id)
                      )
                    }
                  >
                    Expulsar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}