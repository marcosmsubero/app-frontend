import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

function getSectionMeta(pathname) {
  if (pathname === "/" || pathname === "/actividad" || pathname.startsWith("/actividad/")) {
    return {
      title: "Actividad",
      subtitle: "Descubre runners, movimiento reciente y planes cerca de ti.",
      tone: "activity",
    };
  }

  if (pathname === "/blablarun" || pathname.startsWith("/blablarun/")) {
    return {
      title: "Eventos",
      subtitle: "Calendario social para crear y encontrar quedadas y carreras.",
      tone: "events",
    };
  }

  if (pathname === "/mensajes" || pathname.startsWith("/mensajes/")) {
    return {
      title: "Mensajes",
      subtitle: "Conversaciones directas con tu comunidad de running.",
      tone: "messages",
    };
  }

  if (
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    pathname.startsWith("/mi-perfil")
  ) {
    return {
      title: "Perfil",
      subtitle: "Tu identidad deportiva, tus conexiones y tu actividad.",
      tone: "profile",
    };
  }

  if (pathname === "/notificaciones" || pathname.startsWith("/notificaciones/")) {
    return {
      title: "Notificaciones",
      subtitle: "Alertas relevantes sobre actividad, eventos y mensajes.",
      tone: "notifications",
    };
  }

  if (pathname === "/ajustes" || pathname.startsWith("/ajustes/")) {
    return {
      title: "Ajustes",
      subtitle: "Configura tu cuenta y preferencias de la app.",
      tone: "settings",
    };
  }

  return {
    title: "BlaBlaRun",
    subtitle: "Running social, encuentros, comunidad y calendario.",
    tone: "default",
  };
}

const QUICK_LINKS = [
  {
    to: "/actividad",
    label: "Actividad",
    match: (pathname) =>
      pathname === "/" ||
      pathname === "/actividad" ||
      pathname.startsWith("/actividad/"),
  },
  {
    to: "/blablarun",
    label: "Eventos",
    match: (pathname) => pathname === "/blablarun" || pathname.startsWith("/blablarun/"),
  },
  {
    to: "/mensajes",
    label: "Mensajes",
    match: (pathname) => pathname === "/mensajes" || pathname.startsWith("/mensajes/"),
  },
  {
    to: "/perfil",
    label: "Perfil",
    match: (pathname) =>
      pathname === "/perfil" ||
      pathname.startsWith("/perfil/") ||
      pathname.startsWith("/mi-perfil"),
  },
];

function HeaderAction({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={`appChrome__action${active ? " appChrome__action--active" : ""}`}
      aria-label={label}
      title={label}
    >
      <span className="appChrome__actionIcon" aria-hidden="true">
        {icon}
      </span>
      <span className="appChrome__actionText">{label}</span>
    </Link>
  );
}

function QuickLink({ to, label, active }) {
  return (
    <NavLink
      to={to}
      className={`appChrome__quickLink${active ? " appChrome__quickLink--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="appChrome__quickLinkDot" aria-hidden="true" />
      <span className="appChrome__quickLinkLabel">{label}</span>
    </NavLink>
  );
}

export default function AppChrome() {
  const location = useLocation();
  const meta = getSectionMeta(location.pathname);

  const isMessages = location.pathname === "/mensajes" || location.pathname.startsWith("/mensajes/");
  const isNotifications =
    location.pathname === "/notificaciones" ||
    location.pathname.startsWith("/notificaciones/");
  const isSettings = location.pathname === "/ajustes" || location.pathname.startsWith("/ajustes/");

  return (
    <div className={`appChrome appChrome--tone-${meta.tone}`}>
      <header className="appChrome__header">
        <div className="appChrome__headerInner">
          <div className="appChrome__topRow">
            <div className="appChrome__brandBlock">
              <Link to="/actividad" className="appChrome__brand">
                <span className="appChrome__brandMark" aria-hidden="true">
                  BR
                </span>

                <span className="appChrome__brandCopy">
                  <span className="appChrome__brandEyebrow">Running social</span>
                  <span className="appChrome__brandText">BlaBlaRun</span>
                </span>
              </Link>
            </div>

            <div className="appChrome__actions" aria-label="Acciones rápidas">
              <HeaderAction
                to="/notificaciones"
                label="Notificaciones"
                active={isNotifications}
                icon={
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5.25a4.25 4.25 0 0 0-4.25 4.25v1.18c0 .62-.18 1.23-.52 1.75L6 14.5h12l-1.23-2.07a3.4 3.4 0 0 1-.52-1.75V9.5A4.25 4.25 0 0 0 12 5.25Z" />
                    <path d="M10 17.5a2 2 0 0 0 4 0" />
                  </svg>
                }
              />

              <HeaderAction
                to="/ajustes"
                label="Ajustes"
                active={isSettings}
                icon={
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
                    <path d="M19 12a7.36 7.36 0 0 0-.08-1l1.56-1.22-1.5-2.6-1.92.52a7.9 7.9 0 0 0-1.73-1L15 4h-3l-.33 1.7c-.61.2-1.18.48-1.72.83l-1.92-.52-1.5 2.6L8.08 11c-.05.33-.08.66-.08 1s.03.67.08 1l-1.55 1.22 1.5 2.6 1.92-.52c.54.35 1.11.63 1.72.83L12 20h3l.33-1.7c.61-.2 1.18-.48 1.73-.83l1.92.52 1.5-2.6L18.92 13c.05-.33.08-.66.08-1Z" />
                  </svg>
                }
              />
            </div>
          </div>

          <div className="appChrome__heroCard">
            <div className="appChrome__heroMeta">
              <span className="appChrome__heroKicker">Tu espacio</span>
              <h1 className="appChrome__title">{meta.title}</h1>
              <p className="appChrome__subtitle">{meta.subtitle}</p>
            </div>

            <div className="appChrome__heroBadge" aria-hidden="true">
              <span className="appChrome__heroBadgeRing" />
              <span className="appChrome__heroBadgeDot" />
            </div>
          </div>

          <div className="appChrome__quickLinks" aria-label="Secciones principales">
            {QUICK_LINKS.map((item) => (
              <QuickLink
                key={item.to}
                to={item.to}
                label={item.label}
                active={item.match(location.pathname)}
              />
            ))}
          </div>
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
