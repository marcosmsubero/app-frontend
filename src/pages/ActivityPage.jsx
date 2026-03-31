import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  apiDMThreads,
  apiMarkNotifRead,
  apiNotifications,
} from "../services/api";

function initialsFromNameOrEmail(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

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

function getThreadName(thread) {
  return (
    thread?.name ||
    thread?.title ||
    thread?.user_name ||
    thread?.participant_name ||
    "Conversación"
  );
}

function getThreadPreview(thread) {
  return (
    thread?.last_message ||
    thread?.preview ||
    thread?.snippet ||
    "Sin mensajes recientes"
  );
}

function getUnreadCount(thread) {
  if (typeof thread?.unread_count === "number") return thread.unread_count;
  if (thread?.unread === true) return 1;
  return 0;
}

function IconRefresh({ spinning = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transformOrigin: "center",
        animation: spinning ? "activitySpin 0.9s linear infinite" : "none",
      }}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
      <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
    </svg>
  );
}

function MessageRow({ thread, onOpen }) {
  const unreadCount = getUnreadCount(thread);

  return (
    <button
      type="button"
      className={`messagesSimple__row${
        unreadCount > 0 ? " messagesSimple__row--unread" : ""
      }`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="messagesSimple__avatar">
        {thread?.avatar_url ? (
          <img src={thread.avatar_url} alt={getThreadName(thread)} />
        ) : (
          <span>{initialsFromNameOrEmail(getThreadName(thread))}</span>
        )}
      </div>

      <div className="messagesSimple__content">
        <div className="messagesSimple__text">
          <strong>{getThreadName(thread)}</strong>{" "}
          <span>{getThreadPreview(thread)}</span>
        </div>

        <div className="messagesSimple__meta">
          <span>{timeAgoLabel(thread?.updated_at)}</span>
        </div>
      </div>

      <div className="messagesSimple__state">
        {unreadCount > 0 ? (
          <span className="messagesSimple__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="messagesSimple__chevron">›</span>
        )}
      </div>
    </button>
  );
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

export default function ActivityPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab =
    searchParams.get("tab") === "notifications" ? "notifications" : "messages";
  const notifFilter =
    searchParams.get("filter") === "mentions" ? "mentions" : "all";

  const [messageQuery, setMessageQuery] = useState("");
  const [threads, setThreads] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const timerRef = useRef(null);

  async function loadMessages(query = messageQuery) {
    if (!token) {
      setThreads([]);
      setMessagesError("");
      return;
    }

    setMessagesLoading(true);
    setMessagesError("");

    try {
      const res = await apiDMThreads(query || "", token);
      const items = Array.isArray(res) ? res : res?.items || [];
      setThreads(items);
    } catch (e) {
      setMessagesError(e?.message || "No se pudieron cargar los mensajes");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function loadNotifications(filter = notifFilter) {
    if (!token) {
      setNotifications([]);
      setNotificationsError("");
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const res = await apiNotifications(filter, token);
      const items = Array.isArray(res) ? res : res?.items || [];
      setNotifications(items);
    } catch (e) {
      setNotificationsError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    loadMessages("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      loadMessages(messageQuery);
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageQuery, token]);

  useEffect(() => {
    loadNotifications(notifFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifFilter, token]);

  const messageList = useMemo(() => threads || [], [threads]);
  const notificationsList = useMemo(() => notifications || [], [notifications]);

  const unreadThreads = useMemo(() => {
    return messageList.filter((t) => getUnreadCount(t) > 0).length;
  }, [messageList]);

  const unreadNotifications = useMemo(() => {
    return notificationsList.filter((item) => item?.unread).length;
  }, [notificationsList]);

  function switchTab(tab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (tab !== "notifications") next.delete("filter");
    setSearchParams(next, { replace: true });
  }

  function setNotificationFilter(filter) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "notifications");
    next.set("filter", filter);
    setSearchParams(next, { replace: true });
  }

  function openThread(thread) {
    if (!thread?.id) return;
    const threadIds = messageList.map((item) => item.id);
    nav(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  async function openNotif(notification) {
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

  function renderEmptyLogin(text) {
    return (
      <div className="app-empty">
        <div className="notificationsSimple__emptyBody">
          <strong>Necesitas iniciar sesión</strong>
          <p>{text}</p>
          <Link to="/login" className="app-button app-button--primary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  function renderMessagesContent() {
    if (!token) {
      return renderEmptyLogin("Accede a tu cuenta para revisar tus conversaciones.");
    }

    if (messagesLoading) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>Cargando mensajes</strong>
            <p>Estamos actualizando tu bandeja.</p>
          </div>
        </div>
      );
    }

    if (messagesError) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No se pudieron cargar</strong>
            <p>{messagesError}</p>
          </div>
        </div>
      );
    }

    if (messageList.length === 0) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No hay conversaciones</strong>
            <p>Cuando inicies o recibas mensajes, aparecerán aquí.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="messagesSimple__list">
        {messageList.map((thread) => (
          <MessageRow key={thread.id} thread={thread} onOpen={openThread} />
        ))}
      </div>
    );
  }

  function renderNotificationsContent() {
    if (!token) {
      return renderEmptyLogin("Accede a tu cuenta para revisar tu actividad.");
    }

    if (notificationsLoading) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>Cargando notificaciones</strong>
            <p>Estamos actualizando tu centro de actividad.</p>
          </div>
        </div>
      );
    }

    if (notificationsError) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No se pudieron cargar</strong>
            <p>{notificationsError}</p>
          </div>
        </div>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No hay notificaciones</strong>
            <p>Cuando ocurra algo relevante, aparecerá aquí.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="notificationsSimple__list">
        {notificationsList.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onOpen={openNotif}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="page">
      <style>{`
        @keyframes activitySpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 16 }}>
          <div className="page__header" style={{ marginBottom: 0 }}>
            <span className="page__eyebrow">Actividad</span>
            <h1 className="page__title">Mensajes y notificaciones</h1>
          </div>

          <div className="notificationsSimple__tabs">
            <button
              type="button"
              className={`notificationsSimple__tab${
                currentTab === "messages" ? " notificationsSimple__tab--active" : ""
              }`}
              onClick={() => switchTab("messages")}
            >
              Mensajes
              {unreadThreads > 0 ? (
                <span className="app-badge app-badge--primary" style={{ marginLeft: 8 }}>
                  {unreadThreads}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className={`notificationsSimple__tab${
                currentTab === "notifications" ? " notificationsSimple__tab--active" : ""
              }`}
              onClick={() => switchTab("notifications")}
            >
              Notificaciones
              {unreadNotifications > 0 ? (
                <span className="app-badge app-badge--primary" style={{ marginLeft: 8 }}>
                  {unreadNotifications}
                </span>
              ) : null}
            </button>
          </div>

          {currentTab === "messages" ? (
            <div className="messagesSimple__toolbar">
              <div className="app-field" style={{ marginBottom: 0 }}>
                <label className="app-label">Buscar conversación</label>
                <input
                  className="app-input"
                  placeholder="Ej. Carlos, trail..."
                  value={messageQuery}
                  onChange={(e) => setMessageQuery(e.target.value)}
                  disabled={!token}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="notificationsSimple__tabs" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`notificationsSimple__tab${
                    notifFilter === "all" ? " notificationsSimple__tab--active" : ""
                  }`}
                  onClick={() => setNotificationFilter("all")}
                  disabled={notificationsLoading}
                >
                  Todo
                </button>

                <button
                  type="button"
                  className={`notificationsSimple__tab${
                    notifFilter === "mentions" ? " notificationsSimple__tab--active" : ""
                  }`}
                  onClick={() => setNotificationFilter("mentions")}
                  disabled={notificationsLoading}
                >
                  Menciones
                </button>
              </div>

              <button
                type="button"
                onClick={() => loadNotifications(notifFilter)}
                disabled={notificationsLoading || !token}
                aria-label="Recargar"
                title="Recargar"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid var(--app-border)",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: notificationsLoading || !token ? "default" : "pointer",
                  flexShrink: 0,
                  color: "var(--app-text)",
                }}
              >
                <IconRefresh spinning={notificationsLoading} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="app-card">
        <div className="app-card__body">
          {currentTab === "messages"
            ? renderMessagesContent()
            : renderNotificationsContent()}
        </div>
      </div>
    </section>
  );
}
