import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { apiProfileFollowing } from "../services/api";

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

      <div className="compactListItem__aside"></div>
    </Link>
  );
}

export default function FollowingPage() {
  const { me, token } = useAuth();
  const { blockedIds } = useBlockedIds();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const myProfileId = me?.app_profile_id || me?.id;

  const visibleFollowing = useMemo(
    () =>
      following.filter((item) => {
        const uid = item?.user_id ?? item?.owner_user_id;
        if (uid == null) return true;
        return !blockedIds.has(String(uid));
      }),
    [following, blockedIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!myProfileId || !token) return;
      setLoading(true);
      setError("");
      try {
        const data = await apiProfileFollowing(myProfileId, token);
        if (!cancelled) {
          setFollowing(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (e) {
        if (!cancelled) {
          setFollowing([]);
          setError(e?.message || "No se pudieron cargar los seguidos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [myProfileId, token]);

  return (
    <section className="page">
      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">Seguidos</div>
          </div>

          <span className="app-badge app-badge--primary">{visibleFollowing.length}</span>
        </div>
      </section>

      {!loading && error ? (
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudieron cargar</h3>
          <p className="stateCard__text">{error}</p>
        </div>
      ) : !loading && visibleFollowing.length === 0 ? (
        <div className="stateCard">
          <h3 className="stateCard__title">No sigues a nadie todavía</h3>
          <p className="stateCard__text">
            Cuando empieces a seguir otros perfiles, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="compactList card">
          {visibleFollowing.map((item, index) => (
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
