function parseStartsAt(value) {
  if (!value) return null;

  const hasTZ = /[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasTZ ? value : `${value}Z`);
}

function startOfDay(date) {
  const d = date instanceof Date ? new Date(date) : parseStartsAt(date);
  if (!d || Number.isNaN(d.getTime())) return new Date(NaN);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(dateStr) {
  const date = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return Math.round((date - today) / (1000 * 60 * 60 * 24));
}

function getWhenBadge(startsAt) {
  const diff = daysFromNow(startsAt);

  if (diff === 0) return { label: "Hoy", variant: "primary" };
  if (diff === 1) return { label: "Mañana", variant: "warning" };
  if (diff > 1) return { label: `En ${diff} días`, variant: "" };

  return { label: "Pasada", variant: "neutral" };
}

function getStatusBadge(status) {
  const normalized = (status || "open") === "active" ? "open" : status || "open";

  const map = {
    open: { label: "Abierta", variant: "success" },
    full: { label: "Completa", variant: "warning" },
    cancelled: { label: "Cancelada", variant: "danger" },
    done: { label: "Finalizada", variant: "" },
  };

  return map[normalized] || map.open;
}

function downloadICS(meetup) {
  if (!meetup?.starts_at) return;

  const dt = parseStartsAt(meetup.starts_at);
  if (!dt || Number.isNaN(dt.getTime())) return;

  const start = dt.toISOString().replace(/[-:]/g, "").split(".")[0];

  const content = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BlaBlaRun//ES
BEGIN:VEVENT
DTSTART:${start}Z
SUMMARY:Quedada deportiva
DESCRIPTION:${String(meetup.notes || "").replace(/\n/g, "\\n")}
LOCATION:${String(meetup.meeting_point || "").replace(/\n/g, " ")}
END:VEVENT
END:VCALENDAR
`.trim();

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "meetup.ics";
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
    return <div className="meetupCard__hint">Sin participantes</div>;
  }

  return (
    <div className="meetupCard__participants">
      {participants.map((p) => (
        <div
          key={p.id}
          className="meetupCard__participant"
          title={p.email}
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
    <article className={`meetupCard${isCancelled ? " meetupCard--muted" : ""}`}>
      <header className="meetupCard__header">
        <div className="meetupCard__meta">
          <div className="meetupCard__date">{dateLabel}</div>

          {group_name && (
            <div className="meetupCard__group">
              {group_name}
            </div>
          )}
        </div>

        <div className="meetupCard__badges">
          <span className={`app-badge${whenBadge.variant ? ` app-badge--${whenBadge.variant}` : ""}`}>
            {whenBadge.label}
          </span>

          <span className={`app-badge${statusBadge.variant ? ` app-badge--${statusBadge.variant}` : ""}`}>
            {statusBadge.label}
          </span>
        </div>
      </header>

      {(levelLabel || paceLabel) && (
        <div className="meetupCard__tags">
          {levelLabel && <span className="app-chip">{levelLabel}</span>}
          {paceLabel && <span className="app-chip">{paceLabel}</span>}
        </div>
      )}

      <div className="meetupCard__body">
        <div className="meetupCard__title">
          {meeting_point || "Punto de encuentro"}
        </div>

        {notes && (
          <div className="meetupCard__notes">
            {notes}
          </div>
        )}

        <div className="meetupCard__people">
          {count}{capacity ? ` / ${capacity}` : ""} participantes
        </div>

        <ParticipantsRow participants={participants} />
      </div>

      <footer className="meetupCard__actions">
        {isAuthed && !isCancelled && !isDone ? (
          <>
            {!joined && onJoin && (
              <button
                type="button"
                className="app-button app-button--primary app-button--sm"
                onClick={onJoin}
              >
                Unirme
              </button>
            )}

            {joined && onLeave && (
              <button
                type="button"
                className="app-button app-button--secondary app-button--sm"
                onClick={onLeave}
              >
                Salir
              </button>
            )}

            {onCancel && (
              <button
                type="button"
                className="app-button app-button--danger app-button--sm"
                onClick={onCancel}
              >
                Cancelar
              </button>
            )}

            {onDone && (
              <button
                type="button"
                className="app-button app-button--secondary app-button--sm"
                onClick={onDone}
              >
                Finalizar
              </button>
            )}

            <button
              type="button"
              className="app-button app-button--ghost app-button--sm"
              onClick={() => downloadICS(meetup)}
            >
              Calendario
            </button>
          </>
        ) : (
          <button
            type="button"
            className="app-button app-button--ghost app-button--sm"
            onClick={() => downloadICS(meetup)}
          >
            Calendario
          </button>
        )}
      </footer>
    </article>
  );
}
