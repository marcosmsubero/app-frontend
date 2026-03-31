import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const QUICK_LINKS = [
  { to: "/actividad", label: "Actividad" },
  { to: "/blablarun", label: "Eventos" },
  { to: "/mensajes", label: "Mensajes" },
  { to: "/perfil", label: "Perfil" },
];

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

function IconBell() {
  return (
    <ShellIcon>
      <path d="M15 17H5l1.2-1.2A2 2 0 0 0 6.8 14V11a5.2 5.2 0 1 1 10.4 0v3a2 2 0 0 0 .6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </ShellIcon>
  );
}

function IconSettings() {
  return (
    <ShellIcon>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.9 1.9 0 0 1-2.7 2.7l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.9 1.9 0 0 1-3.8 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.9 1.9 0 0 1 0-3.8h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1.9 1.9 0 0 1 3.8 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.9 1.9 0 0 1 2.7 2.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1.9 1.9 0 0 1 0 3.8h-.2a1 1 0 0 0-.9.6Z" />
    </ShellIcon>
  );
}

function matchPath(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function getShellMeta(pathname) {
  if (pathname === "/" || matchPath(pathname, "/actividad")) {
    return {
      eyebrow: "Comunidad activa",
      title: "Actividad",
      subtitle: "Resumen rápido de mensajes, notificaciones y movimiento reciente.",
    };
  }

  if (matchPath(pathname, "/blablarun")) {
    return {
      eyebrow: "Planifica y sal",
      title: "Eventos",
      subtitle: "Quedadas, entrenos y planes listos para una experiencia 100% móvil.",
    };
  }

  if (matchPath(pathname, "/mensajes")) {
    return {
      eyebrow: "Conecta al instante",
      title: "Mensajes",
      subtitle: "Conversaciones compactas, directas y preparadas para usar con el pulgar.",
    };
  }

  if (matchPath(pathname, "/notificaciones")) {
    return {
      eyebrow: "Todo al día",
      title: "Notificaciones",
      subtitle: "Alertas importantes y actividad reciente en una sola vista clara.",
    };
  }

  if (matchPath(pathname, "/ajustes")) {
    return {
      eyebrow: "Control de cuenta",
      title: "Ajustes",
      subtitle: "Configura la app con una estructura simple y consistente.",
    };
  }

  if (matchPath(pathname, "/eliminar-cuenta")) {
    return {
      eyebrow: "Seguridad",
      title: "Eliminar cuenta",
      subtitle: "Flujo claro, directo y sin distracciones para acciones sensibles.",
    };
  }

  if (
    matchPath(pathname, "/perfil") ||
    matchPath(pathname, "/mi-perfil")
  ) {
    return {
      eyebrow: "Identidad deportiva",
      title: "Perfil",
      subtitle: "Tu presencia en la comunidad, seguidores y actividad en formato móvil.",
    };
  }

  return {
    eyebrow: "App mobile-first",
    title: "BlaBlaRun",
    subtitle: "Base visual unificada para una experiencia móvil coherente y escalable.",
  };
}

function getActionClass(pathname, targetPath) {
  return `appChrome__action${matchPath(pathname, targetPath) ? " appChrome__action--active" : ""}`;
}

function getQuickLinkClass(pathname, targetPath) {
  return `appChrome__quickLink${matchPath(pathname, targetPath) ? " appChrome__quickLink--active" : ""}`;
}

export default function MobileShell() {
  const location = useLocation();
  const meta = getShellMeta(location.pathname);

  return (
    <div className="appChrome">
      <header className="appChrome__header">
        <div className="appChrome__headerInner">
          <div className="appChrome__topRow">
            <div className="appChrome__brandBlock">
              <Link to="/actividad" className="appChrome__brand" aria-label="Ir a actividad">
                <span className="appChrome__brandMark">BR</span>

                <span className="appChrome__brandCopy">
                  <span className="appChrome__brandEyebrow">App Deportes</span>
                  <span className="appChrome__brandText">BlaBlaRun</span>
                </span>
              </Link>
            </div>

            <div className="appChrome__actions">
              <NavLink
                to="/notificaciones"
                className={getActionClass(location.pathname, "/notificaciones")}
                aria-label="Notificaciones"
              >
                <span className="appChrome__actionIcon">
                  <IconBell />
                </span>
                <span className="appChrome__actionText">Notificaciones</span>
              </NavLink>

              <NavLink
                to="/ajustes"
                className={getActionClass(location.pathname, "/ajustes")}
                aria-label="Ajustes"
              >
                <span className="appChrome__actionIcon">
                  <IconSettings />
                </span>
                <span className="appChrome__actionText">Ajustes</span>
              </NavLink>
            </div>
          </div>

          <section className="appChrome__heroCard" aria-label="Cabecera de la pantalla">
            <div className="appChrome__heroMeta">
              <span className="appChrome__heroKicker">{meta.eyebrow}</span>
              <h1 className="appChrome__title">{meta.title}</h1>
              <p className="appChrome__subtitle">{meta.subtitle}</p>
            </div>

            <div className="appChrome__heroBadge" aria-hidden="true">
              <span className="appChrome__heroBadgeRing" />
              <span className="appChrome__heroBadgeDot" />
            </div>
          </section>

          <nav className="appChrome__quickLinks" aria-label="Accesos rápidos">
            {QUICK_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={getQuickLinkClass(location.pathname, item.to)}
              >
                <span className="appChrome__quickLinkDot" aria-hidden="true" />
                <span className="appChrome__quickLinkLabel">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="appChrome__main">
        <div className="appChrome__content">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
