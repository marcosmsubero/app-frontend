import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

function getSectionMeta(pathname) {
  if (pathname === "/" || pathname === "/actividad" || pathname.startsWith("/actividad/")) {
    return {
      title: "Actividad",
      subtitle: "Descubre movimiento, perfiles y planes en curso.",
    };
  }

  if (pathname === "/blablarun" || pathname.startsWith("/blablarun/")) {
    return {
      title: "BlaBlaRun",
      subtitle: "Calendario social para crear y encontrar quedadas de running.",
    };
  }

  if (
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    pathname.startsWith("/mi-perfil")
  ) {
    return {
      title: "Perfil",
      subtitle: "Tu identidad, tu historial y tu presencia en la comunidad.",
    };
  }

  if (pathname === "/mensajes" || pathname.startsWith("/mensajes/")) {
    return {
      title: "Mensajes",
      subtitle: "Conversaciones privadas con otros runners.",
    };
  }

  if (pathname === "/notificaciones" || pathname.startsWith("/notificaciones/")) {
    return {
      title: "Notificaciones",
      subtitle: "Actualizaciones relevantes de tu actividad y eventos.",
    };
  }

  return {
    title: "App",
    subtitle: "Running social, encuentros y comunidad.",
  };
}

function HeaderAction({ to, label, badge }) {
  return (
    <Link to={to} className="appChrome__action" aria-label={label} title={label}>
      <span className="appChrome__actionText">{label}</span>
      {badge ? <span className="appChrome__badge">{badge}</span> : null}
    </Link>
  );
}

export default function AppChrome() {
  const location = useLocation();
  const meta = getSectionMeta(location.pathname);

  const isMessages = location.pathname === "/mensajes" || location.pathname.startsWith("/mensajes/");
  const isNotifications =
    location.pathname === "/notificaciones" ||
    location.pathname.startsWith("/notificaciones/");

  return (
    <div className="appChrome">
      <header className="appChrome__header">
        <div className="appChrome__headerInner">
          <div className="appChrome__brandBlock">
            <Link to="/actividad" className="appChrome__brand">
              <span className="appChrome__brandMark" aria-hidden="true">
                BR
              </span>
              <span className="appChrome__brandText">BlaBlaRun</span>
            </Link>

            <div className="appChrome__section">
              <h1 className="appChrome__title">{meta.title}</h1>
              <p className="appChrome__subtitle">{meta.subtitle}</p>
            </div>
          </div>

          <div className="appChrome__actions" aria-label="Acciones rápidas">
            <HeaderAction
              to="/notificaciones"
              label="Notificaciones"
              badge={!isNotifications ? null : undefined}
            />
            <HeaderAction
              to="/mensajes"
              label="Mensajes"
              badge={!isMessages ? null : undefined}
            />
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
