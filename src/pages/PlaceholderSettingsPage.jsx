import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SettingsRow({ title, description, action }) {
  return (
    <article className="app-card settingsPage__row">
      <div className="settingsPage__rowBody">
        <div className="settingsPage__rowCopy">
          <h3 className="settingsPage__rowTitle">{title}</h3>
          <p className="settingsPage__rowText">{description}</p>
        </div>
        <div className="settingsPage__rowAction">{action}</div>
      </div>
    </article>
  );
}

export default function PlaceholderSettingsPage() {
  const { signOut, me } = useAuth();

  return (
    <section className="page settingsPage">
      <div className="page__header">
        <span className="page__eyebrow">Cuenta</span>
        <h1 className="page__title">Ajustes</h1>
        <p className="page__subtitle">
          Controla tu perfil, tu sesión y las acciones sensibles de la cuenta.
        </p>
      </div>

      <div className="settingsPage__list">
        <SettingsRow
          title="Editar perfil"
          description="Actualiza tu nombre visible, bio, ubicación y el resto de datos básicos del perfil."
          action={
            <Link to="/onboarding?mode=edit" className="app-button app-button--secondary">
              Editar perfil
            </Link>
          }
        />

        <SettingsRow
          title="Ver seguidores"
          description="Consulta qué perfiles te siguen dentro de la comunidad."
          action={
            <Link to="/perfil/seguidores" className="app-button app-button--secondary">
              Seguidores
            </Link>
          }
        />

        <SettingsRow
          title="Ver seguidos"
          description="Consulta los perfiles que estás siguiendo."
          action={
            <Link to="/perfil/seguidos" className="app-button app-button--secondary">
              Seguidos
            </Link>
          }
        />

        <SettingsRow
          title="Estado de la cuenta"
          description={`Sesión activa como ${me?.email || "usuario autenticado"}.`}
          action={<span className="app-badge">Activa</span>}
        />

        <SettingsRow
          title="Cerrar sesión"
          description="Sal de la aplicación en este dispositivo."
          action={
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={signOut}
            >
              Cerrar sesión
            </button>
          }
        />

        <SettingsRow
          title="Eliminar cuenta"
          description="Acción sensible. Desactivará tu cuenta y dejará de estar disponible para acceder."
          action={
            <Link to="/eliminar-cuenta" className="app-button app-button--primary">
              Eliminar cuenta
            </Link>
          }
        />
      </div>
    </section>
  );
}
