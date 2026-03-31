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
      className={`notificationsSimple__row${
        notification.unread ? " notificationsSimple__row--unread" : ""
      }`}
      onClick={() => onOpen?.(notification)}
    >
      <div className="notificationsSimple__avatar">
        {notification.avatar_url ? (
          <img src={notification.avatar_url} alt={notification.from || "Usuario"} />
        ) : (
          <span>{initialsFromNameOrEmail(notification.from)}</span>
        )}
      </div>

      <div className="notificationsSimple__content">
        <div className="notificationsSimple__text">
          <strong>{notification.from || "Actividad"}</strong>{" "}
          <span>{notification.text || "ha generado una notificación."}</span>
        </div>

        <div className="notificationsSimple__meta">
          <span>{timeAgoLabel(notification.created_at)}</span>
          {notification.badge ? <span className="app-badge">{notification.badge}</span> : null}
        </div>
      </div>

      <div className="notificationsSimple__state">
        {notification.unread ? (
          <span className="notificationsSimple__dot" aria-label="No leída" />
        ) : (
          <span className="notificationsSimple__chevron" aria-hidden="true">
            ›
          </span>
        )}
      </div>
    </button>
  );
}

function routeFromNotif(notification) {
  if (notification?.type === "message") {
    if (notification.thread_id) return `/mensajes/${notification.thread_id}`;
    return "/mensajes";
  }

  if (notification?.type === "mention") {
    if (notification.profile_id) return `/perfil/${notification.profile_id}`;
    return "/perfil";
  }

  if (notification?.type === "group") {
    if (notification.group_profile_id) return `/perfil/${notification.group_profile_id}`;
    if (notification.profile_id) return `/perfil/${notification.profile_id}`;
    return "/blablarun";
  }

  if (notification?.type === "meetup") {
    return "/blablarun";
  }

  if (notification?.profile_id) {
    return `/perfil/${notification.profile_id}`;
  }

  return "/actividad";
}

export default function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

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
    <section className="notificationsSimple">
      <div className="notificationsSimple__hero app-section">
        <div className="notificationsSimple__heroCopy">
          <span className="app-kicker">Notificaciones</span>
          <h1 className="notificationsSimple__title">Actividad reciente</h1>
          <p className="notificationsSimple__subtitle">
            Revisa mensajes, menciones y cambios relevantes relacionados con tu actividad.
          </p>
        </div>

        <div className="notificationsSimple__heroActions">
          <button
            type="button"
            className="app-button app-button--primary"
            onClick={() => load(tab)}
            disabled={loading || !token}
          >
            {loading ? "Actualizando…" : "Recargar"}
          </button>
        </div>
      </div>

      <div className="notificationsSimple__layout">
        <div className="notificationsSimple__main">
          <section className="notificationsSimple__panel app-section">
            <div className="notificationsSimple__panelHead">
              <div>
                <p className="app-kicker">Centro de actividad</p>
                <h2 className="app-title">Tus notificaciones</h2>
                <p className="app-subtitle">
                  Filtra entre el flujo completo o solo menciones.
                </p>
              </div>
            </div>

            <div className="notificationsSimple__tabs">
              <button
                type="button"
                className={`notificationsSimple__tab${
                  tab === "all" ? " notificationsSimple__tab--active" : ""
                }`}
                onClick={() => setTab("all")}
                disabled={loading}
              >
                Todo
              </button>

              <button
                type="button"
                className={`notificationsSimple__tab${
                  tab === "mentions" ? " notificationsSimple__tab--active" : ""
                }`}
                onClick={() => setTab("mentions")}
                disabled={loading}
              >
                Menciones
              </button>
            </div>

            {!token ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Necesitas iniciar sesión</strong>
                  <p>Accede a tu cuenta para revisar actividad y avisos pendientes.</p>
                  <Link to="/login" className="app-button app-button--primary">
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            ) : loading ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Cargando notificaciones</strong>
                  <p>Estamos actualizando tu centro de actividad.</p>
                </div>
              </div>
            ) : error ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No se pudieron cargar</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : list.length === 0 ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No hay notificaciones</strong>
                  <p>Cuando ocurra algo relevante en tu red deportiva, aparecerá aquí.</p>
                </div>
              </div>
            ) : (
              <div className="notificationsSimple__list">
                {list.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={openNotif}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="notificationsSimple__aside">
          <section className="notificationsSimple__asideCard app-section">
            <div className="notificationsSimple__panelHead">
              <div>
                <p className="app-kicker">Qué verás aquí</p>
                <h2 className="app-title">Avisos importantes</h2>
                <p className="app-subtitle">
                  Un resumen rápido de la actividad a la que conviene reaccionar antes.
                </p>
              </div>
            </div>

            <div className="notificationsSimple__asideList">
              <div className="notificationsSimple__asideItem">
                <span className="app-badge app-badge--primary">Mensajes</span>
                <p>Nuevos chats o respuestas en conversaciones activas.</p>
              </div>

              <div className="notificationsSimple__asideItem">
                <span className="app-badge app-badge--success">Perfiles</span>
                <p>Menciones y actividad relacionada con perfiles individuales o grupales.</p>
              </div>

              <div className="notificationsSimple__asideItem">
                <span className="app-badge app-badge--warning">Quedadas</span>
                <p>Confirmaciones, estados y novedades sobre tus planes.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
