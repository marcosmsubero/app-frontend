import { NavLink } from "react-router-dom";

const PRIMARY_ITEMS = [
  {
    to: "/actividad",
    label: "Actividad",
    icon: "◉",
    isActive: (pathname) =>
      pathname === "/" ||
      pathname === "/actividad" ||
      pathname.startsWith("/actividad/"),
  },
  {
    to: "/blablarun",
    label: "BlaBlaRun",
    icon: "◎",
    isActive: (pathname) =>
      pathname === "/blablarun" || pathname.startsWith("/blablarun/"),
  },
  {
    to: "/perfil",
    label: "Perfil",
    icon: "◌",
    isActive: (pathname) =>
      pathname === "/perfil" ||
      pathname.startsWith("/perfil/") ||
      pathname.startsWith("/mi-perfil"),
  },
];

function itemClassName({ isActive }) {
  return `bottomNav__item${isActive ? " bottomNav__item--active" : ""}`;
}

export default function BottomNav() {
  return (
    <nav className="bottomNav" aria-label="Navegación principal">
      <div className="bottomNav__inner">
        {PRIMARY_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/actividad"}
            className={({ isActive, location }) =>
              itemClassName({
                isActive: item.isActive
                  ? item.isActive(location?.pathname || "")
                  : isActive,
              })
            }
          >
            <span className="bottomNav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottomNav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
