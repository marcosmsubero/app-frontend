import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

function IconMessages() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H4l2.6-3.2A8.5 8.5 0 1 1 21 12Z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 17H5l1.2-1.2A2 2 0 0 0 6.8 14V11a5.2 5.2 0 1 1 10.4 0v3a2 2 0 0 0 .6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function getShellMeta(pathname) {
  if (
    pathname === "/eventos" ||
    pathname === "/blablarun" ||
    pathname.startsWith("/eventos/")
  ) {
    return {
      eyebrow: "Home",
      title: "Eventos",
      subtitle: "Descubre quedadas, planes y entrenamientos cerca de ti.",
    };
  }

  if (
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/")
  ) {
    return {
      eyebrow: "Runner",
      title: "Perfil",
      subtitle: "Tu identidad, calendario y presencia dentro de la comunidad.",
    };
  }

  if (
    pathname === "/actividad" ||
    pathname === "/mensajes" ||
    pathname.startsWith("/mensajes/") ||
    pathname === "/notificaciones"
  ) {
    return {
      eyebrow: "Comunidad",
      title: "Actividad",
      subtitle: "Mensajes, movimiento y señales en tiempo real de tu red.",
    };
  }

  if (pathname === "/ajustes") {
    return {
      eyebrow: "Cuenta",
      title: "Ajustes",
      subtitle: "Preferencias, privacidad y configuración del producto.",
    };
  }

  if (pathname === "/eliminar-cuenta") {
    return {
      eyebrow: "Cuenta",
      title: "Eliminar cuenta",
      subtitle: "Gestiona de forma segura el cierre definitivo de tu perfil.",
    };
  }

  return {
    eyebrow: "App",
    title: "BlaBlaRun",
    subtitle: "Una experiencia social de running pensada para móvil.",
  };
}

export default function MobileShell() {
  const location = useLocation();
  const shellMeta = getShellMeta(location.pathname);

  return (
    <div className="appChrome">
      <header className="appTopbar">
        <div className="appTopbar__copy">
          <span className="appTopbar__eyebrow">{shellMeta.eyebrow}</span>
          <h1 className="appTopbar__title">{shellMeta.title}</h1>
          <p className="appTopbar__subtitle">{shellMeta.subtitle}</p>
        </div>

        <div className="appTopbar__actions" aria-label="Accesos rápidos">
          <Link
            to="/mensajes"
            className={`appTopbar__iconButton${
              location.pathname === "/mensajes" || location.pathname.startsWith("/mensajes/")
                ? " is-active"
                : ""
            }`}
            aria-label="Mensajes"
          >
            <IconMessages />
          </Link>

          <Link
            to="/notificaciones"
            className={`appTopbar__iconButton${
              location.pathname === "/notificaciones" ? " is-active" : ""
            }`}
            aria-label="Notificaciones"
          >
            <IconBell />
          </Link>
        </div>
      </header>

      <main className="appChrome__main appChrome__main--bare">
        <div className="appChrome__content">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
