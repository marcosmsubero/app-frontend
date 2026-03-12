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
   ITEM
========================= */

function Item({ to, icon, aria }) {
  return (
    <NavLink
      to={to}
      end={to === "/perfil"}
      aria-label={aria}
      className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
    >
      <span className="bn-ico">{icon}</span>
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
    <nav className="bottom-nav" aria-label="Navegación principal">
      <div className="bottom-nav__inner">
        <Item to="/perfil" icon={<IconCircle />} aria="Perfil" />
        <Item to="/explorar" icon={<IconCompass />} aria="Explorar" />
        <Item to="/groups" icon={groupIcon} aria="Grupos" />
        <Item to="/ajustes" icon={<IconSettings />} aria="Ajustes" />
      </div>
    </nav>
  );
}