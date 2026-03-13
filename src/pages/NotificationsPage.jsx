import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiMarkNotifRead, apiNotifications } from "../services/api";

function timeAgoLabel(dateOrIso) {
  try {
    const d = new Date(dateOrIso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);

    if (min < 1) return "ahora";
    if (min < 60) return `${min} min`;

    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;

    const days = Math.floor(h / 24);
    return `${days} d`;
  } catch {
    return "";
  }
}

function initialsFromNameOrEmail(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function NotificationRow({ notification, onOpen }) {
  return (
    <button
      type="button"
      className={`notification-row${notification.unread ? " notification-row--unread" : ""}`}
      onClick={() => onOpen?.(notification)}
    >
      <div className="notification-row__avatar">
        {notification.avatar_url ? (
          <img src={notification.avatar_url} alt={notification.from || "Usuario"} />
        ) : (
          <span>{initialsFromNameOrEmail(notification.from)}</span>
        )}
      </div>

      <div className="notification-row__content">
        <div className="notification-row__text">
          <strong>{notification.from || "Actividad"}</strong>{" "}
          <span>{notification.text || "ha generado una notificación."}</span>
        </div>

        <div className="notification-row__meta">
          <span>{timeAgoLabel(notification.created_at)}</span>
          {notification.badge ? (
            <span className="app-badge app-badge--primary">{notification.badge}</span>
          ) : null}
        </div>
      </div>

      <div className="notification-row__state">
        {notification.unread ? (
          <span className="notification-row__dot" aria-label="No leída" />
        ) : (
          <span className="notification-row__chevron" aria-hidden="true">
            ›
          </span>
        )}
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token, isAuthed } = useAuth();

  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  const list = useMemo(() => data || [], [data]);

  async function load(currentTab = tab) {
    if (!token) {
      setData([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiNotifications(currentTab, token);
      const items = Array.isArray(res) ? res : res?.items || [];
      setData(items);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  function routeFromNotif(notification) {
    if (notification?.type === "message") return "/mensajes";
    if (notification?.type === "mention") return "/publicaciones";
    if (notification?.type === "group") return "/groups";
    if (notification?.type === "meetup") return "/explorar";
    return "/explorar";
  }

  async function openNotif(notification) {
    if (!notification) return;

    setData((prev) =>
      (prev || []).map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item
      )
    );

    if (token && notification.id && notification.unread) {
      try {
        await apiMarkNotifRead(notification.id, token);
      } catch (e) {
        toast?.error?.(e?.message || "No se pudo marcar como leída");
      }
    }

    nav(routeFromNotif(notification));
  }

  return (
    <section className="page">
      <div className="page__hero glass-banner">
        <div className="glass-banner__body">
          <div className="page__header">
            <span className="page__eyebrow">Notificaciones</span>
            <h1 className="page__title">Actividad reciente y novedades</h1>
            <p className="page__subtitle">
              Revisa menciones, mensajes, cambios de grupo y avisos relacionados con tus planes.
            </p>
          </div>

          <div className="split-actions">
            <button
              type="button"
              className="app-btn app-btn--secondary"
              onClick={() => nav(-1)}
            >
              Volver
            </button>

            <button
              type="button"
              className="app-btn app-btn--primary"
              onClick={() => load(tab)}
              disabled={loading || !token}
            >
              {loading ? "Actualizando…" : "Recargar"}
            </button>
          </div>
        </div>
      </div>

      <div className="page__columns">
        <div className="app-stack app-stack--lg">
          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">Centro de actividad</div>
                  <div className="app-section-header__subtitle">
                    Filtra entre todo el flujo o solo menciones relevantes.
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card__body app-stack">
              <div className="app-tabs">
                <button
                  type="button"
                  className={`app-tab${tab === "all" ? " app-tab--active" : ""}`}
                  onClick={() => setTab("all")}
                  disabled={loading}
                >
                  Todo
                </button>

                <button
                  type="button"
                  className={`app-tab${tab === "mentions" ? " app-tab--active" : ""}`}
                  onClick={() => setTab("mentions")}
                  disabled={loading}
                >
                  Menciones
                </button>
              </div>

              {!token ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">Necesitas iniciar sesión</div>
                  <div className="app-empty-state__text">
                    Accede a tu cuenta para revisar actividad y avisos pendientes.
                  </div>
                  <div className="split-actions" style={{ justifyContent: "center" }}>
                    <Link to="/login" className="app-btn app-btn--primary">
                      Iniciar sesión
                    </Link>
                  </div>
                </div>
              ) : loading ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">Cargando notificaciones</div>
                  <div className="app-empty-state__text">
                    Estamos actualizando tu centro de actividad.
                  </div>
                </div>
              ) : error ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">No se pudieron cargar</div>
                  <div className="app-empty-state__text">{error}</div>
                </div>
              ) : list.length === 0 ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">No hay notificaciones</div>
                  <div className="app-empty-state__text">
                    Cuando ocurra algo relevante en tu red deportiva, aparecerá aquí.
                  </div>
                </div>
              ) : (
                <div className="notification-list">
                  {list.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onOpen={openNotif}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Qué verás aquí</div>
              <p className="app-text-soft">
                Este panel debe ayudarte a reaccionar rápido ante cambios importantes de actividad.
              </p>

              <div className="app-list">
                <div className="app-list-item">
                  <div className="app-badge app-badge--primary">Mensajes</div>
                  <div>
                    <strong>Nuevo chat o respuesta</strong>
                    <div className="app-text-soft">
                      Cuando alguien te escriba o reaccione en una conversación.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--success">Grupos</div>
                  <div>
                    <strong>Cambios en comunidad</strong>
                    <div className="app-text-soft">
                      Invitaciones, movimiento en grupos o nuevas acciones compartidas.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--warning">Quedadas</div>
                  <div>
                    <strong>Actualizaciones de actividad</strong>
                    <div className="app-text-soft">
                      Confirmaciones, cambios de estado o novedades sobre planes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
