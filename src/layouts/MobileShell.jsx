import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

function getTitle(pathname) {
  if (pathname === "/" || pathname.startsWith("/actividad")) return "Actividad";
  if (pathname.startsWith("/blablarun")) return "Eventos";
  if (pathname.startsWith("/mensajes")) return "Mensajes";
  if (pathname.startsWith("/perfil") || pathname.startsWith("/mi-perfil")) return "Perfil";
  return "BlaBlaRun";
}

export default function MobileShell() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="mobile">
      <header className="mobile__header">
        <div className="mobile__headerInner">
          <div className="mobile__brand">
            <span className="mobile__logo">BR</span>
            <span className="mobile__title">{title}</span>
          </div>
        </div>
      </header>

      <main className="mobile__main">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
