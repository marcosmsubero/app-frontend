import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function initials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return `${a}${b}`.toUpperCase();
}

function FollowingRow({ item }) {
  const name = item?.display_name || item?.full_name || item?.handle || "Perfil";
  const handle = item?.handle ? `@${String(item.handle).replace(/^@/, "")}` : "Sin usuario";
  const location = item?.location || "Ubicación no indicada";
  const avatar = item?.avatar_url || null;
  const target = item?.profile_id ? `/perfil/${item.profile_id}` : "/perfil";

  return (
    <Link to={target} className="app-card app-card--interactive followersPage__card">
      <div className="followersPage__cardBody">
        <div className="followersPage__identity">
          {avatar ? (
            <img src={avatar} alt={name} className="followersPage__avatar" />
          ) : (
            <div className="followersPage__avatar followersPage__avatar--fallback">
              {initials(name)}
            </div>
          )}

          <div className="followersPage__copy">
            <strong>{name}</strong>
            <span>{handle}</span>
            <small>{location}</small>
          </div>
        </div>

        <span className="app-badge">Ver perfil</span>
      </div>
    </Link>
  );
}

export default function FollowingPage() {
  const { me } = useAuth();
  const following = Array.isArray(me?.following) ? me.following : [];

  return (
    <section className="page followersPage">
      <div className="page__header">
        <span className="page__eyebrow">Perfil</span>
        <h1 className="page__title">Seguidos</h1>
        <p className="page__subtitle">
          {following.length === 0
            ? "Todavía no sigues a ningún perfil visible en la app."
            : `${following.length} ${following.length === 1 ? "perfil seguido" : "perfiles seguidos"}.`}
        </p>
      </div>

      {following.length === 0 ? (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No sigues a nadie todavía</strong>
            <p>Cuando empieces a seguir otros perfiles, aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className="followersPage__list">
          {following.map((item, index) => (
            <FollowingRow
              key={item?.profile_id || item?.user_id || item?.id || `following-${index}`}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}
