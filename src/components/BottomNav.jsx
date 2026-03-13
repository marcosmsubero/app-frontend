import { NavLink } from "react-router-dom";

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

const ITEMS = [
  { to: "/", label: "Inicio", icon: <IconHome /> },
  { to: "/explorar", label: "Quedadas", icon: <IconMeetups /> },
  { to: "/groups", label: "Grupos", icon: <IconUsers /> },
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/perfil", label: "Perfil", icon: <IconProfile /> },
];

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="Navegación inferior">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `app-bottom-nav__item${isActive ? " app-bottom-nav__item--active" : ""}`
          }
        >
          <span className="app-bottom-nav__icon">{item.icon}</span>
          <span className="app-bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
