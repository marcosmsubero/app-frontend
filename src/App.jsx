import { NavLink } from "react-router-dom";

const IconCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5.5 19.5c1.8-3.3 4.1-5 6.5-5s4.7 1.7 6.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
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
    <path
      d="M14.6 9.4 9.6 11.5 11.7 16.5l4.9-2.1 2.1-5z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 16.5h10c-.9-1-.9-2.7-.9-4.3 0-2.7-1.4-4.8-4.1-5.3v-.9a1 1 0 1 0-2 0v.9C7.3 7.4 6 9.5 6 12.2c0 1.6 0 3.3-1 4.3h2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 18a2 2 0 0 0 4 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

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

function Item({ to, icon, label, aria, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={aria}
      className={({ isActive }) => `bottomNav__item ${isActive ? "is-active" : ""}`}
    >
      <span className="bottomNav__icon">{icon}</span>
      <span className="bottomNav__label">{label}</span>
    </NavLink>
  );
}

export default function BottomNav({ me }) {
  const running = isRunningUser(me);
  const groupIcon = running ? <IconShoe /> : <IconBike />;

  return (
    <nav className="bottomNav" aria-label="Navegación principal">
      <div className="bottomNav__inner">
        <Item to="/perfil" end icon={<IconCircle />} label="Perfil" aria="Perfil" />
        <Item to="/explorar" icon={<IconCompass />} label="Explorar" aria="Explorar" />
        <Item to="/groups" icon={groupIcon} label="Grupos" aria="Grupos" />
        <Item to="/notificaciones" icon={<IconBell />} label="Alertas" aria="Notificaciones" />
      </div>
    </nav>
  );
}
