import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ...tus imports originales (NO TOCAR)

export default function ActivityPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [messageQuery, setMessageQuery] = useState("");
  const [threads, setThreads] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [activeView, setActiveView] = useState("split");

  const timerRef = useRef(null);

  async function loadMessages(query = messageQuery) {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await apiDMThreads(query || "", token);
      setThreads(Array.isArray(res) ? res : res?.items || []);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function loadNotifications() {
    if (!token) return;
    setNotificationsLoading(true);
    try {
      const res = await apiNotifications("all", token);
      setNotifications(Array.isArray(res) ? res : res?.items || []);
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    loadMessages("");
    loadNotifications();
  }, [token]);

  const messageList = useMemo(() => threads || [], [threads]);
  const notificationsList = useMemo(() => notifications || [], [notifications]);

  function openThread(thread) {
    if (!thread?.id) return;
    nav(`/mensajes/${thread.id}`);
  }

  function openNotif(notification) {
    if (!notification) return;
    nav(routeFromNotif(notification));
  }

  return (
    <section className="page activityPage">
      {/* HEADER */}
      <section className="sectionBlock">
        <div className="app-section-header">
          <div className="activityPage__counters">
            <div className="activityPage__counter">
              <span>Mensajes</span>
              <strong>{messageList.length}</strong>
            </div>

            <div className="activityPage__counter">
              <span>Notificaciones</span>
              <strong>{notificationsList.length}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT */}
      <section className="activityPage__split">
        {/* MENSAJES */}
        <div
          className={`activityPage__column ${
            activeView === "messages" ? "isActive" : ""
          } ${activeView === "notifications" ? "isHidden" : ""}`}
          onClick={() => setActiveView("messages")}
        >
          {messageList.map((thread) => (
            <div
              key={thread.id}
              className="activityPage__item"
              onClick={(e) => {
                e.stopPropagation(); // 🔥 FIX CLAVE
                openThread(thread);
              }}
            >
              <img
                src={thread.avatar_url}
                alt=""
                className="activityPage__avatar"
              />
              <span className="activityPage__name">
                {getThreadName(thread)}
              </span>
            </div>
          ))}
        </div>

        {/* NOTIFICACIONES */}
        <div
          className={`activityPage__column ${
            activeView === "notifications" ? "isActive" : ""
          } ${activeView === "messages" ? "isHidden" : ""}`}
          onClick={() => setActiveView("notifications")}
        >
          {notificationsList.map((n) => (
            <div
              key={n.id}
              className="activityPage__item"
              onClick={(e) => {
                e.stopPropagation(); // 🔥 FIX CLAVE
                openNotif(n);
              }}
            >
              <img
                src={n.avatar_url}
                alt=""
                className="activityPage__avatar"
              />
              <span className="activityPage__name">
                {n.from || "Usuario"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
