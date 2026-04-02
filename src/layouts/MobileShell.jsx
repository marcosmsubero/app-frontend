import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

function getShellMeta(pathname) {
  if (pathname === "/eventos" || pathname === "/blablarun" || pathname.startsWith("/eventos/")) {
    return {
      eyebrow: "Eventos",
    };
  }

  if (
    pathname === "/actividad" ||
    pathname === "/mensajes" ||
    pathname.startsWith("/mensajes/") ||
    pathname === "/notificaciones"
  ) {
    return {
      eyebrow: "Actividad",
    };
  }

  if (pathname === "/ajustes") {
    return {
      eyebrow: "Ajustes",
    };
  }

  if (pathname === "/eliminar-cuenta") {
    return {
      eyebrow: "Eliminar Cuenta",
    };
  }
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

      <BottomNav />
    </div>
  );
}
