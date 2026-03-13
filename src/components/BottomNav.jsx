import { NavLink } from "react-router-dom";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14.9 9.1l-2.1 5.8-5.7 2.1 2.1-5.8 5.7-2.1Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM16.5 10.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.75 18.5c.9-2.58 3.03-4 5.25-4s4.35 1.42 5.25 4M14.25 18.5c.52-1.8 1.95-3 3.75-3 1.02 0 1.9.31 2.75.97"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 7.25h12a2.75 2.75 0 0 1 2.75 2.75v5A2.75 2.75 0 0 1 18 17.75H9.5L5 20v-2.25A2.75 2.75 0 0 1 3.25 15v-5A2.75 2.75 0 0 1 6 7.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 18.5c1.36-2.72 4-4.2 7-4.2s5.64 1.48 7 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ITEMS = [
  { to: "/", label: "Inicio", icon: <IconHome /> },
  { to: "/explorar", label: "Explorar", icon: <IconCompass /> },
  { to: "/groups", label: "Grupos", icon: <IconUsers /> },
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/perfil", label: "Perfil", icon: <IconProfile /> },
];

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="Navegación móvil">
      <div className="app-bottom-nav__inner">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `app-bottom-nav__item${isActive ? " app-bottom-nav__item--active" : ""}`
            }
          >
            <span className="app-bottom-nav__icon">{item.icon}</span>
            <span className="app-bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
