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
  if (notification?.type === "message") return "/actividad?tab=messages";
  if (notification?.type === "group") return "/groups";
  if (notification?.type === "meetup") return "/explorar";
  return "/actividad?tab=notifications";
}

export default function ActivityPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") === "notifications" ? "notifications" : "messages";
  const notifFilter = searchParams.get("filter") === "mentions" ? "mentions" : "all";

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
    }, 300);

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
    if (tab !== "notifications") {
      next.delete("filter");
    }
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

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body">
          <div className="page__header">
            <span className="page__eyebrow">Actividad</span>
            <h1 className="page__title">Mensajes y notificaciones</h1>
            <p className="page__subtitle">
              Un único centro para tus conversaciones y tu actividad reciente.
            </p>
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card__body">
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
        </div>
      </div>

      {currentTab === "messages" ? (
        <div className="page__columns">
          <div className="app-stack app-stack--lg">
            <div className="app-card">
              <div className="app-card__header">
                <div className="app-section-header">
                  <div>
                    <div className="app-section-header__title">
                      Bandeja de conversaciones
                    </div>

                    <div className="app-section-header__subtitle">
                      Tus chats ordenados por actividad reciente.
                    </div>
                  </div>

                  {unreadThreads > 0 && (
                    <span className="app-badge app-badge--primary">
                      {unreadThreads} sin leer
                    </span>
                  )}
                </div>
              </div>

              <div className="app-card__body app-stack">
                <div className="messagesSimple__toolbar">
                  <div className="app-field">
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

                {!token ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>Necesitas iniciar sesión</strong>
                      <p>Accede a tu cuenta para revisar tus conversaciones.</p>
                      <Link to="/login" className="app-button app-button--primary">
                        Iniciar sesión
                      </Link>
                    </div>
                  </div>
                ) : messagesLoading ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>Cargando mensajes</strong>
                      <p>Estamos actualizando tu bandeja.</p>
                    </div>
                  </div>
                ) : messagesError ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>No se pudieron cargar</strong>
                      <p>{messagesError}</p>
                    </div>
                  </div>
                ) : messageList.length === 0 ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>No hay conversaciones</strong>
                      <p>Cuando inicies o recibas mensajes, aparecerán aquí.</p>
                    </div>
                  </div>
                ) : (
                  <div className="messagesSimple__list">
                    {messageList.map((thread) => (
                      <MessageRow key={thread.id} thread={thread} onOpen={openThread} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="page__sidebar">
            <div className="app-card app-card--soft">
              <div className="app-card__body app-stack">
                <div className="app-section-header__title">
                  Centro de mensajes
                </div>

                <p className="app-text-soft">
                  Coordina quedadas, responde a otros usuarios y revisa tu actividad.
                </p>

                <div className="app-list">
                  <div className="app-list-item">
                    <div className="app-badge app-badge--primary">Chats</div>
                    <div>
                      <strong>Conversaciones privadas</strong>
                      <div className="app-text-soft">
                        Mensajes directos entre usuarios.
                      </div>
                    </div>
                  </div>

                  <div className="app-list-item">
                    <div className="app-badge app-badge--success">Grupos</div>
                    <div>
                      <strong>Mensajes de comunidad</strong>
                      <div className="app-text-soft">
                        Actividad dentro de grupos y planes.
                      </div>
                    </div>
                  </div>

                  <div className="app-list-item">
                    <div className="app-badge app-badge--warning">Actividad</div>
                    <div>
                      <strong>Coordina actividades</strong>
                      <div className="app-text-soft">
                        Mantén conversaciones antes de una quedada.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <section className="notificationsSimple">
          <div className="notificationsSimple__hero app-section">
            <div className="notificationsSimple__heroCopy">
              <span className="app-kicker">Notificaciones</span>
              <h2 className="notificationsSimple__title">Actividad reciente</h2>
              <p className="notificationsSimple__subtitle">
                Revisa mensajes, menciones y cambios relevantes relacionados con tu actividad.
              </p>
            </div>

            <div className="notificationsSimple__heroActions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => loadNotifications(notifFilter)}
                disabled={notificationsLoading || !token}
              >
                {notificationsLoading ? "Actualizando…" : "Recargar"}
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
                ) : notificationsLoading ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>Cargando notificaciones</strong>
                      <p>Estamos actualizando tu centro de actividad.</p>
                    </div>
                  </div>
                ) : notificationsError ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>No se pudieron cargar</strong>
                      <p>{notificationsError}</p>
                    </div>
                  </div>
                ) : notificationsList.length === 0 ? (
                  <div className="app-empty">
                    <div className="notificationsSimple__emptyBody">
                      <strong>No hay notificaciones</strong>
                      <p>Cuando ocurra algo relevante en tu red deportiva, aparecerá aquí.</p>
                    </div>
                  </div>
                ) : (
                  <div className="notificationsSimple__list">
                    {notificationsList.map((notification) => (
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
                    <span className="app-badge app-badge--success">Grupos</span>
                    <p>Invitaciones, movimiento en comunidad o cambios compartidos.</p>
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
      )}
    </section>
  );
}
