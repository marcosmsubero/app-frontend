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

export default function FollowingPage() {
  const { me } = useAuth();
  const following = Array.isArray(me?.following) ? me.following : [];

  return (
    <section className="page">
      <section className="heroPanel">
        <div className="heroPanel__top">
          <div>
            <span className="sectionEyebrow">Perfil</span>
            <h1 className="heroPanel__title">Seguidos</h1>
          </div>

          <span className="heroPanel__badge">{following.length}</span>
        </div>

        <p className="heroPanel__text">
          {following.length === 0
            ? "Todavía no sigues a ningún perfil visible en la app."
            : `${following.length} ${following.length === 1 ? "perfil seguido" : "perfiles seguidos"}.`}
        </p>
      </section>

      {following.length === 0 ? (
        <div className="stateCard">
          <h3 className="stateCard__title">No sigues a nadie todavía</h3>
          <p className="stateCard__text">
            Cuando empieces a seguir otros perfiles, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="compactList card">
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
