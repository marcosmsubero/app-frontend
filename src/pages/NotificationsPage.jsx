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

  if (notification?.type === "meetup") return "/blablarun";
  if (notification?.profile_id) return `/perfil/${notification.profile_id}`;

  return "/actividad";
}

function NotificationRow({ notification, onOpen }) {
  return (
    <button
      type="button"
      className={`notificationCard${
        notification.unread ? " notificationCard--unread" : ""
      }`}
      onClick={() => onOpen?.(notification)}
      style={{ width: "100%", textAlign: "left", border: "none", padding: 16 }}
    >
      <div className="notificationCard__head">
        <div className="notificationCard__user">
          {notification.avatar_url ? (
            <img
              src={notification.avatar_url}
              alt={notification.from || "Usuario"}
              className="notificationCard__avatar"
            />
          ) : (
            <div
              className="notificationCard__avatar"
              style={{ display: "grid", placeItems: "center", fontWeight: 800 }}
            >
              {initialsFromNameOrEmail(notification.from)}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h3 className="notificationCard__name">
              {notification.from || "Actividad"}
            </h3>
            <p className="notificationCard__meta">
              {timeAgoLabel(notification.created_at)}
            </p>
          </div>
        </div>

        {notification.unread ? <span className="notificationDot" /> : null}
      </div>

      <div className="notificationCard__body">
        <p className="notificationCard__text">
          {notification.text || "Ha generado una notificación."}
        </p>

        {notification.badge ? (
          <div>
            <span className="badge">{notification.badge}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(selectedFilter = filter) {
    if (!token) {
      setNotifications([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiNotifications(selectedFilter, token);
      const items = Array.isArray(res) ? res : res?.items || [];
      setNotifications(items);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, token]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item?.unread).length,
    [notifications]
  );

  async function openNotification(notification) {
    if (!notification) return;

    setNotifications((prev) =>
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
      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">Centro de actividad</div>
            <div className="app-section-header__subtitle">
              Menciones, mensajes y movimientos recientes en una sola vista.
            </div>
          </div>

          <span className="app-badge app-badge--primary">
            {unreadNotifications > 0 ? `${unreadNotifications} nuevas` : "Al día"}
          </span>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="tabBar">
          <button
            type="button"
            className={`tabBar__item${filter === "all" ? " tabBar__item--active" : ""}`}
            onClick={() => setFilter("all")}
            disabled={loading}
          >
            Todo
          </button>

          <button
            type="button"
            className={`tabBar__item${
              filter === "mentions" ? " tabBar__item--active" : ""
            }`}
            onClick={() => setFilter("mentions")}
            disabled={loading}
          >
            Menciones
          </button>
        </div>
      </section>

      <section className="sectionBlock">
        {!token ? (
          <div className="stateCard">
            <h3 className="stateCard__title">Necesitas iniciar sesión</h3>
            <p className="stateCard__text">
              Accede a tu cuenta para revisar tu actividad.
            </p>
            <Link to="/login" className="feedCard__action feedCard__action--primary">
              Iniciar sesión
            </Link>
          </div>
        ) : loading ? (
          <div className="stateCard">
            <h3 className="stateCard__title">Cargando notificaciones</h3>
            <p className="stateCard__text">
              Estamos actualizando tu centro de actividad.
            </p>
          </div>
        ) : error ? (
          <div className="stateCard">
            <h3 className="stateCard__title">No se pudieron cargar</h3>
            <p className="stateCard__text">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="stateCard">
            <h3 className="stateCard__title">No hay notificaciones</h3>
            <p className="stateCard__text">
              Cuando ocurra algo importante, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="notificationList">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={openNotification}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
