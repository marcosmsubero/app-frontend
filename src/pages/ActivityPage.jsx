import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  apiDMThreads,
  apiNotifications,
  apiMarkNotifRead,
} from "../services/api";
import { useRealtimeThreadList } from "../hooks/useRealtimeChat";
import { useI18n } from "../i18n/index.jsx";
import "../styles/activity-page.css";

function initialsFrom(text) {
  const s = String(text || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

function timeAgo(dateOrIso) {
  try {
    const ms = Date.now() - new Date(dateOrIso).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "ahora";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} d`;
    const w = Math.floor(d / 7);
    return `${w} sem`;
  } catch {
    return "";
  }
}

function threadName(thread) {
  return thread?.name || thread?.title || thread?.user_name || thread?.participant_name || "Conversación";
}

function threadPreview(thread) {
  return thread?.last_message || thread?.preview || thread?.snippet || "Sin mensajes recientes";
}

function threadUnread(thread) {
  if (typeof thread?.unread_count === "number") return thread.unread_count;
  if (thread?.unread === true) return 1;
  return 0;
}

function Avatar({ url, fallback, size = 52 }) {
  const style = { width: size, height: size };

  if (url) {
    return <img src={url} alt={fallback || ""} className="actv__avatar" style={style} />;
  }

  return (
    <div className="actv__avatar actv__avatar--fallback" style={style}>
      {initialsFrom(fallback)}
    </div>
  );
}

function ThreadRow({ thread, onOpen }) {
  const unread = threadUnread(thread);
  const name = threadName(thread);

  return (
    <button
      type="button"
      className={`actv__row${unread > 0 ? " actv__row--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
    >
      <Avatar url={thread?.avatar_url} fallback={name} />

      <div className="actv__rowBody">
        <div className="actv__rowTop">
          <span className="actv__rowName">{name}</span>
          <span className="actv__rowTime">{timeAgo(thread?.updated_at)}</span>
        </div>
        <p className="actv__rowPreview">{threadPreview(thread)}</p>
      </div>

      {unread > 0 ? (
        <span className="actv__badge">{unread > 99 ? "99+" : unread}</span>
      ) : (
        <span className="actv__chevron" aria-hidden="true">›</span>
      )}
    </button>
  );
}

function NotifRow({ notification }) {
  return (
    <div
      className={`actv__row actv__row--static${notification.unread ? " actv__row--unread" : ""}`}
    >
      <Avatar url={notification?.avatar_url} fallback={notification?.from} />

      <div className="actv__rowBody">
        <div className="actv__rowTop">
          <span className="actv__rowName">{notification?.from || "Actividad"}</span>
          <span className="actv__rowTime">{timeAgo(notification?.created_at)}</span>
        </div>
        <p className="actv__rowPreview">
          {notification?.text || "Ha generado una notificación."}
        </p>
      </div>

      {notification.unread ? <span className="actv__dot" /> : null}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="actv__empty">
      <p className="actv__emptyTitle">{title}</p>
      <p className="actv__emptyText">{text}</p>
    </div>
  );
}

export default function ActivityPage() {
  const nav = useNavigate();
  const { token, user } = useAuth();
  const { t } = useI18n();

  const [tab, setTab] = useState("messages");

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsError, setNotifsError] = useState("");

  async function loadThreads() {
    if (!token) { setThreads([]); return; }
    setThreadsLoading(true);
    setThreadsError("");
    try {
      const res = await apiDMThreads("", token);
      setThreads(Array.isArray(res) ? res : res?.items || []);
    } catch (e) {
      setThreadsError(e?.message || "No se pudieron cargar los mensajes");
    } finally {
      setThreadsLoading(false);
    }
  }

  async function loadNotifs() {
    if (!token) { setNotifications([]); return; }
    setNotifsLoading(true);
    setNotifsError("");
    try {
      const res = await apiNotifications("all", token);
      const items = Array.isArray(res) ? res : res?.items || [];

      setNotifications(items);

      const unreadItems = items.filter((item) => item?.id && item?.unread);

      if (unreadItems.length > 0) {
        await Promise.allSettled(
          unreadItems.map((item) => apiMarkNotifRead(item.id, token))
        );

        setNotifications((prev) =>
          prev.map((item) => ({ ...item, unread: false }))
        );
      }
    } catch (e) {
      setNotifsError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setNotifsLoading(false);
    }
  }

  useEffect(() => { loadThreads(); }, [token]);
  useEffect(() => { loadNotifs(); }, [token]);

  // Refresh data when window regains focus (picks up avatar changes etc.)
  useEffect(() => {
    function handleFocus() {
      if (token) {
        loadThreads();
        loadNotifs();
      }
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [token]);

  // Real-time: auto-refresh thread list when a new message arrives
  useRealtimeThreadList(user?.id, () => {
    loadThreads();
  });

  const unreadMessages = useMemo(
    () => threads.filter((t) => threadUnread(t) > 0).length,
    [threads]
  );

  const unreadNotifs = useMemo(
    () => notifications.filter((n) => n?.unread).length,
    [notifications]
  );

  function openThread(thread) {
    if (!thread?.id) return;
    nav(`/mensajes/${thread.id}`, { state: { threadIds: threads.map((t) => t.id) } });
  }

  if (!token) {
    return (
      <section className="page actv">
        <div className="actv__loginCard">
          <p className="actv__emptyTitle">{t("activity.loginRequired")}</p>
          <p className="actv__emptyText">Accede a tu cuenta para ver mensajes y notificaciones.</p>
          <Link to="/login" className="app-button app-button--primary">{t("auth.login")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page actv">
      <div className="actv__tabs">
        <button
          type="button"
          className={`actv__tab${tab === "messages" ? " actv__tab--active" : ""}`}
          onClick={() => setTab("messages")}
        >
          {t("activity.messages")}
          {unreadMessages > 0 ? <span className="actv__tabBadge">{unreadMessages}</span> : null}
        </button>

        <button
          type="button"
          className={`actv__tab${tab === "notifications" ? " actv__tab--active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          {t("activity.notifications")}
          {unreadNotifs > 0 ? <span className="actv__tabBadge">{unreadNotifs}</span> : null}
        </button>
      </div>

      <div className="actv__list">
        {tab === "messages" ? (
          threadsLoading ? (
            <EmptyState title={t("activity.loadingMessages")} text="Estamos actualizando tu bandeja." />
          ) : threadsError ? (
            <EmptyState title={t("general.error")} text={threadsError} />
          ) : threads.length === 0 ? (
            <EmptyState
              title={t("activity.noConversations")}
              text="Cuando inicies o recibas mensajes, aparecerán aquí."
            />
          ) : (
            threads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} onOpen={openThread} />
            ))
          )
        ) : (
          notifsLoading ? (
            <EmptyState title={t("activity.loadingNotifications")} text="Estamos actualizando tu actividad." />
          ) : notifsError ? (
            <EmptyState title={t("general.error")} text={notifsError} />
          ) : notifications.length === 0 ? (
            <EmptyState
              title={t("activity.noNotifications")}
              text="Cuando ocurra algo relevante, aparecerá aquí."
            />
          ) : (
            notifications.map((notification) => (
              <NotifRow key={notification.id} notification={notification} />
            ))
          )
        )}
      </div>
    </section>
  );
}
