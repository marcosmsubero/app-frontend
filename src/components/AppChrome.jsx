import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";

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

function IconBolt() {
  return (
    <ShellIcon>
      <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" />
    </ShellIcon>
  );
}

const NAV_ITEMS = [
  { to: "/", icon: <IconHome />, label: "Inicio" },
  { to: "/explorar", icon: <IconMeetups />, label: "Quedadas" },
  { to: "/groups", icon: <IconUsers />, label: "Grupos" },
  { to: "/mensajes", icon: <IconMessage />, label: "Mensajes" },
];

function getInitials(me) {
  const raw =
    me?.full_name ||
    me?.name ||
    me?.display_name ||
    me?.handle ||
    me?.email ||
    "U";

  return String(raw)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function DesktopNavItem({ to, icon, label }) {
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
    </NavLink>
  );
}

export default function AppChrome({ me }) {
  const location = useLocation();
  const initials = useMemo(() => getInitials(me), [me]);

  return (
    <>
      <header className="app-topbar app-topbar--minimal">

        <NavLink
          to="/perfil"
          className="app-topbar__profileIconOnly"
          aria-label="Perfil"
          title="Perfil"
        >
          <div className="app-avatar" aria-hidden="true">
            {initials}
          </div>
        </NavLink>
      </header>

      <aside className="app-sidebar app-sidebar--floating" aria-label="Navegación principal">
        <div className="app-sidebar__floatingRail">
          <NavLink
            to="/"
            aria-label="Inicio"
            title="Inicio"
            className={({ isActive }) =>
              `app-sidebar__brandIconOnly${isActive ? " app-sidebar__brandIconOnly--active" : ""}`
            }
          >
            <span aria-hidden="true">
              <IconBolt />
            </span>
          </NavLink>

          <nav className="app-sidebar__iconNav">
            {NAV_ITEMS.map((item) => (
              <DesktopNavItem key={item.to} {...item} />
            ))}
          </nav>

          <NavLink
            to="/perfil"
            aria-label="Perfil"
            title="Perfil"
            className={({ isActive }) =>
              `app-sidebar__profileIconOnly${isActive ? " app-sidebar__profileIconOnly--active" : ""}`
            }
          >
            {me?.avatar_url ? (
              <img
                src={me.avatar_url}
                alt=""
                className="app-sidebar__profileAvatarImage"
              />
            ) : (
              <div className="app-avatar" aria-hidden="true">
                {initials}
              </div>
            )}
            <span className="sr-only">Perfil</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
