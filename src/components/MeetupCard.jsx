function parseStartsAt(startsAt) {
  if (!startsAt) return null;

  const hasTZ = /[zZ]$/.test(startsAt) || /[+-]\d{2}:\d{2}$/.test(startsAt);
  return new Date(hasTZ ? startsAt : `${startsAt}Z`);
}

function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : parseStartsAt(value);
  if (!date || Number.isNaN(date.getTime())) return new Date(NaN);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysFromNow(dateStr) {
  const date = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return Math.round((date - today) / (1000 * 60 * 60 * 24));
}

function getWhenBadge(startsAt) {
  const diff = daysFromNow(startsAt);

  if (diff === 0) return { label: "Hoy", variant: "success" };
  if (diff === 1) return { label: "Mañana", variant: "primary" };
  if (diff > 1) return { label: `En ${diff} días`, variant: "neutral" };
  return { label: "Pasada", variant: "danger" };
}

function getStatusBadge(status) {
  const normalized = (status || "open") === "active" ? "open" : status || "open";

  const map = {
    open: { label: "Abierta", variant: "success" },
    full: { label: "Completa", variant: "warning" },
    cancelled: { label: "Cancelada", variant: "danger" },
    done: { label: "Finalizada", variant: "neutral" },
  };

  return map[normalized] || map.open;
}

function downloadICS(meetup) {
  if (!meetup?.starts_at) return;

  const dt = parseStartsAt(meetup.starts_at);
  if (!dt || Number.isNaN(dt.getTime())) return;

  const start = dt
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0];

  const summary = "Quedada deportiva";
  const description = String(meetup.notes || "").replace(/\n/g, "\\n");
  const location = String(meetup.meeting_point || "").replace(/\n/g, " ");

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
  const base = String(email || "").split("@")[0] || "";
  const parts = base.split(/[._-]+/).filter(Boolean);
  const a = (parts[0]?.[0] || base[0] || "?").toUpperCase();
  const b = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (a + b).slice(0, 2);
}

function ParticipantsRow({ participants = [] }) {
  if (!participants?.length) {
    return <div className="meetup-card__hint">Sin participantes aún</div>;
  }

  return (
    <div className="meetup-card__participants">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="meetup-card__participant"
          title={participant.email}
        >
          {initialsFromEmail(participant.email)}
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
  const dateLabel =
    dt && !Number.isNaN(dt.getTime())
      ? dt.toLocaleString("es-ES", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Fecha no disponible";

  const paceLabel = fmtPaceRange(pace_min, pace_max);
  const levelLabel = level_tag ? String(level_tag).toUpperCase() : "";

  const whenBadge = getWhenBadge(starts_at);
  const statusBadge = getStatusBadge(realStatus);

  return (
    <article className={`meetup-card${isCancelled ? " meetup-card--muted" : ""}`}>
      <div className="meetup-card__header">
        <div className="meetup-card__date-block">
          <div className="meetup-card__date">{dateLabel}</div>
          {group_name ? (
            <div className="meetup-card__group">
              Grupo: <strong>{group_name}</strong>
            </div>
          ) : null}
        </div>

        <div className="meetup-card__badges">
          <span className={`app-badge app-badge--${whenBadge.variant}`}>{whenBadge.label}</span>
          <span className={`app-badge app-badge--${statusBadge.variant}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {(levelLabel || paceLabel) && (
        <div className="meetup-card__tags">
          {levelLabel ? <span className="app-chip">{levelLabel}</span> : null}
          {paceLabel ? <span className="app-chip">🏃 {paceLabel}</span> : null}
        </div>
      )}

      <div className="meetup-card__body">
        <div className="meetup-card__title-row">
          <div className="meetup-card__title">📍 {meeting_point || "Punto de encuentro"}</div>
        </div>

        {notes ? <div className="meetup-card__notes">📝 {notes}</div> : null}

        <div className="meetup-card__people">
          👥 {count}
          {capacity ? ` / ${capacity}` : ""} personas
        </div>

        <ParticipantsRow participants={participants} />
      </div>

      <div className="meetup-card__actions">
        {isAuthed && !isCancelled && !isDone ? (
          <>
            {!joined && onJoin ? (
              <button
                type="button"
                className="app-btn app-btn--primary app-btn--sm"
                onClick={onJoin}
                disabled={!canJoin}
              >
                Apuntarme
              </button>
            ) : null}

            {joined && onLeave ? (
              <button
                type="button"
                className="app-btn app-btn--secondary app-btn--sm"
                onClick={onLeave}
                disabled={!canLeave}
              >
                Salir
              </button>
            ) : null}

            {onCancel ? (
              <button
                type="button"
                className="app-btn app-btn--danger app-btn--sm"
                onClick={onCancel}
              >
                Cancelar
              </button>
            ) : null}

            {onDone ? (
              <button
                type="button"
                className="app-btn app-btn--secondary app-btn--sm"
                onClick={onDone}
              >
                Marcar como hecha
              </button>
            ) : null}

            <button
              type="button"
              className="app-btn app-btn--ghost app-btn--sm"
              onClick={() => downloadICS(meetup)}
            >
              Añadir al calendario
            </button>
          </>
        ) : (
          <button
            type="button"
            className="app-btn app-btn--ghost app-btn--sm"
            onClick={() => downloadICS(meetup)}
          >
            Añadir al calendario
          </button>
        )}
      </div>
    </article>
  );
}
