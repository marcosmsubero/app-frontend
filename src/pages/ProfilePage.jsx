import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function formatHandle(handle) {
  const clean = String(handle || "").trim().replace(/^@+/, "");
  return clean ? `@${clean}` : "@runner";
}

function formatLocation(location) {
  const clean = String(location || "").trim();
  return clean || "Ubicación no indicada";
}

function formatBio(bio) {
  const clean = String(bio || "").trim();
  return clean || "Aún no has añadido una bio a tu perfil.";
}

export default function ProfilePage() {
  const { me, profile, meReady } = useAuth();

  if (!meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando perfil…</div>
        </div>
      </div>
    );
  }

  const displayName =
    me?.full_name ||
    profile?.full_name ||
    me?.handle ||
    profile?.handle ||
    "Tu perfil";

  const handle = me?.handle || profile?.handle || "";
  const bio = me?.bio || profile?.bio || "";
  const location = me?.location || profile?.location || "";
  const avatarUrl = me?.avatar_url || profile?.avatar_url || "";

  return (
    <section className="app-shell">
      <div className="app-section">
        <div className="app-section__header">
          <div>
            <span className="app-eyebrow">Perfil</span>
            <h1 className="app-title">Tu perfil runner</h1>
            <p className="app-subtitle">
              Consulta tu información y tu calendario desde una sola pantalla.
            </p>
          </div>
        </div>

        <div className="profile-page">
          <article className="profile-card">
            <div className="profile-card__top">
              <div className="profile-card__identity">
                <div className="profile-card__avatarWrap">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="profile-card__avatar"
                    />
                  ) : (
                    <div className="profile-card__avatar profile-card__avatar--fallback">
                      {String(displayName).trim().charAt(0).toUpperCase() || "R"}
                    </div>
                  )}
                </div>

                <div className="profile-card__meta">
                  <h2 className="profile-card__name">{displayName}</h2>
                  <p className="profile-card__handle">{formatHandle(handle)}</p>
                  <p className="profile-card__location">{formatLocation(location)}</p>
                </div>
              </div>

              <div className="profile-card__actions">
                <Link
                  to="/ajustes"
                  className="app-button app-button--ghost"
                  aria-label="Abrir ajustes"
                  title="Ajustes"
                >
                  Ajustes
                </Link>
              </div>
            </div>

            <div className="profile-card__body">
              <div className="profile-card__block">
                <h3 className="profile-card__blockTitle">Bio</h3>
                <p className="profile-card__bio">{formatBio(bio)}</p>
              </div>

              <div className="profile-card__block">
                <h3 className="profile-card__blockTitle">Disciplina</h3>
                <p className="profile-card__singleValue">Running</p>
              </div>
            </div>
          </article>

          <article className="profile-calendar-card">
            <div className="profile-calendar-card__header">
              <div>
                <h2 className="profile-calendar-card__title">Calendario</h2>
                <p className="profile-calendar-card__subtitle">
                  Aquí verás tus planes, quedadas y actividad programada.
                </p>
              </div>
            </div>

            <div className="profile-calendar-card__content">
              <div className="profile-calendar-placeholder">
                <div className="profile-calendar-placeholder__icon">📅</div>
                <h3 className="profile-calendar-placeholder__title">
                  Calendario del runner
                </h3>
                <p className="profile-calendar-placeholder__text">
                  Este espacio queda reservado para tu calendario. Las publicaciones
                  se han eliminado del perfil para dejar la pantalla más clara.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
