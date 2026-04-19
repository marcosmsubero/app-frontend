import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export default function SettingsAccountPage() {
  const navigate = useNavigate();
  const { me, logout } = useAuth();

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button
          type="button"
          className="settingsSubpage__back"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Cuenta</h1>
          <p className="settingsSubpage__subtitle">
            Información de acceso y acciones sensibles.
          </p>
        </div>
      </div>

      <div className="settingsCard">
        <div className="settingsField">
          <label className="settingsField__label" htmlFor="account-email">Correo electrónico</label>
          <input
            id="account-email"
            className="settingsInput"
            type="text"
            value={me?.email || ""}
            readOnly
          />
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="account-handle">Nombre de usuario</label>
          <input
            id="account-handle"
            className="settingsInput"
            type="text"
            value={me?.handle ? `@${String(me.handle).replace(/^@/, "")}` : ""}
            readOnly
          />
        </div>

        <div className="settingsField">
          <span className="settingsField__label">Estado</span>
          <div className="settingsBadge">Cuenta activa</div>
        </div>

        <div className="settingsField">
          <span className="settingsField__label">Verificación de email</span>
          <div className="settingsBadge settingsBadge--success">Verificado</div>
        </div>
      </div>

      <div className="settingsCard settingsList">
        <Link to="/onboarding?mode=edit" className="settingsRow" style={{ textDecoration: "none" }}>
          <div className="settingsRow__left">
            <div className="settingsRow__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
              </svg>
            </div>
            <div className="settingsRow__copy">
              <h3 className="settingsRow__title">Editar perfil</h3>
              <p className="settingsRow__text">Cambia tu nombre, bio, ubicación y más.</p>
            </div>
          </div>
          <div className="settingsRow__right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </Link>

        <button type="button" className="settingsRow settingsRow--button" onClick={logout}>
          <div className="settingsRow__left">
            <div className="settingsRow__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </div>
            <div className="settingsRow__copy">
              <h3 className="settingsRow__title">Cerrar sesión</h3>
              <p className="settingsRow__text">Cierra tu sesión en este dispositivo.</p>
            </div>
          </div>
          <div className="settingsRow__right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </button>
      </div>

      <div className="settingsDangerBox">
        <h3 className="settingsDangerBox__title">Eliminar cuenta</h3>
        <p className="settingsDangerBox__text">
          Esta acción es irreversible y eliminará tu cuenta y tus datos asociados.
        </p>
        <Link to="/eliminar-cuenta" className="feedCard__action feedCard__action--primary">
          Ir a eliminar cuenta
        </Link>
      </div>
    </section>
  );
}
