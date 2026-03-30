import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiDMThreads } from "../services/api";
import BottomNav from "./BottomNav";

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

function IconMessage() {
  return (
    <ShellIcon>
      <path d="M5 18.5 4 21l3.1-1.2c.6.1 1.3.2 1.9.2h7a5 5 0 0 0 5-5v-5a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v5c0 1.4.6 2.7 1.7 3.6Z" />
    </ShellIcon>
  );
}

function IconRun() {
  return (
    <ShellIcon>
      <path d="M13.5 5.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
      <path d="M7 20l2.2-5.1 2.1-1.6 1.7 1.2V20" />
      <path d="M10 9.5l2.5-1.5 2.5 1 2 2.5" />
      <path d="M9.5 12.5 7 14l-2 4" />
      <path d="M13.5 10.5 16 13" />
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

function IconProfile() {
  return (
    <ShellIcon>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </ShellIcon>
  );
}

const NAV_ITEMS = [
  { to: "/perfil", icon: <IconProfile />, label: "Perfil" },
  { to: "/mensajes", icon: <IconMessage />, label: "Mensajes", withCounter: true },
  { to: "/blablarun", icon: <IconRun />, label: "BlaBlaRun" },
  { to: "/groups", icon: <IconUsers />, label: "Grupos" },
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

export default function AppChrome({ children }) {
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
    <div className="app-shell app-shell--withChrome">
      <header className="app-topbar app-topbar--minimal">
        <div className="app-topbar__row">
          <div />
          <div className="app-topbar__actions">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                `app-topbar__profileIconOnly${isActive ? " app-sidebar__profileIconOnly--active" : ""}`
              }
              aria-label="Perfil"
              title="Perfil"
            >
              <span className="app-sidebar__iconGlyph">
                <IconProfile />
              </span>
            </NavLink>
          </div>
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
        </div>
      </aside>

      <main className="app-main app-main--withChrome">
        <div className="app-main__inner">{children}</div>
      </main>

      <BottomNav unreadMessages={unreadMessages} />
    </div>
  );
}
