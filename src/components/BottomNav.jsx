import { NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  {
    to: "/actividad",
    label: "Actividad",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13.5h3.2l1.7-3.2 3 7.2 2.6-5.2H20" />
      </svg>
    ),
    isActive: (pathname) =>
      pathname === "/" ||
      pathname === "/actividad" ||
      pathname.startsWith("/actividad/"),
  },
  {
    to: "/blablarun",
    label: "Eventos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v2M17 3v2M4 9h16M6.5 5h11A1.5 1.5 0 0 1 19 6.5v11A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5Z" />
      </svg>
    ),
    isActive: (pathname) =>
      pathname === "/blablarun" || pathname.startsWith("/blablarun/"),
  },
  {
    to: "/mensajes",
    label: "Mensajes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 6.5h13A1.5 1.5 0 0 1 20 8v8a1.5 1.5 0 0 1-1.5 1.5h-8l-4.5 3v-3H5.5A1.5 1.5 0 0 1 4 16V8a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    ),
    isActive: (pathname) =>
      pathname === "/mensajes" || pathname.startsWith("/mensajes/"),
  },
  {
    to: "/perfil",
    label: "Perfil",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
        <path d="M5 19a7 7 0 0 1 14 0" />
      </svg>
    ),
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
      <div className="bottomNav__inner">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(location.pathname);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/actividad"}
              className={`bottomNav__item${active ? " bottomNav__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bottomNav__iconWrap" aria-hidden="true">
                <span className="bottomNav__icon">{item.icon}</span>
              </span>

              <span className="bottomNav__label">{item.label}</span>

              {active ? <span className="bottomNav__activePill" aria-hidden="true" /> : null}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
