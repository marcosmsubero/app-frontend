import { useState } from "react";

export default function ActivityPage({
  messageList = [],
  notificationsList = [],
}) {
  const [activeView, setActiveView] = useState("split"); // split | messages | notifications

  return (
    <section className="page activityPage">
      {/* HEADER SIMPLE */}
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

      {/* SPLIT VIEW */}
      <section className="activityPage__split">
        {/* MESSAGES */}
        <div
          className={`activityPage__column ${
            activeView === "messages" ? "isActive" : ""
          } ${activeView === "notifications" ? "isHidden" : ""}`}
          onClick={() => setActiveView("messages")}
        >
          {messageList.map((msg) => (
            <div key={msg.id} className="activityPage__item">
              <img
                src={msg.avatar || "/default-avatar.png"}
                alt=""
                className="activityPage__avatar"
              />
              <span className="activityPage__name">
                {msg.name || "Usuario"}
              </span>
            </div>
          ))}
        </div>

        {/* NOTIFICATIONS */}
        <div
          className={`activityPage__column ${
            activeView === "notifications" ? "isActive" : ""
          } ${activeView === "messages" ? "isHidden" : ""}`}
          onClick={() => setActiveView("notifications")}
        >
          {notificationsList.map((notif) => (
            <div key={notif.id} className="activityPage__item">
              <img
                src={notif.avatar || "/default-avatar.png"}
                alt=""
                className="activityPage__avatar"
              />
              <span className="activityPage__name">
                {notif.name || "Usuario"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
