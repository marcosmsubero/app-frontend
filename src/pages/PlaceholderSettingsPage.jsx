import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/settings.css";

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 18, height: 18 }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4Z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <line x1="4" x2="14" y1="6" y2="6" />
      <line x1="10" x2="20" y1="18" y2="18" />
      <line x1="4" x2="8" y1="18" y2="18" />
      <line x1="16" x2="20" y1="6" y2="6" />
      <circle cx="11" cy="6" r="2" />
      <circle cx="13" cy="18" r="2" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function initialsFromName(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

function SettingsSection({ title, subtitle, children }) {
  return (
    <section className="sectionBlock settingsSection">
      <div className="app-section-header">
        <div>
          <div className="app-section-header__title">{title}</div>
          {subtitle ? (
            <div className="app-section-header__subtitle">{subtitle}</div>
          ) : null}
        </div>
      </div>
      <div className="settingsList">{children}</div>
    </section>
  );
}

function SettingsLinkRow({ icon, title, text, value, to, danger = false }) {
  return (
    <Link to={to} className={`settingsRow${danger ? " settingsRow--danger" : ""}`}>
      <div className="settingsRow__left">
        <div className={`settingsRow__icon${danger ? " settingsRow__icon--danger" : ""}`}>
          {icon}
        </div>

        <div className="settingsRow__copy">
          <h3 className="settingsRow__title">{title}</h3>
          {text ? <p className="settingsRow__text">{text}</p> : null}
        </div>
      </div>

      <div className="settingsRow__right">
        {value ? <span className="settingsRow__value">{value}</span> : null}
        <ChevronIcon />
      </div>
    </Link>
  );
}

function SettingsActionRow({ icon, title, text, onClick, danger = false }) {
  return (
    <button
      type="button"
      className={`settingsRow settingsRow--button${danger ? " settingsRow--danger" : ""}`}
      onClick={onClick}
    >
      <div className="settingsRow__left">
        <div className={`settingsRow__icon${danger ? " settingsRow__icon--danger" : ""}`}>
          {icon}
        </div>

        <div className="settingsRow__copy">
          <h3 className="settingsRow__title">{title}</h3>
          {text ? <p className="settingsRow__text">{text}</p> : null}
        </div>
      </div>

      <div className="settingsRow__right">
        <ChevronIcon />
      </div>
    </button>
  );
}

export default function PlaceholderSettingsPage() {
  const { logout, me } = useAuth();

  const displayName = me?.display_name || me?.name || me?.full_name || "Tu perfil";
  const handle = me?.handle ? `@${String(me.handle).replace(/^@/, "")}` : "@usuario";
  const email = me?.email || "Sin email";
  const avatarUrl = me?.avatar_url || me?.photo_url || "";
  const version = "v0.1.0";

  return (
    <section className="page settingsPage">
      <section className="sectionBlock">
        <div className="settingsHeroCard">
          <div className="settingsHeroCard__avatarWrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="settingsHeroCard__avatar" />
            ) : (
              <div className="settingsHeroCard__avatar settingsHeroCard__avatar--fallback">
                {initialsFromName(displayName)}
              </div>
            )}
          </div>

          <div className="settingsHeroCard__copy">
            <div className="settingsHeroCard__eyebrow">Ajustes</div>
            <h1 className="settingsHeroCard__title">{displayName}</h1>
            <div className="settingsHeroCard__meta">
              <span>{handle}</span>
              <span>{email}</span>
            </div>
          </div>

          <Link to="/onboarding?mode=edit" className="settingsHeroCard__editBtn">
            Editar perfil
          </Link>
        </div>
      </section>

      <SettingsSection
        title="Cuenta y perfil"
        subtitle="Gestiona tu identidad, acceso y datos básicos."
      >
        <SettingsLinkRow
          icon={<ProfileIcon />}
          title="Cuenta"
          text="Información de acceso, seguridad y acciones sensibles."
          to="/ajustes/cuenta"
        />
      </SettingsSection>

      <SettingsSection
        title="Privacidad y seguridad"
        subtitle="Controla visibilidad, permisos y acceso."
      >
        <SettingsLinkRow
          icon={<ShieldIcon />}
          title="Privacidad"
          text="Perfil, ubicación, mensajes y asistencia a eventos."
          to="/ajustes/privacidad"
        />

        <SettingsLinkRow
          icon={<ShieldIcon />}
          title="Permisos del dispositivo"
          text="Ubicación, notificaciones y calendario."
          to="/ajustes/permisos"
        />

        <SettingsLinkRow
          icon={<ShieldIcon />}
          title="Usuarios bloqueados"
          text="Gestiona a quién has bloqueado."
          to="/ajustes/bloqueados"
        />
      </SettingsSection>

      <SettingsSection
        title="Notificaciones"
        subtitle="Decide qué avisos quieres recibir."
      >
        <SettingsLinkRow
          icon={<BellIcon />}
          title="Notificaciones"
          text="Mensajes, recordatorios, clubs, retos y resumen semanal."
          to="/ajustes/notificaciones"
        />
      </SettingsSection>

      <SettingsSection
        title="Preferencias"
        subtitle="Ajustes de experiencia y comportamiento por defecto."
      >
        <SettingsLinkRow
          icon={<SlidersIcon />}
          title="Preferencias"
          text="Idioma, tema, radio de exploración y mapa por defecto."
          to="/ajustes/preferencias"
        />
      </SettingsSection>

      <SettingsSection
        title="Soporte y legal"
        subtitle="Ayuda, documentación y versión."
      >
        <SettingsLinkRow
          icon={<HelpIcon />}
          title="Centro de ayuda"
          text="Dudas frecuentes y guía rápida."
          to="/ajustes/ayuda"
        />

        <SettingsLinkRow
          icon={<HelpIcon />}
          title="Contactar soporte"
          text="Envíanos un problema o sugerencia."
          to="/ajustes/soporte"
        />

        <SettingsLinkRow
          icon={<HelpIcon />}
          title="Política de privacidad"
          text="Cómo tratamos tus datos."
          to="/ajustes/privacidad-legal"
        />

        <SettingsLinkRow
          icon={<HelpIcon />}
          title="Términos y condiciones"
          text="Normas de uso del servicio."
          to="/ajustes/terminos"
        />

        <SettingsLinkRow
          icon={<HelpIcon />}
          title="Versión de la app"
          text="Información técnica de esta build."
          value={version}
          to="/ajustes/version"
        />
      </SettingsSection>

      <SettingsSection
        title="Sesión y cuenta"
        subtitle="Acciones sensibles."
      >
        <SettingsActionRow
          icon={<LogoutIcon />}
          title="Cerrar sesión"
          text="Cierra tu sesión en este dispositivo."
          onClick={logout}
        />

        <SettingsLinkRow
          icon={<TrashIcon />}
          title="Eliminar cuenta"
          text="Acción irreversible. Se borrará tu cuenta y tus datos."
          to="/eliminar-cuenta"
          danger
        />
      </SettingsSection>
    </section>
  );
}
