import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

function matchPath(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function getShellMeta(pathname) {
  if (pathname === "/" || matchPath(pathname, "/actividad")) {
    return {
      eyebrow: "Comunidad activa",
      title: "Actividad",
      subtitle: "Mensajes, notificaciones y movimiento reciente en una sola vista.",
    };
  }

  if (matchPath(pathname, "/blablarun")) {
    return {
      eyebrow: "Planifica y sal",
      title: "Eventos",
      subtitle: "Quedadas, entrenos y planes con una experiencia mobile-first.",
    };
  }

  if (matchPath(pathname, "/mensajes")) {
    return {
      eyebrow: "Conecta",
      title: "Mensajes",
      subtitle: "Conversaciones rápidas y compactas pensadas para móvil.",
    };
  }

  if (matchPath(pathname, "/notificaciones")) {
    return {
      eyebrow: "Todo al día",
      title: "Notificaciones",
      subtitle: "Alertas y actividad reciente en una sola pantalla clara.",
    };
  }

  if (matchPath(pathname, "/ajustes")) {
    return {
      eyebrow: "Control de cuenta",
      title: "Ajustes",
      subtitle: "Configuración simple y consistente para una app móvil real.",
    };
  }

  if (matchPath(pathname, "/eliminar-cuenta")) {
    return {
      eyebrow: "Seguridad",
      title: "Eliminar cuenta",
      subtitle: "Acción sensible con una interfaz directa y sin distracciones.",
    };
  }

  if (matchPath(pathname, "/perfil") || matchPath(pathname, "/mi-perfil")) {
    return {
      eyebrow: "Identidad deportiva",
      title: "Perfil",
      subtitle: "Tu presencia en la comunidad, seguidores y actividad.",
    };
  }

  return {
    eyebrow: "App mobile-first",
    title: "BlaBlaRun",
    subtitle: "Base visual unificada para una experiencia móvil coherente.",
  };
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
