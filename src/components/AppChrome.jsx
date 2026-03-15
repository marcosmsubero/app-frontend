import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiDMThreads } from "../services/api";

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

function IconHome() {
  return (
    <ShellIcon>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </ShellIcon>
  );
}

function IconMeetups() {
  return (
    <ShellIcon>
      <path d="M12 21s-6.5-4.35-6.5-10A4.5 4.5 0 0 1 10 6.5c.84 0 1.64.23 2.35.65A4.46 4.46 0 0 1 14.7 6.5 4.5 4.5 0 0 1 19.5 11c0 5.65-7.5 10-7.5 10Z" />
      <path d="M12 9.2v3.8" />
      <path d="M10.1 11.1H14" />
    </ShellIcon>
  );
}

function IconUsers() {
  return (
    <ShellIcon>
      <path d="M16 20a4 4 0 0 0-8 0" />
      <circle cx="12" cy="10" r="3.5" />
      <path d="M20 19a3.5 3.5 0 0 0-3-3.46" />
      <path d="M17.5 6.7A3 3 0 0 1 18 12.6" />
    </ShellIcon>
  );
}

function IconMessage() {
  return (
    <ShellIcon>
      <path d="M5 18.5 4 21l3.1-1.2c.6.1 1.3.2 1.9.2h7a5 5 0 0 0 5-5v-5a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v5c0 1.4.6 2.7 1.7 3.6Z" />
    </ShellIcon>
  );
}

function IconProfile() {
  return (
    <ShellIcon>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </ShellIcon>
  );
}

function IconSettings() {
  return (
    <ShellIcon>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.91V20a2 2 0 0 1-4 0v-.08a1 1 0 0 0-.66-.94 1 1 0 0 0-1.09.23l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.91-.6H4a2 2 0 0 1 0-4h.08a1 1 0 0 0 .94-.66 1 1 0 0 0-.23-1.09l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.91V4a2 2 0 0 1 4 0v.08a1 1 0 0 0 .66.94 1 1 0 0 0 1.09-.23l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1 1 0 0 0-.2 1.1 1 1 0 0 0 .91.6H20a2 2 0 0 1 0 4h-.08a1 1 0 0 0-.94.66 1 1 0 0 0 .23 1.09Z" />
    </ShellIcon>
  );
}

const NAV_ITEMS = [
  { to: "/", icon: <IconHome />, label: "Inicio" },
  { to: "/explorar", icon: <IconMeetups />, label: "Quedadas" },
  { to: "/groups", icon: <IconUsers />, label: "Grupos" },
  { to: "/mensajes", icon: <IconMessage />, label: "Mensajes", withCounter: true },
];

function getUnreadCount(thread) {
  if (typeof thread?.unread_count === "number") return thread.unread_count;
  if (thread?.unread === true) return 1;
  return 0;
}

function DesktopNavItem({ to, icon, label, badgeCount = 0 }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `app-sidebar__iconLink${isActive ? " app-sidebar__iconLink--active" : ""}`
      }
    >
      <span className="app-sidebar__iconGlyph">{icon}</span>

      {badgeCount > 0 ? (
        <span className="app-sidebar__iconBadge">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </NavLink>
  );
}

export default function AppChrome() {
  const { token } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      if (!token) {
        setUnreadMessages(0);
        return;
      }

      try {
        const res = await apiDMThreads("", token);
        const items = Array.isArray(res) ? res : res?.items || [];
        const total = items.reduce((acc, thread) => acc + getUnreadCount(thread), 0);

        if (!cancelled) {
          setUnreadMessages(total);
        }
      } catch {
        if (!cancelled) {
          setUnreadMessages(0);
        }
      }
    }

    loadUnread();
    const intervalId = window.setInterval(loadUnread, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  return (
    <>
      <header className="app-topbar app-topbar--minimal">
        <div className="app-topbar__actions">
          <NavLink
            to="/ajustes"
            className={({ isActive }) =>
              `app-topbar__profileIconOnly${isActive ? " app-sidebar__profileIconOnly--active" : ""}`
            }
            aria-label="Ajustes"
            title="Ajustes"
          >
            <IconSettings />
          </NavLink>

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `app-topbar__profileIconOnly${isActive ? " app-sidebar__profileIconOnly--active" : ""}`
            }
            aria-label="Perfil"
            title="Perfil"
          >
            <IconProfile />
          </NavLink>
        </div>
      </header>

      <aside
        className="app-sidebar app-sidebar--floating"
        aria-label="Navegación principal"
      >
        <div className="app-sidebar__floatingRail">
          <nav className="app-sidebar__iconNav">
            {NAV_ITEMS.map((item) => (
              <DesktopNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                badgeCount={item.withCounter ? unreadMessages : 0}
              />
            ))}
          </nav>

          <div className="app-sidebar__bottomActions">
            <NavLink
              to="/ajustes"
              aria-label="Ajustes"
              title="Ajustes"
              className={({ isActive }) =>
                `app-sidebar__profileIconOnly${
                  isActive ? " app-sidebar__profileIconOnly--active" : ""
                }`
              }
            >
              <IconSettings />
            </NavLink>

            <NavLink
              to="/perfil"
              aria-label="Perfil"
              title="Perfil"
              className={({ isActive }) =>
                `app-sidebar__profileIconOnly${
                  isActive ? " app-sidebar__profileIconOnly--active" : ""
                }`
              }
            >
              <IconProfile />
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
