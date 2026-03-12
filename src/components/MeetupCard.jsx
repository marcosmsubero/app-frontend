function parseStartsAt(startsAt) {
  if (!startsAt) return null;

  // Si ya viene con timezone (Z o +hh:mm / -hh:mm), lo usamos tal cual
  const hasTZ = /[zZ]$/.test(startsAt) || /[+-]\d{2}:\d{2}$/.test(startsAt);

  // Si viene naive (sin TZ), lo tratamos como UTC añadiendo Z
  return new Date(hasTZ ? startsAt : `${startsAt}Z`);
}

function startOfDay(d) {
  const x = d instanceof Date ? new Date(d) : parseStartsAt(d);
  if (!x || isNaN(x.getTime())) return new Date(NaN);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysFromNow(dateStr) {
  const d = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function WhenBadge({ startsAt }) {
  const diff = daysFromNow(startsAt);

  let label = "";
  let style = {};

  if (diff === 0) {
    label = "Hoy";
    style = { background: "#1f7a3a" };
  } else if (diff === 1) {
    label = "Mañana";
    style = { background: "#1f5fa8" };
  } else if (diff > 1) {
    label = `En ${diff} días`;
    style = { background: "#444" };
  } else {
    label = "Pasada";
    style = { background: "#a83232" };
  }

  return (
    <span className="badge" style={style}>
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  // Compatibilidad por si apareciera "active" en algún sitio
  const s = (status || "open") === "active" ? "open" : status || "open";

  const map = {
    open: { label: "Abierta", style: { background: "#2f2f2f" } },
    full: { label: "Completa", style: { background: "#6b4f00" } },
    cancelled: { label: "Cancelada", style: { background: "#a83232" } },
    done: { label: "Finalizada", style: { background: "#555" } },
  };

  const x = map[s] || map.open;

  return (
    <span className="badge" style={x.style}>
      {x.label}
    </span>
  );
}

function downloadICS(meetup) {
  if (!meetup?.starts_at) return;

  const dt = parseStartsAt(meetup.starts_at);
  if (!dt || isNaN(dt.getTime())) return;

  const start = dt
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0];

  const summary = "Quedada deportiva";
  const description = (meetup.notes || "").replace(/\n/g, "\\n");
  const location = (meetup.meeting_point || "").replace(/\n/g, " ");

  const content = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//App Deportes//ES
BEGIN:VEVENT
DTSTART:${start}Z
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR
`.trim();

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quedada.ics";
  a.click();

  URL.revokeObjectURL(url);
}

function initialsFromEmail(email) {
  const base = (email || "").split("@")[0] || "";
  const parts = base.split(/[._-]+/).filter(Boolean);
  const a = (parts[0]?.[0] || base[0] || "?").toUpperCase();
  const b = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (a + b).slice(0, 2);
}

function ParticipantsRow({ participants = [] }) {
  if (!participants?.length) {
    return <div className="small-muted">Sin participantes aún</div>;
  }

  return (
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      {participants.map((p) => (
        <div
          key={p.id}
          title={p.email}
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,.18)",
            background: "#141414",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {initialsFromEmail(p.email)}
        </div>
      ))}
    </div>
  );
}

function fmtPace(sec) {
  if (sec === null || sec === undefined) return "";
  const s = Number(sec);
  if (!Number.isFinite(s) || s <= 0) return "";
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}/km`;
}

function fmtPaceRange(minSec, maxSec) {
  const a = fmtPace(minSec);
  const b = fmtPace(maxSec);
  if (a && b) return `${a} – ${b}`;
  return a || b || "";
}

export default function MeetupCard({
  meetup,
  isAuthed,
  onJoin,
  onLeave,
  onCancel,
  onDone,
}) {
  if (!meetup) return null;

  const {
    starts_at,
    meeting_point,
    notes,
    status = "open",
    participants = [],
    participants_count,
    capacity,
    is_joined,

    // ✅ extras para BlaBlaRun (si vienen)
    group_name,
    level_tag,
    pace_min,
    pace_max,
  } = meetup;

  const realStatus = status === "active" ? "open" : status;
  const isCancelled = realStatus === "cancelled";
  const isDone = realStatus === "done";

  const joined = !!is_joined;

  const count = Number.isFinite(participants_count)
    ? participants_count
    : participants.length;

  const canJoin = realStatus === "open";
  const canLeave = joined;

  const dt = parseStartsAt(starts_at);
  const dateLabel = dt && !isNaN(dt.getTime()) ? dt.toLocaleString() : "—";

  const paceLabel = fmtPaceRange(pace_min, pace_max);
  const levelLabel = level_tag ? String(level_tag).toUpperCase() : "";

  return (
    <div
      className="stack"
      style={{
        padding: 14,
        borderRadius: 8,
        background: "#1e1e1e",
        opacity: isCancelled ? 0.6 : 1,
      }}
    >
      {/* HEADER */}
      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <div className="stack" style={{ gap: 4 }}>
          <strong>{dateLabel}</strong>

          {/* ✅ extra: nombre de grupo (si viene) */}
          {group_name && (
            <div className="small-muted">
              Grupo: <b>{group_name}</b>
            </div>
          )}
        </div>

        <div className="row" style={{ gap: 8, alignItems: "start" }}>
          <WhenBadge startsAt={starts_at} />
          <StatusBadge status={realStatus} />
        </div>
      </div>

      {/* TAGS (nivel / ritmo) */}
      {(levelLabel || paceLabel) && (
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {levelLabel && (
            <span className="badge" style={{ background: "#333" }}>
              {levelLabel}
            </span>
          )}
          {paceLabel && (
            <span className="badge" style={{ background: "#333" }}>
              🏃 {paceLabel}
            </span>
          )}
        </div>
      )}

      {/* INFO */}
      <div>
        <div>
          📍 <b>{meeting_point}</b>
        </div>

        {notes && <div className="small-muted">📝 {notes}</div>}

        <div className="small-muted">
          👥 {count}
          {capacity ? ` / ${capacity}` : ""} personas
        </div>
      </div>

      {/* PARTICIPANTS */}
      <ParticipantsRow participants={participants} />

      {/* ACTIONS */}
      {isAuthed && !isCancelled && !isDone && (
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {!joined && onJoin && (
            <button onClick={onJoin} disabled={!canJoin}>
              Apuntarme
            </button>
          )}

          {joined && onLeave && (
            <button onClick={onLeave} disabled={!canLeave}>
              Salir
            </button>
          )}

          {onCancel && (
            <button className="btn-danger" onClick={onCancel}>
              Cancelar
            </button>
          )}

          {onDone && <button onClick={onDone}>Marcar como hecha</button>}

          <button onClick={() => downloadICS(meetup)}>
            📅 Añadir al calendario
          </button>
        </div>
      )}

      {(isCancelled || isDone) && (
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => downloadICS(meetup)}>
            📅 Añadir al calendario
          </button>
        </div>
      )}
    </div>
  );
}
