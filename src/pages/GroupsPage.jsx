import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";

function normalizeGroupsResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.groups)) return res.groups;
  return [];
}

function getGroupLocation(group) {
  return (
    group?.city ||
    group?.location ||
    group?.place ||
    group?.zone ||
    "Ubicación no indicada"
  );
}

function getGroupTitle(group) {
  return group?.name || group?.title || "Grupo";
}

function getGroupDescription(group) {
  return (
    group?.description ||
    group?.bio ||
    "Grupo de running para entrenar, quedar y compartir actividad."
  );
}

function getMembersCount(group) {
  if (typeof group?.members_count === "number") return group.members_count;
  if (typeof group?.member_count === "number") return group.member_count;
  if (Array.isArray(group?.members)) return group.members.length;
  return 0;
}

function isPrivateGroup(group) {
  return Boolean(group?.is_private || group?.private);
}

function GroupCard({ group, onJoin, joiningId }) {
  const title = getGroupTitle(group);
  const description = getGroupDescription(group);
  const location = getGroupLocation(group);
  const members = getMembersCount(group);
  const isPrivate = isPrivateGroup(group);
  const isJoining = joiningId === group.id;

  return (
    <article className="app-card">
      <div className="app-card__body" style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <span className="app-chip app-chip--soft">
                {isPrivate ? "Privado" : "Público"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                color: "var(--app-text-muted)",
                fontSize: "var(--font-sm)",
              }}
            >
              <span>{location}</span>
              <span>•</span>
              <span>{members} miembros</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => onJoin?.(group)}
              disabled={isJoining}
            >
              {isJoining
                ? "Procesando…"
                : isPrivate
                ? "Solicitar acceso"
                : "Unirme"}
            </button>

            <Link to={`/groups/${group.id}`} className="app-button app-button--secondary">
              Ver grupo
            </Link>
          </div>
        </div>

        <p style={{ margin: 0, color: "var(--app-text-muted)" }}>{description}</p>
      </div>
    </article>
  );
}

export default function GroupsPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState("all");
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      setLoading(true);
      setError("");

      try {
        const res = await api("/groups", { token });
        const items = normalizeGroupsResponse(res);

        if (!cancelled) {
          setGroups(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "No se pudieron cargar los grupos.");
          setGroups([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGroups();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const availableLocations = useMemo(() => {
    const values = [...new Set(groups.map((group) => getGroupLocation(group)).filter(Boolean))];
    return values.sort((a, b) => a.localeCompare(b));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    return groups.filter((group) => {
      const title = getGroupTitle(group).toLowerCase();
      const description = getGroupDescription(group).toLowerCase();
      const location = getGroupLocation(group);

      const matchesQuery =
        !q || title.includes(q) || description.includes(q) || location.toLowerCase().includes(q);

      const matchesLocation = !locationFilter || location === locationFilter;

      const matchesPrivacy =
        privacyFilter === "all" ||
        (privacyFilter === "public" && !isPrivateGroup(group)) ||
        (privacyFilter === "private" && isPrivateGroup(group));

      return matchesQuery && matchesLocation && matchesPrivacy;
    });
  }, [groups, locationFilter, privacyFilter, query]);

  async function handleJoin(group) {
    if (!group?.id) return;

    setJoiningId(group.id);

    try {
      await api(`/groups/${group.id}/join`, { method: "POST", token });

      toast?.success?.(
        isPrivateGroup(group)
          ? "Solicitud enviada correctamente."
          : "Te has unido al grupo."
      );
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo completar la acción.");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 16 }}>
          <div className="page__header" style={{ marginBottom: 0 }}>
            <span className="page__eyebrow">Grupos</span>
            <h1 className="page__title">Encuentra tu grupo runner</h1>
            <p className="page__subtitle">
              Explora grupos por ubicación, busca por nombre y únete o solicita acceso.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr)",
              gap: 12,
            }}
          >
            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label">Buscar grupo</label>
              <input
                className="app-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. Alicante Runners, trail, pista..."
              />
            </div>

            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label">Ubicación</label>
              <select
                className="app-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label">Tipo</label>
              <select
                className="app-select"
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="public">Públicos</option>
                <option value="private">Privados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="app-card">
          <div className="app-card__body">
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>Cargando grupos</strong>
                <p>Estamos preparando la exploración.</p>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="app-card">
          <div className="app-card__body">
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No se pudieron cargar</strong>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="app-card">
          <div className="app-card__body">
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No hay grupos para este filtro</strong>
                <p>Prueba otra búsqueda o cambia la ubicación.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={handleJoin}
              joiningId={joiningId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
