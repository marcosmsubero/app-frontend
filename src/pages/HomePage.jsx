import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UpcomingMeetups from "../components/UpcomingMeetups";
import Toasts from "../components/Toasts";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import { emit } from "../utils/events";

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function HomePage() {
  const { isAuthed, me, loading: authLoading } = useAuth();
  const [hasAgendaUpdates, setHasAgendaUpdates] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());

    setToasts((prev) => [...prev, { id, duration: 3500, type: "info", ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
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
        const message = [`📍 ${meetingPoint}`, startsAt ? `🕒 ${fmtTime(startsAt)}` : ""]
          .filter(Boolean)
          .join(" · ");

        pushToast({
          type: "success",
          title: `Nueva quedada en ${groupName}`,
          message: message || "Se ha creado una nueva quedada.",
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
        const meetup = await api(`/meetups/${meetupId}`);
        const remoteGroupName = meetup?.group?.name || "un grupo";
        const meetingPointText = meetup?.meeting_point ? `📍 ${meetup.meeting_point}` : "";
        const timeText = meetup?.starts_at ? `🕒 ${fmtTime(meetup.starts_at)}` : "";

        pushToast({
          type: "success",
          title: `Nueva quedada en ${remoteGroupName}`,
          message:
            [meetingPointText, timeText].filter(Boolean).join(" · ") ||
            "Se ha creado una nueva quedada.",
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

      const groupId = payload?.group_id ? Number(payload.group_id) : null;

      pushToast({
        type: "warn",
        title: "Grupo eliminado",
        message: groupId
          ? `Se ha eliminado el grupo #${groupId}.`
          : "Se ha eliminado un grupo.",
      });
    });

    es.onerror = () => {};

    return () => {
      esRef.current?.close?.();
      esRef.current = null;
    };
  }, [API_BASE, authLoading, isAuthed, pushToast]);

  return (
    <section className="page">
      <div className="page__hero glass-banner">
        <div className="glass-banner__body">
          <div className="page__header">
            <span className="page__eyebrow">Dashboard</span>
            <h1 className="page__title">
              {isAuthed
                ? `Hola${me?.handle ? `, ${me.handle}` : ""}`
                : "Conecta deporte, comunidad y actividad"}
            </h1>
            <p className="page__subtitle">
              {isAuthed
                ? "Consulta tu agenda, revisa novedades y accede rápido a grupos y quedadas."
                : "Tu punto de encuentro para descubrir grupos, planificar salidas y mantener tu actividad deportiva conectada."}
            </p>
          </div>

          {isAuthed ? (
            <div className="stats-strip">
              <div className="app-stat">
                <div className="app-stat__value">{me?.handle ? `@${me.handle}` : "Activa"}</div>
                <div className="app-stat__label">Cuenta</div>
              </div>
              <div className="app-stat">
                <div className="app-stat__value">{me?.city || "Sin ciudad"}</div>
                <div className="app-stat__label">Ubicación</div>
              </div>
              <div className="app-stat">
                <div className="app-stat__value">
                  {Array.isArray(me?.disciplines) && me.disciplines.length > 0
                    ? me.disciplines.length
                    : me?.discipline || me?.sport
                      ? 1
                      : 0}
                </div>
                <div className="app-stat__label">Disciplinas</div>
              </div>
              <div className="app-stat">
                <div className="app-stat__value">{hasAgendaUpdates ? "Nuevo" : "Al día"}</div>
                <div className="app-stat__label">Agenda</div>
              </div>
            </div>
          ) : (
            <div className="split-actions">
              <Link to="/login" className="app-btn app-btn--primary">
                Iniciar sesión
              </Link>
              <Link to="/register" className="app-btn app-btn--secondary">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>

      {isAuthed ? (
        <div className="feed-layout">
          <div className="feed-column">
            <div className="app-card">
              <div className="app-card__header">
                <div className="app-section-header">
                  <div>
                    <div className="app-section-header__title">Tu agenda</div>
                    <div className="app-section-header__subtitle">
                      Próximas quedadas y actividad sincronizada en tiempo real.
                    </div>
                  </div>
                  <Link to="/explorar" className="app-btn app-btn--secondary app-btn--sm">
                    Explorar
                  </Link>
                </div>
              </div>
              <div className="app-card__body">
                <UpcomingMeetups
                  hasUpdates={hasAgendaUpdates}
                  onClearUpdates={() => setHasAgendaUpdates(false)}
                />
              </div>
            </div>
          </div>

          <aside className="feed-column">
            <div className="app-card app-card--soft">
              <div className="app-card__body app-stack">
                <div>
                  <div className="app-section-header__title">Accesos rápidos</div>
                  <div className="app-section-header__subtitle">
                    Muévete por la app sin perder el hilo de tu actividad.
                  </div>
                </div>

                <div className="split-actions">
                  <Link to="/groups" className="app-btn app-btn--secondary">
                    Ver grupos
                  </Link>
                  <Link to="/mensajes" className="app-btn app-btn--secondary">
                    Mensajes
                  </Link>
                  <Link to="/perfil" className="app-btn app-btn--secondary">
                    Mi perfil
                  </Link>
                  <Link to="/notificaciones" className="app-btn app-btn--secondary">
                    Notificaciones
                  </Link>
                </div>
              </div>
            </div>

            <div className="app-card">
              <div className="app-card__body app-stack">
                <div className="app-section-header__title">Siguiente paso</div>
                <p className="app-text-soft">
                  Crea un grupo, únete a una comunidad o lanza una quedada para esta semana.
                </p>

                <div className="split-actions">
                  <Link to="/groups" className="app-btn app-btn--primary">
                    Crear o unirme
                  </Link>
                  <Link to="/explorar" className="app-btn app-btn--ghost">
                    Descubrir actividad
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="page__columns">
          <div className="app-card">
            <div className="app-card__body app-stack app-stack--lg">
              <div>
                <div className="app-section-header__title">Qué puedes hacer</div>
                <div className="app-section-header__subtitle">
                  Una app social deportiva pensada para planificar, conectar y salir a entrenar.
                </div>
              </div>

              <div className="app-grid app-grid--cards">
                <article className="app-card app-card--soft feed-card">
                  <div className="feed-card__body">
                    <div className="app-badge app-badge--primary">Explorar</div>
                    <div className="feed-card__title">Descubre actividad local</div>
                    <p className="feed-card__text">
                      Encuentra quedadas, rutas y planes deportivos cerca de ti.
                    </p>
                  </div>
                </article>

                <article className="app-card app-card--soft feed-card">
                  <div className="feed-card__body">
                    <div className="app-badge app-badge--success">Comunidad</div>
                    <div className="feed-card__title">Crea o únete a grupos</div>
                    <p className="feed-card__text">
                      Organiza comunidades por deporte, ciudad o nivel de actividad.
                    </p>
                  </div>
                </article>

                <article className="app-card app-card--soft feed-card">
                  <div className="feed-card__body">
                    <div className="app-badge app-badge--warning">Agenda</div>
                    <div className="feed-card__title">Coordina tus salidas</div>
                    <p className="feed-card__text">
                      Sigue la agenda, confirma asistencia y mantén tus planes actualizados.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>

          <aside className="page__sidebar">
            <div className="app-card">
              <div className="app-card__body app-stack">
                <div className="app-section-header__title">Empieza ahora</div>
                <p className="app-text-soft">
                  Regístrate para acceder a grupos, mensajes, perfil y quedadas.
                </p>

                <div className="split-actions">
                  <Link to="/register" className="app-btn app-btn--primary">
                    Crear cuenta
                  </Link>
                  <Link to="/login" className="app-btn app-btn--secondary">
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Toasts toasts={toasts} onRemove={removeToast} />
    </section>
  );
}
