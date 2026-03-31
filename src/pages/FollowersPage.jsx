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

function FollowerRow({ item }) {
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

export default function FollowersPage() {
  const { me } = useAuth();
  const followers = Array.isArray(me?.followers) ? me.followers : [];

  return (
    <section className="page followersPage">
      <div className="page__header">
        <span className="page__eyebrow">Perfil</span>
        <h1 className="page__title">Seguidores</h1>
        <p className="page__subtitle">
          {followers.length === 0
            ? "Todavía no tienes seguidores visibles en la app."
            : `${followers.length} ${followers.length === 1 ? "perfil te sigue" : "perfiles te siguen"}.`}
        </p>
      </div>

      {followers.length === 0 ? (
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>Sin seguidores todavía</strong>
            <p>Cuando la red social esté activa para tu perfil, aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className="followersPage__list">
          {followers.map((item, index) => (
            <FollowerRow
              key={item?.profile_id || item?.user_id || item?.id || `follower-${index}`}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}
