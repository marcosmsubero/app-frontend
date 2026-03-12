import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpcomingMeetups } from "../hooks/useUpcomingMeetups";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayDiff(startsAt) {
  const d = startOfDay(new Date(startsAt));
  const today = startOfDay(new Date());
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function dayLabel(startsAt) {
  const diff = dayDiff(startsAt);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return new Date(startsAt).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function UpcomingMeetups() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const { meetups, loading, error, reload } = useUpcomingMeetups(token, toast);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [meetups]);

  if (!token) return null;

  if (loading) {
    return (
      <div className="agenda">
        <div className="agenda__header">
          <h3 className="m0">📅 Tu próxima quedada</h3>
        </div>
        <p className="muted">Cargando agenda…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agenda">
        <div className="agenda__header">
          <h3 className="m0">📅 Tu próxima quedada</h3>
          <button onClick={reload}>Recargar</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          No se pudo cargar la agenda: {error}
        </p>
      </div>
    );
  }

  if (!meetups || meetups.length === 0) {
    return (
      <div className="agenda">
        <div className="agenda__header">
          <h3 className="m0">📅 Tu próxima quedada</h3>
          <button onClick={reload}>Recargar</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          No tienes quedadas próximas
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(index, meetups.length - 1);
  const m = meetups[safeIndex];
  const diff = dayDiff(m.starts_at);

  return (
    <div className="agenda">
      <div className="agenda__header">
        <h3 className="m0">📅 Tu próxima quedada</h3>
        <button onClick={reload}>Recargar</button>
      </div>

      {(diff === 0 || diff === 1) && (
        <div className={`badge ${diff === 0 ? "badge--today" : "badge--tomorrow"}`}>
          {diff === 0 ? "🔔 Es HOY" : "🔔 Es MAÑANA"}
        </div>
      )}

      <div className="agenda__carousel">
        <button
          className="btn-icon"
          disabled={safeIndex === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Anterior"
          title="Anterior"
        >
          ←
        </button>

        <div
          className="agenda__card"
          onClick={() => nav(`/groups/${m.group.id}`, { state: { groupName: m.group.name } })}
          title="Abrir grupo"
        >
          <div className="agenda__cardTop">
            <strong>
              {dayLabel(m.starts_at)} ·{" "}
              {new Date(m.starts_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>

            <span className="badge badge--neutral">
              {safeIndex + 1}/{meetups.length}
            </span>
          </div>

          <div className="small-muted">{m.group.name}</div>
          <div>📍 {m.meeting_point}</div>
        </div>

        <button
          className="btn-icon"
          disabled={safeIndex >= meetups.length - 1}
          onClick={() => setIndex((i) => Math.min(meetups.length - 1, i + 1))}
          aria-label="Siguiente"
          title="Siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}
