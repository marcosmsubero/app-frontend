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

function ShellIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconRefresh({ spinning = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 18,
        height: 18,
        animation: spinning ? "spin 0.9s linear infinite" : "none",
      }}
    >
      <ShellIcon>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
        <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
      </ShellIcon>
    </span>
  );
}

function IconSearch() {
  return (
    <ShellIcon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </ShellIcon>
  );
}

function IconMessages() {
  return (
    <ShellIcon>
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H4l2.6-3.2A8.5 8.5 0 1 1 21 12Z" />
    </ShellIcon>
  );
}

function IconBell() {
  return (
    <ShellIcon>
      <path d="M15 17H5l1.2-1.2A2 2 0 0 0 6.8 14V11a5.2 5.2 0 1 1 10.4 0v3a2 2 0 0 0 .6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </ShellIcon>
  );
}

function EmptyLogin({ text }) {
  return (
    <div className="stateCard">
      <h3 className="stateCard__title">Necesitas iniciar sesión</h3>
      <p className="stateCard__text">{text}</p>
      <Link to="/login" className="feedCard__action feedCard__action--primary">
        Iniciar sesión
      </Link>
    </div>
  );
}

function MessageRow({ thread, onOpen }) {
  const unreadCount = getUnreadCount(thread);

  return (
    <button
      type="button"
      className={`messageCard${unreadCount > 0 ? " messageCard--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
      style={{ width: "100%", textAlign: "left", border: "none", padding: 16 }}
    >
      <div className="messageCard__head">
        <div className="messageCard__user">
          {thread?.avatar_url ? (
            <img
              src={thread.avatar_url}
              alt={getThreadName(thread)}
              className="messageCard__avatar"
            />
          ) : (
            <div
              className="messageCard__avatar"
              style={{ display: "grid", placeItems: "center", fontWeight: 800 }}
            >
              {initialsFromNameOrEmail(getThreadName(thread))}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h3 className="messageCard__name">{getThreadName(thread)}</h3>
            <p className="messageCard__meta">{timeAgoLabel(thread?.updated_at)}</p>
          </div>
        </div>

        {unreadCount > 0 ? (
          <span className="badge badge--primary">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </div>

      <div className="messageCard__body">
        <p className="messageCard__text">{getThreadPreview(thread)}</p>
      </div>
    </button>
  );
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

  const unreadThreads = useMemo(
    () => messageList.filter((t) => getUnreadCount(t) > 0).length,
    [messageList]
  );

  const unreadNotifications = useMemo(
    () => notificationsList.filter((item) => item?.unread).length,
    [notificationsList]
  );

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

  function renderMessagesContent() {
    if (!token) {
      return (
        <EmptyLogin text="Accede a tu cuenta para revisar tus conversaciones." />
      );
    }

    if (messagesLoading) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando mensajes</h3>
          <p className="stateCard__text">Estamos actualizando tu bandeja.</p>
        </div>
      );
    }

    if (messagesError) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudieron cargar</h3>
          <p className="stateCard__text">{messagesError}</p>
        </div>
      );
    }

    if (messageList.length === 0) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">No hay conversaciones</h3>
          <p className="stateCard__text">
            Cuando inicies o recibas mensajes, aparecerán aquí.
          </p>
        </div>
      );
    }

    return (
      <div className="messageList">
        {messageList.map((thread) => (
          <MessageRow key={thread.id} thread={thread} onOpen={openThread} />
        ))}
      </div>
    );
  }

  function renderNotificationsContent() {
    if (!token) {
      return <EmptyLogin text="Accede a tu cuenta para revisar tu actividad." />;
    }

    if (notificationsLoading) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando notificaciones</h3>
          <p className="stateCard__text">
            Estamos actualizando tu centro de actividad.
          </p>
        </div>
      );
    }

    if (notificationsError) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudieron cargar</h3>
          <p className="stateCard__text">{notificationsError}</p>
        </div>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="stateCard">
          <h3 className="stateCard__title">No hay notificaciones</h3>
          <p className="stateCard__text">
            Cuando ocurra algo relevante, aparecerá aquí.
          </p>
        </div>
      );
    }

    return (
      <div className="notificationList">
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
      <section className="heroPanel">
        <div className="heroPanel__top">
          <div>
            <span className="sectionEyebrow">Actividad</span>
          </div>

          <span className="heroPanel__badge">
            {currentTab === "messages" ? "Inbox" : "Alertas"}
          </span>
        </div>        
      </section>

      <section className="sectionBlock">
        <div className="tabBar" role="tablist" aria-label="Secciones de actividad">
          <button
            type="button"
            className={`tabBar__item${
              currentTab === "messages" ? " tabBar__item--active" : ""
            }`}
            onClick={() => switchTab("messages")}
          >
            <span style={{ display: "inline-flex", width: 16, height: 16 }}>
              <IconMessages />
            </span>
            <span>Mensajes</span>
            {unreadThreads > 0 ? (
              <span className="badge badge--primary">
                {unreadThreads > 99 ? "99+" : unreadThreads}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className={`tabBar__item${
              currentTab === "notifications" ? " tabBar__item--active" : ""
            }`}
            onClick={() => switchTab("notifications")}
          >
            <span style={{ display: "inline-flex", width: 16, height: 16 }}>
              <IconBell />
            </span>
            <span>Notificaciones</span>
            {unreadNotifications > 0 ? (
              <span className="badge badge--primary">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </button>
        </div>

        {currentTab === "messages" ? (
          <label className="searchBar" htmlFor="activity-message-search">
            <span
              className="searchBar__icon"
              style={{ display: "inline-flex", width: 18, height: 18 }}
            >
              <IconSearch />
            </span>
            <input
              id="activity-message-search"
              placeholder="Buscar conversación"
              value={messageQuery}
              onChange={(e) => setMessageQuery(e.target.value)}
              disabled={!token}
            />
          </label>
        ) : (
          <div className="rowBetween" style={{ gap: 10, flexWrap: "wrap" }}>
            <div className="tabBar" style={{ flex: 1 }}>
              <button
                type="button"
                className={`tabBar__item${
                  notifFilter === "all" ? " tabBar__item--active" : ""
                }`}
                onClick={() => setNotificationFilter("all")}
                disabled={notificationsLoading}
              >
                Todo
              </button>

              <button
                type="button"
                className={`tabBar__item${
                  notifFilter === "mentions" ? " tabBar__item--active" : ""
                }`}
                onClick={() => setNotificationFilter("mentions")}
                disabled={notificationsLoading}
              >
                Menciones
              </button>
            </div>

            <button
              type="button"
              className="feedCard__action"
              onClick={() => loadNotifications(notifFilter)}
              disabled={notificationsLoading || !token}
              aria-label="Recargar"
              title="Recargar"
              style={{ minHeight: 38 }}
            >
              <IconRefresh spinning={notificationsLoading} />
            </button>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        {currentTab === "messages"
          ? renderMessagesContent()
          : renderNotificationsContent()}
      </section>
    </section>
  );
}
