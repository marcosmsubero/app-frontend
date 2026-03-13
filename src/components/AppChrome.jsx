import { NavLink, useLocation } from "react-router-dom";

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

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.1c0 .9-.26 1.77-.74 2.53L5.5 15.5h13l-1.26-1.87a4.48 4.48 0 0 1-.74-2.53V9A4.5 4.5 0 0 0 12 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18a2.2 2.2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13.5V10.5l-1.97-.47a5.9 5.9 0 0 0-.6-1.44l1.1-1.7-2.12-2.12-1.7 1.1a5.9 5.9 0 0 0-1.44-.6L13.5 3h-3l-.47 1.97a5.9 5.9 0 0 0-1.44.6l-1.7-1.1L4.77 6.6l1.1 1.7c-.27.46-.47.94-.6 1.44L3.3 10.5v3l1.97.47c.13.5.33.98.6 1.44l-1.1 1.7 2.12 2.12 1.7-1.1c.46.27.94.47 1.44.6L10.5 21h3l.47-1.97c.5-.13.98-.33 1.44-.6l1.7 1.1 2.12-2.12-1.1-1.7c.27-.46.47-.94.6-1.44L19.4 13.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
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

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: <IconHome /> },
  { to: "/explorar", label: "Explorar", icon: <IconCompass /> },
  { to: "/groups", label: "Grupos", icon: <IconUsers /> },
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/notificaciones", label: "Avisos", icon: <IconBell /> },
  { to: "/perfil", label: "Perfil", icon: <IconProfile /> },
];

const PAGE_META = {
  "/": {
    title: "Inicio",
    subtitle: "Actividad reciente, accesos rápidos y próximos planes.",
  },
  "/explorar": {
    title: "Explorar",
    subtitle: "Descubre quedadas, rutas y actividad deportiva cerca de ti.",
  },
  "/groups": {
    title: "Grupos",
    subtitle: "Encuentra comunidad, organiza planes y amplía tu red deportiva.",
  },
  "/mensajes": {
    title: "Mensajes",
    subtitle: "Coordina entrenamientos y quedadas con conversaciones más claras.",
  },
  "/notificaciones": {
    title: "Notificaciones",
    subtitle: "Consulta novedades, avisos y cambios importantes.",
  },
  "/perfil": {
    title: "Perfil",
    subtitle: "Tu identidad deportiva, agenda y publicaciones.",
  },
  "/ajustes": {
    title: "Ajustes",
    subtitle: "Configura cuenta, visibilidad y preferencias.",
  },
};

function getPageMeta(pathname) {
  if (pathname.startsWith("/groups/")) {
    return {
      title: "Grupo",
      subtitle: "Miembros, actividad, chat y organización interna.",
    };
  }

  if (pathname.startsWith("/mensajes/")) {
    return {
      title: "Conversación",
      subtitle: "Mantén el hilo del plan en curso.",
    };
  }

  if (pathname.startsWith("/seguidores")) {
    return {
      title: "Seguidores",
      subtitle: "Usuarios que siguen tu actividad y contenido.",
    };
  }

  if (pathname.startsWith("/siguiendo")) {
    return {
      title: "Siguiendo",
      subtitle: "Perfiles y deportistas que sigues en la app.",
    };
  }

  return PAGE_META[pathname] || PAGE_META["/"];
}

function getInitials(me) {
  const raw =
    me?.full_name ||
    me?.name ||
    me?.display_name ||
    me?.handle ||
    me?.email ||
    "Usuario";

  return String(raw)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function DesktopNavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
      }
    >
      <span className="app-sidebar__icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppChrome({ me }) {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);
  const initials = getInitials(me);

  return (
    <>
      <header className="app-topbar">
        <div className="app-topbar__inner">
          <div className="app-topbar__left">
            <NavLink to="/" className="app-brand" aria-label="Ir al inicio">
              <span className="app-brand__mark" />
              <span className="app-brand__text">
                <strong>App Deportes</strong>
                <small>Plataforma social deportiva</small>
              </span>
            </NavLink>
          </div>

          <div className="app-topbar__center">
            <div className="app-topbar__title">{meta.title}</div>
            <div className="app-topbar__subtitle">{meta.subtitle}</div>
          </div>

          <div className="app-topbar__right">
            <NavLink
              to="/notificaciones"
              className={({ isActive }) =>
                `app-topbar__quick-link${isActive ? " app-topbar__quick-link--active" : ""}`
              }
            >
              <IconBell />
              <span className="desktop-only">Avisos</span>
            </NavLink>

            <NavLink
              to="/ajustes"
              className={({ isActive }) =>
                `app-topbar__quick-link${isActive ? " app-topbar__quick-link--active" : ""}`
              }
            >
              <IconSettings />
              <span className="desktop-only">Ajustes</span>
            </NavLink>

            <NavLink to="/perfil" className="app-topbar__profile" aria-label="Ir al perfil">
              <span className="app-avatar app-avatar--sm">{initials}</span>
            </NavLink>
          </div>
        </div>
      </header>

      <aside className="app-desktop-sidebar">
        <div className="app-sidebar app-surface">
          <div className="app-sidebar__header">
            <div className="app-sidebar__eyebrow">Workspace</div>
            <div className="app-sidebar__title">App Deportes</div>
            <div className="app-sidebar__text">
              Gestiona comunidad, actividad y conversaciones desde una interfaz clara para móvil y escritorio.
            </div>
          </div>

          <nav className="app-sidebar__nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <DesktopNavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="app-sidebar__footer">
            <div className="app-sidebar__user">
              <span className="app-avatar">{initials}</span>
              <div className="app-sidebar__user-copy">
                <strong>{me?.handle || me?.name || "Tu perfil"}</strong>
                <span>{me?.email || "Cuenta activa"}</span>
              </div>
            </div>

            <NavLink to="/perfil" className="app-btn app-btn--secondary app-btn--sm">
              <IconProfile />
              Ver perfil
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
