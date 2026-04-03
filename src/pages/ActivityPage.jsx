import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function getThreadName(thread) {
  return (
    thread?.name ||
    thread?.title ||
    thread?.user_name ||
    thread?.participant_name ||
    "Conversación"
  );
}

function getUnreadCount(thread) {
  if (typeof thread?.unread_count === "number") return thread.unread_count;
  if (thread?.unread === true) return 1;
  return 0;
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

function ActivityIdentityItem({ avatarUrl, fallbackText, name, onClick }) {
  return (
    <button
      type="button"
      className="activityPageSplit__item"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="activityPageSplit__avatar"
        />
      ) : (
        <div className="activityPageSplit__avatar activityPageSplit__avatar--fallback">
          {initialsFromNameOrEmail(fallbackText || name)}
        </div>
      )}

      <span className="activityPageSplit__name">{name}</span>
    </button>
  );
}

export default function ActivityPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [messageQuery] = useState("");
  const [threads, setThreads] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [activePane, setActivePane] = useState("split"); // split | messages | notifications

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

  async function loadNotifications() {
    if (!token) {
      setNotifications([]);
      setNotificationsError("");
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const res = await apiNotifications("all", token);
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
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  function renderMessagesPane() {
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
      <div className="activityPageSplit__list">
        {messageList.map((thread) => (
          <ActivityIdentityItem
            key={thread.id}
            avatarUrl={thread?.avatar_url}
            fallbackText={getThreadName(thread)}
            name={getThreadName(thread)}
            onClick={() => openThread(thread)}
          />
        ))}
      </div>
    );
  }

  function renderNotificationsPane() {
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
      <div className="activityPageSplit__list">
        {notificationsList.map((notification) => (
          <ActivityIdentityItem
            key={notification.id}
            avatarUrl={notification?.avatar_url}
            fallbackText={notification?.from}
            name={notification?.from || "Actividad"}
            onClick={() => openNotif(notification)}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="page activityPage">
      <section className="sectionBlock">
        <div className="app-section-header activityPageSplit__header">
          <div className="activityPageSplit__counters">
            <div className="activityPageSplit__counter">
              <span>Mensajes</span>
              <strong>{messageList.length}</strong>
            </div>

            <div className="activityPageSplit__counter">
              <span>Notificaciones</span>
              <strong>{notificationsList.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`sectionBlock activityPageSplit activityPageSplit--${activePane}`}
      >
        <div
          className={`activityPageSplit__pane activityPageSplit__pane--messages${
            activePane === "messages" ? " is-expanded" : ""
          }${activePane === "notifications" ? " is-collapsed" : ""}`}
          onClick={() => setActivePane("messages")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setActivePane("messages");
          }}
        >
          <div className="activityPageSplit__paneHead">
            <span className="activityPageSplit__paneLabel">Mensajes</span>
            <span className="activityPageSplit__paneCount">{unreadThreads}</span>
          </div>

          {renderMessagesPane()}
        </div>

        <div
          className={`activityPageSplit__pane activityPageSplit__pane--notifications${
            activePane === "notifications" ? " is-expanded" : ""
          }${activePane === "messages" ? " is-collapsed" : ""}`}
          onClick={() => setActivePane("notifications")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActivePane("notifications");
            }
          }}
        >
          <div className="activityPageSplit__paneHead">
            <span className="activityPageSplit__paneLabel">Notificaciones</span>
            <span className="activityPageSplit__paneCount">
              {unreadNotifications}
            </span>
          </div>

          {renderNotificationsPane()}
        </div>
      </section>
    </section>
  );
}
