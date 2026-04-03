import { useState } from "react";
import "./activity.css";

export default function ActivityPage({
  messageList = [],
  notificationsList = [],
  unreadThreads = 0,
  unreadNotifications = 0,
}) {
  const [activeView, setActiveView] = useState("split"); // split | messages | notifications

  return (
    <section className="page activityPage">
      {/* HEADER SIMPLE */}
      <section className="sectionBlock">
        <div className="app-section-header">
          <div className="activityCounters">
            <div className="activityCounter">
              <span>Mensajes</span>
              <strong>{messageList.length}</strong>
            </div>

            <div className="activityCounter">
              <span>Notificaciones</span>
              <strong>{notificationsList.length}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="activitySplitWrapper">
        {/* MESSAGES */}
        <div
          className={`activityColumn activityColumn--messages ${
            activeView === "messages" ? "isActive" : ""
          } ${activeView === "notifications" ? "isHidden" : ""}`}
          onClick={() => setActiveView("messages")}
        >
          {messageList.map((msg) => (
            <div key={msg.id} className="activityItem">
              <img
                src={msg.avatar || "/default-avatar.png"}
                alt=""
                className="activityItem__avatar"
              />
              <span className="activityItem__name">
                {msg.name || "Usuario"}
              </span>
            </div>
          ))}
        </div>

        {/* NOTIFICATIONS */}
        <div
          className={`activityColumn activityColumn--notifications ${
            activeView === "notifications" ? "isActive" : ""
          } ${activeView === "messages" ? "isHidden" : ""}`}
          onClick={() => setActiveView("notifications")}
        >
          {notificationsList.map((notif) => (
            <div key={notif.id} className="activityItem">
              <img
                src={notif.avatar || "/default-avatar.png"}
                alt=""
                className="activityItem__avatar"
              />
              <span className="activityItem__name">
                {notif.name || "Usuario"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
