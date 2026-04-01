import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SettingsItem({ title, text, action }) {
  return (
    <article className="settingsRow">
      <div className="settingsRow__left">
        <div className="settingsRow__copy">
          <h3 className="settingsRow__title">{title}</h3>
          <p className="settingsRow__text">{text}</p>
        </div>
      </div>

      <div className="settingsRow__right">{action}</div>
    </article>
  );
}

export default function PlaceholderSettingsPage() {
  const { signOut, me } = useAuth();

  return (
    <section className="page settingsPage">
      <section className="heroPanel">
        <div className="heroPanel__top">
          <div>
            <span className="sectionEyebrow">Ajustes</span>
          </div>

          <span className="heroPanel__badge">Cuenta</span>
        </div>
      </section>

      <section className="sectionBlock settingsList">
        <SettingsItem
          title="Editar perfil"
          text="Actualiza nombre visible, bio, ubicación y resto de datos básicos."
          action={
            <Link to="/onboarding?mode=edit" className="feedCard__action">
              Editar
            </Link>
          }
        />

        <SettingsItem
          title="Estado de la cuenta"
          text={`Sesión activa como ${me?.email || "usuario autenticado"}.`}
          action={<span className="badge badge--success">Activa</span>}
        />

        <SettingsItem
          title="Cerrar sesión"
          text="Cierra tu sesión en este dispositivo."
          action={
            <button type="button" className="feedCard__action" onClick={signOut}>
              Salir
            </button>
          }
        />

        <SettingsItem
          title="Eliminar cuenta"
          text="Acción sensible e irreversible."
          action={
            <Link
              to="/eliminar-cuenta"
              className="feedCard__action feedCard__action--primary"
            >
              Eliminar
            </Link>
          }
        />
      </section>
    </section>
  );
}
