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

  return { eyebrow: "BlaBlaRun" };
}

export default function MobileShell() {
  const location = useLocation();
  const { eyebrow } = getShellMeta(location.pathname);

  return (
    <div className="appChrome">
      <div className="appChrome__frame">
        
        {/* Top minimal */}
        <header className="appTopbar minimal">
          <span className="appTopbar__eyebrow">{eyebrow}</span>
        </header>

        {/* CONTENT */}
        <main className="appChrome__main">
          <div className="appChrome__content">
            <Outlet />
          </div>
        </main>

      </div>

      {/* Bottom nav siempre visible */}
      <BottomNav />
    </div>
  );
}
