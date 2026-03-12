import { NavLink } from "react-router-dom";

/* =========================
   ICONOS SVG MINIMAL
========================= */

const IconCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconShoe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 17h18v2H3zM4 15l6-4 3 2 4 1 2 1v1H4z" fill="currentColor" />
  </svg>
);

const IconBike = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M6 17l5-8h4l-3 8M11 9l-2-3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconCompass = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="2" opacity="0.55" />
    <path d="M13.6 10.4L10 14l.9-2.7 2.7-.9Z" fill="currentColor" />
    <path d="M10.4 13.6L14 10l-.9 2.7-2.7.9Z" fill="currentColor" opacity="0.55" />
    <path
      d="M12 2.8v1.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2v2M12 20v2M2 12h2M20 12h2
         M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4
         M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* =========================
   HELPERS
========================= */

function normalizeToStringList(me) {
  const out = [];

  if (Array.isArray(me?.disciplines)) {
    for (const d of me.disciplines) {
      if (typeof d === "string") out.push(d);
      else if (d && typeof d === "object") out.push(d.name ?? d.label ?? d.value ?? "");
      else if (d != null) out.push(String(d));
    }
  }

  if (me?.discipline) out.push(me.discipline);
  if (me?.primary_discipline) out.push(me.primary_discipline);
  if (me?.sport) out.push(me.sport);

  return out.filter(Boolean).map((x) => String(x).toLowerCase().trim());
}

function isRunningUser(me) {
  const list = normalizeToStringList(me);
  const RUN_KEYS = ["running", "run", "runner", "trail", "correr", "carrera", "atletismo"];
  return list.some((d) => RUN_KEYS.some((k) => d.includes(k)));
}

/* =========================
   STYLES
========================= */

const shellStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  padding: "0 12px calc(12px + env(safe-area-inset-bottom, 0px))",
  pointerEvents: "none",
};

const innerStyle = {
  width: "100%",
  maxWidth: "560px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  padding: "8px",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)), rgba(11,19,32,0.86)",
  boxShadow:
    "0 18px 48px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  pointerEvents: "auto",
};

const baseItemStyle = {
  minHeight: "56px",
  borderRadius: "18px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  textDecoration: "none",
  transition:
    "transform 0.16s ease, background 0.16s ease, color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease",
  WebkitTapHighlightColor: "transparent",
};

const activeItemStyle = {
  color: "#f5f7fb",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const inactiveItemStyle = {
  color: "rgba(230,235,245,0.68)",
  background: "transparent",
  border: "1px solid transparent",
  boxShadow: "none",
};

const iconWrapStyle = {
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle = {
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
};

/* =========================
   ITEM
========================= */

function Item({ to, icon, label, aria }) {
  return (
    <NavLink
      to={to}
      end={to === "/perfil"}
      aria-label={aria}
      className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
      style={({ isActive }) => ({
        ...baseItemStyle,
        ...(isActive ? activeItemStyle : inactiveItemStyle),
      })}
    >
      <span className="bn-ico" style={iconWrapStyle}>
        {icon}
      </span>
      <span className="bn-label" style={labelStyle}>
        {label}
      </span>
    </NavLink>
  );
}

/* =========================
   BOTTOM NAV
========================= */

export default function BottomNav({ me }) {
  const running = isRunningUser(me);
  const groupIcon = running ? <IconShoe /> : <IconBike />;

  return (
    <nav
      className="bottom-nav"
      aria-label="Navegación principal"
      style={shellStyle}
    >
      <div className="bottom-nav__inner" style={innerStyle}>
        <Item to="/perfil" icon={<IconCircle />} label="Perfil" aria="Perfil" />
        <Item to="/explorar" icon={<IconCompass />} label="Explorar" aria="Explorar" />
        <Item to="/groups" icon={groupIcon} label="Grupos" aria="Grupos" />
        <Item to="/ajustes" icon={<IconSettings />} label="Ajustes" aria="Ajustes" />
      </div>
    </nav>
  );
}
