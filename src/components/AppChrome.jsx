import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

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

function IconSearch() {
  return (
    <ShellIcon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
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

function IconBell() {
  return (
    <ShellIcon>
      <path d="M6.5 16.5h11" />
      <path d="M8 16.5v-4a4 4 0 1 1 8 0v4" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </ShellIcon>
  );
}

function IconSettings() {
  return (
    <ShellIcon>
      <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.7Z" />
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

function IconArrowUpRight() {
  return (
    <ShellIcon>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </ShellIcon>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: <IconHome /> },
  { to: "/explorar", label: "Quedadas", icon: <IconMeetups /> },
  { to: "/groups", label: "Grupos", icon: <IconUsers /> },
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/notificaciones", label: "Avisos", icon: <IconBell /> },
  { to: "/perfil", label: "Perfil", icon: <IconProfile /> },
];

const QUICK_ITEMS = [
  { to: "/mensajes", label: "Mensajes", icon: <IconMessage /> },
  { to: "/notificaciones", label: "Avisos", icon: <IconBell /> },
  { to: "/ajustes", label: "Ajustes", icon: <IconSettings /> },
];

const PAGE_META = {
  "/": {
    title: "Inicio",
    subtitle: "Actividad reciente, próximos planes y visión rápida de tu comunidad deportiva.",
    eyebrow: "Workspace",
  },
  "/explorar": {
    title: "Quedadas",
    subtitle: "Descubre actividades, rutas y planes cercanos con una interfaz pensada para decidir rápido.",
    eyebrow: "Explorar",
  },
  "/groups": {
    title: "Grupos",
    subtitle: "Encuentra comunidades, organiza planes y mantén tu red deportiva siempre activa.",
    eyebrow: "Comunidad",
  },
  "/mensajes": {
    title: "Mensajes",
    subtitle: "Coordina entrenamientos, rutas y encuentros desde una bandeja más clara y accionable.",
    eyebrow: "Conversaciones",
  },
  "/notificaciones": {
    title: "Notificaciones",
    subtitle: "Consulta avisos, seguimiento y novedades sin perder el contexto de tu actividad.",
    eyebrow: "Actividad",
  },
  "/perfil": {
    title: "Perfil",
    subtitle: "Tu identidad deportiva, tus publicaciones y tu calendario en un mismo espacio.",
    eyebrow: "Perfil",
  },
  "/ajustes": {
    title: "Ajustes",
    subtitle: "Configura cuenta, privacidad y preferencias de producto.",
    eyebrow: "Preferencias",
  },
};

function getPageMeta(pathname) {
  if (pathname.startsWith("/groups/")) {
    return {
      title: "Grupo",
      subtitle: "Miembros, actividad, organización interna y contexto compartido del equipo.",
      eyebrow: "Grupo",
    };
  }

  if (pathname.startsWith("/mensajes/")) {
    return {
      title: "Conversación",
      subtitle: "Mantén el hilo del plan en curso con un contexto claro y sin fricción.",
      eyebrow: "Chat",
    };
  }

  if (pathname.startsWith("/seguidores")) {
    return {
      title: "Seguidores",
      subtitle: "Usuarios que siguen tu actividad, publicaciones y próximos planes.",
      eyebrow: "Red",
    };
  }

  if (pathname.startsWith("/siguiendo")) {
    return {
      title: "Siguiendo",
      subtitle: "Perfiles, deportistas y comunidades que sigues dentro de la app.",
      eyebrow: "Red",
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

function getProfileName(me) {
  return me?.handle || me?.name || me?.full_name || "Tu perfil";
}

function getProfileSecondary(me) {
  return me?.full_name || me?.email || "Cuenta activa";
}

function DesktopNavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
      }
    >
      <span className="app-sidebar__link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function QuickNavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `app-topbar__quick-link${isActive ? " app-topbar__quick-link--active" : ""}`
      }
    >
      <span className="app-topbar__quick-link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppChrome({ me, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getPageMeta(location.pathname);
  const initials = getInitials(me);
  const profileName = useMemo(() => getProfileName(me), [me]);
  const profileSecondary = useMemo(() => getProfileSecondary(me), [me]);
  const [search, setSearch] = useState("");

  function handleSearchSubmit(event) {
    event.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/groups?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="app-shell app-shell--instagram">
      <div className="app-shell__inner">
        <header className="app-topbar">
          <div className="app-topbar__row">
            <div className="app-topbar__brand">
              <div className="app-topbar__brand-mark" aria-hidden="true">
                <IconBolt />
              </div>

              <div>
                <p className="app-topbar__eyebrow">{meta.eyebrow}</p>
                <h1 className="app-topbar__title">{meta.title}</h1>
                <p className="app-topbar__subtitle">{meta.subtitle}</p>
              </div>
            </div>

            <div className="app-topbar__actions" aria-label="Accesos rápidos">
              {QUICK_ITEMS.map((item) => (
                <QuickNavItem key={item.to} {...item} />
              ))}

              <NavLink
                to="/perfil"
                className="app-topbar__profile"
                aria-label="Ir al perfil"
              >
                <div className="app-avatar" aria-hidden="true">
                  {initials}
                </div>
                <div className="sr-only">Ir al perfil</div>
              </NavLink>
            </div>
          </div>
        </header>

        <div className="app-shell__layout">
          <aside className="app-sidebar" aria-label="Navegación principal">
            <div className="app-sidebar__panel">
              <div className="app-sidebar__brand app-sidebar__brand--instagram">
                <div className="app-sidebar__brand-icon" aria-hidden="true">
                  <IconBolt />
                </div>

                <div className="app-sidebar__brand-copy">
                  <p className="app-sidebar__brand-overline">Social Sports App</p>
                  <h2 className="app-sidebar__brand-title">App Deportes</h2>
                  <p className="app-sidebar__brand-description">
                    Plataforma social deportiva con foco en comunidad, planes y coordinación.
                  </p>
                </div>
              </div>

              <form
                className="app-sidebar__search"
                onSubmit={handleSearchSubmit}
                aria-label="Buscar grupos"
              >
                <label className="sr-only" htmlFor="app-sidebar-search">
                  Buscar grupos
                </label>

                <div className="app-sidebar__searchBox">
                  <span className="app-sidebar__searchIcon" aria-hidden="true">
                    <IconSearch />
                  </span>

                  <input
                    id="app-sidebar-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="app-sidebar__searchInput"
                    placeholder="Buscar grupos o perfiles"
                    autoComplete="off"
                  />
                </div>
              </form>

              <nav className="app-sidebar__nav">
                {NAV_ITEMS.map((item) => (
                  <DesktopNavItem key={item.to} {...item} />
                ))}
              </nav>

              <div className="app-sidebar__profile">
                <div className="app-avatar app-avatar--lg" aria-hidden="true">
                  {initials}
                </div>

                <div className="app-sidebar__profile-meta">
                  <strong className="app-sidebar__profile-name">
                    {profileName}
                  </strong>

                  <span className="app-sidebar__profile-email">
                    {profileSecondary}
                  </span>

                  <NavLink to="/perfil" className="app-sidebar__profile-link">
                    <span>Ver perfil</span>
                    <span
                      className="app-sidebar__profile-linkIcon"
                      aria-hidden="true"
                    >
                      <IconArrowUpRight />
                    </span>
                  </NavLink>
                </div>
              </div>
            </div>
          </aside>

          <main className="app-shell__content" role="main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
