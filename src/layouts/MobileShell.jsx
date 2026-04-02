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
  if (pathname === "/eventos" || pathname === "/blablarun" || pathname.startsWith("/eventos/")) {
    return {
      eyebrow: "Explorar",
      title: "Eventos",
      subtitle: "Quedadas, entrenos y planes cercanos en un flujo claro y rápido.",
    };
  }

  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) {
    return {
      eyebrow: "Identidad",
      title: "Perfil",
      subtitle: "Tu presencia en la comunidad, agenda y conexiones en una sola vista.",
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
      subtitle: "Mensajes, avisos y movimiento reciente sin saturación visual.",
    };
  }

  if (pathname === "/ajustes") {
    return {
      eyebrow: "Cuenta",
      title: "Ajustes",
      subtitle: "Preferencias esenciales y acciones de perfil en formato compacto.",
    };
  }

  if (pathname === "/eliminar-cuenta") {
    return {
      eyebrow: "Cuenta",
      title: "Eliminar cuenta",
      subtitle: "Proceso claro, seguro y sin pasos ambiguos.",
    };
  }

  return {
    eyebrow: "BlaBlaRun",
    title: "Inicio",
    subtitle: "Producto mobile-first con una base visual unificada.",
  };
}

export default function MobileShell() {
  const location = useLocation();
  const shellMeta = getShellMeta(location.pathname);
  const inMessages = location.pathname === "/mensajes" || location.pathname.startsWith("/mensajes/");
  const inNotifications = location.pathname === "/notificaciones";

  return (
    <div className="appChrome">
      <div className="appChrome__frame">
        <header className="appTopbar">
          <div className="appTopbar__copy">
            <span className="appTopbar__eyebrow">{shellMeta.eyebrow}</span>
            <h1 className="appTopbar__title">{shellMeta.title}</h1>
            <p className="appTopbar__subtitle">{shellMeta.subtitle}</p>
          </div>

          <div className="appTopbar__actions" aria-label="Accesos rápidos">
            <Link
              to="/mensajes"
              className={`appTopbar__iconButton${inMessages ? " is-active" : ""}`}
              aria-label="Mensajes"
            >
              <IconMessages />
            </Link>

            <Link
              to="/notificaciones"
              className={`appTopbar__iconButton${inNotifications ? " is-active" : ""}`}
              aria-label="Notificaciones"
            >
              <IconBell />
            </Link>
          </div>
        </header>

        <main className="appChrome__main">
          <div className="appChrome__content">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
