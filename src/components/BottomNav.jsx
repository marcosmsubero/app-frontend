import { NavLink } from "react-router-dom";

function ShellIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

const ITEMS = [
  { to: "/perfil", label: "Perfil", icon: <IconProfile /> },
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/blablarun", label: "BlaBlaRun", icon: <IconRun /> },
  { to: "/groups", label: "Grupos", icon: <IconUsers /> },
];

export default function BottomNav({ unreadMessages = 0 }) {
  return (
    <nav className="app-bottom-nav app-bottom-nav--instagram" aria-label="Navegación inferior">
      {ITEMS.map((item) => {
        const showBadge = item.to === "/mensajes" && unreadMessages > 0;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) =>
              `app-bottom-nav__item app-bottom-nav__item--iconOnly${
                isActive ? " app-bottom-nav__item--active" : ""
              }`
            }
          >
            <span className="app-bottom-nav__icon">{item.icon}</span>

            {showBadge ? (
              <span className="app-bottom-nav__badge">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            ) : null}

            <span className="sr-only">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
