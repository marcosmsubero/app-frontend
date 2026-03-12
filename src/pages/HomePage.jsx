import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UpcomingMeetups from "../components/UpcomingMeetups";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Toasts from "../components/Toasts";

import { api } from "../services/api";
import { emit } from "../utils/events";

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function HomePage() {
  const { isAuthed, me, loading: authLoading } = useAuth();

  const [hasAgendaUpdates, setHasAgendaUpdates] = useState(false);

  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((t) => {
    const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, duration: 3500, type: "info", ...t }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const API_BASE = useMemo(() => {
    const fallback = `http://${window.location.hostname}:8000`;
    return import.meta.env.VITE_API_BASE || fallback;
  }, []);

  const esRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthed) {
      esRef.current?.close?.();
      esRef.current = null;
      setHasAgendaUpdates(false);
      return;
    }

    if (esRef.current) return;

    const es = new EventSource(`${API_BASE}/events`);
    esRef.current = es;

    const markUpdates = () => setHasAgendaUpdates(true);

    es.addEventListener("MEETUP_CREATED", async (e) => {
      markUpdates();
      emit("meetup_changed", { type: "created_sse" });

      let payload = null;
      try {
        payload = JSON.parse(e.data);
      } catch {}

      const groupName = payload?.group_name;
      const meetingPoint = payload?.meeting_point;
      const startsAt = payload?.starts_at;

      if (groupName && meetingPoint) {
        const msg = [`📍 ${meetingPoint}`, startsAt ? `🕒 ${fmtTime(startsAt)}` : ""]
          .filter(Boolean)
          .join(" · ");

        pushToast({
          type: "success",
          title: `Nueva quedada en ${groupName}`,
          message: msg || "Se ha creado una nueva quedada.",
        });
        return;
      }

      const meetupId = payload?.id;
      if (!meetupId) {
        pushToast({
          type: "success",
          title: "Nueva quedada",
          message: "Se ha creado una nueva quedada.",
        });
        return;
      }

      try {
        const m = await api(`/meetups/${meetupId}`);
        const gName = m?.group?.name || "un grupo";
        const mp = m?.meeting_point ? `📍 ${m.meeting_point}` : "";
        const hhmm = m?.starts_at ? `🕒 ${fmtTime(m.starts_at)}` : "";

        pushToast({
          type: "success",
          title: `Nueva quedada en ${gName}`,
          message: [mp, hhmm].filter(Boolean).join(" · ") || "Se ha creado una nueva quedada.",
        });
      } catch {
        pushToast({
          type: "success",
          title: "Nueva quedada",
          message: "Se ha creado una nueva quedada.",
        });
      }
    });

    es.addEventListener("MEETUP_JOINED", () => {
      markUpdates();
      emit("meetup_changed", { type: "joined_sse" });
      pushToast({
        type: "info",
        title: "Actualización",
        message: "Alguien se ha apuntado a una quedada.",
      });
    });

    es.addEventListener("MEETUP_LEFT", () => {
      markUpdates();
      emit("meetup_changed", { type: "left_sse" });
      pushToast({
        type: "info",
        title: "Actualización",
        message: "Alguien se ha desapuntado de una quedada.",
      });
    });

    es.addEventListener("MEETUP_CANCELLED", () => {
      markUpdates();
      emit("meetup_changed", { type: "cancelled_sse" });
      pushToast({
        type: "warn",
        title: "Quedada cancelada",
        message: "Se ha cancelado una quedada.",
      });
    });

    es.addEventListener("MEETUP_DONE", () => {
      markUpdates();
      emit("meetup_changed", { type: "done_sse" });
      pushToast({
        type: "success",
        title: "Quedada finalizada",
        message: "Una quedada se ha marcado como hecha.",
      });
    });

    es.addEventListener("GROUP_DELETED", (e) => {
      markUpdates();
      emit("meetup_changed", { type: "group_deleted_sse" });

      let payload = null;
      try {
        payload = JSON.parse(e.data);
      } catch {}
      const gid = payload?.group_id ? Number(payload.group_id) : null;

      pushToast({
        type: "warn",
        title: "Grupo eliminado",
        message: gid ? `Se ha eliminado el grupo #${gid}.` : "Se ha eliminado un grupo.",
      });
    });

    es.onerror = () => {};

    return () => {
      esRef.current?.close?.();
      esRef.current = null;
    };
  }, [API_BASE, authLoading, isAuthed, pushToast]);

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <h2 className="m0">Inicio</h2>

      {!isAuthed ? (
        <>
          <p className="muted">Inicia sesión para ver tu agenda y tus grupos.</p>
          <div className="row" style={{ gap: 10 }}>
            <Link className="link-btn" to="/login">
              Login →
            </Link>
            <Link className="link-btn" to="/register">
              Registro →
            </Link>
          </div>
        </>
      ) : (
        <>
          <div
            className="row"
            style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
          >
            <span className="small-muted">
              Sesión iniciada: <b>{me?.email || "usuario"}</b>
            </span>

            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <Link className="link-btn" to="/explorar">
                Explorar quedadas →
              </Link>
              <Link className="link-btn" to="/groups">
                Ir a grupos →
              </Link>
            </div>
          </div>

          <UpcomingMeetups
            hasUpdates={hasAgendaUpdates}
            onClearUpdates={() => setHasAgendaUpdates(false)}
          />

          <hr className="hr" />

          <div className="card">
            <h3 className="m0">Tu siguiente paso</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Crea un grupo, únete a uno o crea una quedada para esta semana.
            </p>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <Link className="link-btn" to="/explorar">
                Explorar quedadas →
              </Link>
              <Link className="link-btn" to="/groups">
                Ver grupos →
              </Link>
            </div>
          </div>
        </>
      )}

      <Toasts toasts={toasts} onRemove={removeToast} />
    </div>
  );
}