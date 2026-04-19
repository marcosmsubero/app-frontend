import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { apiListMyProfileVisits } from "../services/api";

function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return `${a}${b}`.toUpperCase();
}

function formatRelative(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "hace instantes";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function VisitRow({ item }) {
  const name = item?.viewer_full_name || item?.viewer_handle || "Alguien";
  const handle = item?.viewer_handle ? `@${String(item.viewer_handle).replace(/^@/, "")}` : null;
  const avatar = item?.viewer_avatar_url || null;
  const to = item?.viewer_user_id ? `/perfil/${item.viewer_user_id}` : "/perfil";

  return (
    <Link to={to} className="compactListItem">
      <div className="compactListItem__icon">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>

      <div className="compactListItem__copy">
        <h3 className="compactListItem__title">{name}</h3>
        <p className="compactListItem__text">
          {handle ? `${handle} · ` : ""}
          {formatRelative(item?.created_at)}
        </p>
      </div>

      <div className="compactListItem__aside"></div>
    </Link>
  );
}

export default function ProfileVisitsPage() {
  const { me, token } = useAuth();
  const { blockedIds } = useBlockedIds();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isPremium = Boolean(me?.is_premium);

  const visible = useMemo(
    () =>
      visits.filter((item) => {
        const uid = item?.viewer_user_id;
        if (uid == null) return true;
        return !blockedIds.has(String(uid));
      }),
    [visits, blockedIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token || !isPremium) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await apiListMyProfileVisits({ limit: 80 }, token);
        if (!cancelled) setVisits(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setVisits([]);
          setError(e?.message || "No se pudieron cargar las visitas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, isPremium]);

  if (!isPremium) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Función premium</h3>
          <p className="stateCard__text">
            Ver quién visita tu perfil es parte de la suscripción premium.
            Activa premium en ajustes para desbloquear esta sección.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page profilePage">
      <header className="pageHeader">
        <h1 className="pageHeader__title">Visitas a tu perfil</h1>
      </header>

      {loading ? (
        <div className="stateCard">
          <p className="stateCard__text">Cargando…</p>
        </div>
      ) : error ? (
        <div className="stateCard">
          <h3 className="stateCard__title">Error</h3>
          <p className="stateCard__text">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="stateCard">
          <p className="stateCard__text">Aún no tienes visitas recientes.</p>
        </div>
      ) : (
        <div className="compactList">
          {visible.map((item) => (
            <VisitRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
