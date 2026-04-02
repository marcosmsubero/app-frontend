import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

function getShellMeta(pathname) {
  if (
    pathname === "/eventos" ||
    pathname === "/blablarun" ||
    pathname.startsWith("/eventos/")
  ) {
    return { eyebrow: "Eventos" };
  }

  if (
    pathname === "/actividad" ||
    pathname === "/mensajes" ||
    pathname.startsWith("/mensajes/") ||
    pathname === "/notificaciones"
  ) {
    return { eyebrow: "Actividad" };
  }

  if (pathname === "/ajustes") {
    return { eyebrow: "Ajustes" };
  }

  if (pathname === "/eliminar-cuenta") {
    return { eyebrow: "Eliminar cuenta" };
  }

  if (
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    pathname.startsWith("/seguidores") ||
    pathname.startsWith("/siguiendo")
  ) {
    return { eyebrow: "Perfil" };
  }

  if (pathname === "/login" || pathname === "/register") {
    return { eyebrow: "Acceso" };
  }

  if (pathname === "/onboarding") {
    return { eyebrow: "Perfil" };
  }

  return { eyebrow: "BlaBlaRun" };
}

export default function MobileShell() {
  const location = useLocation();
  const { eyebrow } = getShellMeta(location.pathname);

  return (
    <div className="appChrome">
      <div className="appChrome__frame">
        <header className="appTopbar minimal">
          <span className="appTopbar__eyebrow">{eyebrow}</span>
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
