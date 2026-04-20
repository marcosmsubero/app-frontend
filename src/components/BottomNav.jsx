import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useRef, useEffect, useState } from "react";
import "../styles/mobile-shell.css";

/* ─────────────────────────────────────────────────────────────────────────────
   Rounded duotone icons — soft strokes + filled accent shapes on active.
   Inspired by Airbnb / Figma style: friendly, rounded, premium feel.
   ───────────────────────────────────────────────────────────────────────────── */

const IconEvents = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* calendar body */}
    <rect
      x="3" y="4" width="18" height="18" rx="4"
      fill={active ? "var(--primary-soft)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
    />
    {/* top pegs */}
    <path d="M8 2v3M16 2v3" stroke={active ? "var(--primary)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
    {/* divider line */}
    <path d="M3 10h18" stroke={active ? "var(--primary)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
    {/* event dot on active */}
    {active && <circle cx="12" cy="16" r="2" fill="var(--primary)" />}
    {!active && (
      <>
        <circle cx="8.5" cy="14.5" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="12" cy="14.5" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="15.5" cy="14.5" r="1" fill="currentColor" opacity="0.4" />
      </>
    )}
  </svg>
);

const IconExplore = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* outer ring */}
    <circle
      cx="12" cy="12" r="10"
      fill={active ? "var(--primary-soft)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
    />
    {/* compass diamond */}
    <path
      d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"
      fill={active ? "var(--primary)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* centre dot */}
    <circle cx="12" cy="12" r="1.2" fill={active ? "#0a1628" : "currentColor"} />
  </svg>
);

const IconCreate = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* head */}
    <circle
      cx="12" cy="8" r="4"
      fill={active ? "var(--primary-soft)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
    />
    {/* body arc */}
    <path
      d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8"
      fill={active ? "var(--primary-soft)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconActivity = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* bell body */}
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9Z"
      fill={active ? "var(--primary-soft)" : "none"}
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* clapper */}
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={active ? "var(--primary)" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* notification pip */}
    {active && <circle cx="17" cy="5" r="2.5" fill="var(--primary)" stroke="var(--bg, #080f1a)" strokeWidth="1.5" />}
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */

function buildNavItems(t) {
  return [
    {
      to: "/eventos",
      label: t("nav.events"),
      Icon: IconEvents,
      isActive: (p) =>
        p === "/eventos" ||
        p.startsWith("/eventos/") ||
        p.startsWith("/evento/"),
    },
    {
      to: "/explorar",
      label: t("nav.explore") || "Explorar",
      Icon: IconExplore,
      isActive: (p) =>
        p === "/explorar" ||
        p.startsWith("/explorar/") ||
        p === "/retos" ||
        p.startsWith("/retos/") ||
        p === "/clubs" ||
        p.startsWith("/clubs/"),
    },
    {
      id: "create",
      to: "/crear-evento",
      label: t("nav.create") || "Crear",
      isFab: true,
    },
    {
      to: "/perfil",
      label: t("nav.profile"),
      Icon: IconProfile,
      isActive: (p) =>
        p === "/perfil" ||
        p.startsWith("/perfil/") ||
        p.startsWith("/mi-perfil"),
    },
    {
      to: "/actividad",
      label: t("nav.activity"),
      Icon: IconActivity,
      isActive: (p) =>
        p === "/actividad" ||
        p.startsWith("/actividad/") ||
        p === "/mensajes" ||
        p.startsWith("/mensajes/") ||
        p === "/notificaciones" ||
        p.startsWith("/notificaciones/"),
    },
  ];
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const NAV_ITEMS = buildNavItems(t);
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  /* ── Sliding active indicator ── */
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(".bottomNav__link.is-active");
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: elRect.left - navRect.left + elRect.width / 2 - 14,
        opacity: 1,
      });
    } else {
      setIndicatorStyle({ opacity: 0 });
    }
  }, [location.pathname]);

  return (
    <nav className="bottomNav" aria-label="Main navigation">
      <div className="bottomNav__glass">
        <div className="bottomNav__list" ref={navRef}>
          {/* Sliding indicator pill */}
          <span
            className="bottomNav__indicator"
            style={{
              transform: `translateX(${indicatorStyle.left || 0}px)`,
              opacity: indicatorStyle.opacity || 0,
            }}
          />

          {NAV_ITEMS.map((item) => {
            if (item.isFab) {
              return (
                <div key="fab" className="bottomNav__fabWrap">
                  <button
                    className="bottomNav__fab"
                    onClick={() => navigate(item.to)}
                    aria-label={item.label}
                  >
                    <IconCreate />
                  </button>
                </div>
              );
            }

            const active = item.isActive(location.pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`bottomNav__link${active ? " is-active" : ""}`}
                aria-label={item.label}
                title={item.label}
              >
                <item.Icon active={active} />
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
