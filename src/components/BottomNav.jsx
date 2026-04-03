import { NavLink, useLocation } from "react-router-dom";
import iconEventos from "../assets/Eventos.png";
import iconPerfil from "../assets/Perfil.png";
import iconActividad from "../assets/Actividad.png";
import "../styles/mobile-shell.css";

const NAV_ITEMS = [
  {
    to: "/eventos",
    label: "Eventos",
    icon: iconEventos,
    isActive: (pathname) =>
      pathname === "/eventos" ||
      pathname === "/blablarun" ||
      pathname.startsWith("/eventos/"),
  },
  {
    to: "/actividad",
    label: "Actividad",
    icon: iconActividad,
    isActive: (pathname) =>
      pathname === "/actividad" ||
      pathname.startsWith("/actividad/") ||
      pathname === "/mensajes" ||
      pathname.startsWith("/mensajes/") ||
      pathname === "/notificaciones" ||
      pathname.startsWith("/notificaciones/"),
  },
  {
    to: "/perfil",
    label: "Perfil",
    icon: iconPerfil,
    isActive: (pathname) =>
      pathname === "/perfil" ||
      pathname.startsWith("/perfil/") ||
      pathname.startsWith("/mi-perfil"),
  },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottomNav" aria-label="Navegación principal">
      <div className="bottomNav__list">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(location.pathname);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottomNav__link${active ? " is-active" : ""}`}
              aria-label={item.label}
            >
              <img
                src={item.icon}
                alt=""
                className="bottomNav__iconImage"
                aria-hidden="true"
              />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
