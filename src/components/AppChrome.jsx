import { NavLink, Outlet } from "react-router-dom";
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

function IconActivity() {
  return (
    <ShellIcon>
      <path d="M4 12h3l2-4 4 8 2-4h5" />
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

function IconProfile() {
  return (
    <ShellIcon>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </ShellIcon>
  );
}

function IconMessage() {
  return (
    <ShellIcon>
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H4l2.6-3.2A8.5 8.5 0 1 1 21 12Z" />
    </ShellIcon>
  );
}

const NAV_ITEMS = [
  { to: "/perfil", icon: <IconProfile />, label: "Perfil" },
  { to: "/actividad", icon: <IconActivity />, label: "Actividad", withCounter: true },
  { to: "/blablarun", icon: <IconRun />, label: "BlaBlaRun" },
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
      <span className="sr-only">{label}</span>
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

        if (!cancelled) setUnreadMessages(total);
      } catch {
        if (!cancelled) setUnreadMessages(0);
      }
    }

    loadUnread();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="app-shell app-shell--refined">
      <aside className="app-sidebar app-sidebar--rail" aria-label="Navegación principal">
        <div className="app-sidebar__panel app-sidebar__panel--rail">
          <div className="app-sidebar__brand app-sidebar__brand--rail">
          </div>

          <nav className="app-sidebar__nav app-sidebar__nav--rail">
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

      <main className="app-main app-main--refined">
        <div className="app-main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
