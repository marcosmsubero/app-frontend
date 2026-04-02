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
    <Link to={target} className="compactListItem">
      <div className="compactListItem__icon">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: 40, height: 40, borderRadius: 14, objectFit: "cover" }}
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>

      <div className="compactListItem__copy">
        <h3 className="compactListItem__title">{name}</h3>
        <p className="compactListItem__text">
          {handle} · {location}
        </p>
      </div>

      <div className="compactListItem__aside">Ver</div>
    </Link>
  );
}

export default function FollowersPage() {
  const { me } = useAuth();
  const followers = Array.isArray(me?.followers) ? me.followers : [];

  return (
    <section className="page">
      <section className="heroPanel">
        <div className="heroPanel__top">
          <div>
            <span className="sectionEyebrow">Perfil</span>
            <h1 className="heroPanel__title">Seguidores</h1>
          </div>

          <span className="heroPanel__badge">{followers.length}</span>
        </div>

        <p className="heroPanel__text">
          {followers.length === 0
            ? "Todavía no tienes seguidores visibles en la app."
            : `${followers.length} ${followers.length === 1 ? "perfil te sigue" : "perfiles te siguen"}.`}
        </p>
      </section>

      {followers.length === 0 ? (
        <div className="stateCard">
          <h3 className="stateCard__title">Sin seguidores todavía</h3>
          <p className="stateCard__text">
            Cuando la red social esté activa para tu perfil, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="compactList card">
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
