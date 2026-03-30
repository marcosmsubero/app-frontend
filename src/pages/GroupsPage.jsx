import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

const SPAIN_PROVINCES = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Gipuzkoa",
  "Huelva",
  "Huesca",
  "Illes Balears",
  "Jaén",
  "La Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
  "Ceuta",
  "Melilla",
];

function panelTitle(title, subtitle) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {subtitle ? (
        <p style={{ margin: 0, color: "var(--app-text-muted)" }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function GroupSummaryCard({
  group,
  isOwner,
  onJoin,
  onEdit,
  onDelete,
  busyId,
  joinBusyId,
}) {
  const isPrivate = Boolean(group?.is_private);
  const membersCount = Number(group?.members_count ?? 0);
  const isJoined = Boolean(group?.my_role);
  const title = group?.name || "Grupo";
  const city = group?.city || "Provincia no indicada";

  return (
    <article className="app-card">
      <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
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
              <h4 style={{ margin: 0 }}>{title}</h4>
              <span className="app-chip app-chip--soft">{city}</span>
              <span className="app-chip app-chip--soft">
                {isPrivate ? "Privado" : "Público"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                color: "var(--app-text-muted)",
                fontSize: "var(--font-sm)",
              }}
            >
              <span>{membersCount} miembros</span>
              {group?.my_role ? <span>• Rol: {group.my_role}</span> : null}
            </div>
          </div>

          <Link to={`/groups/${group.id}`} className="app-button app-button--secondary">
            Ver grupo
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isOwner && !isJoined && !isPrivate ? (
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => onJoin?.(group)}
              disabled={joinBusyId === group.id}
            >
              {joinBusyId === group.id ? "Uniéndome…" : "Unirme"}
            </button>
          ) : null}

          {!isOwner && !isJoined && isPrivate ? (
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() => onJoin?.(group)}
              disabled
              title="Actualmente los grupos privados requieren invitación"
            >
              Privado
            </button>
          ) : null}

          {isOwner ? (
            <>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => onEdit?.(group)}
              >
                Editar
              </button>

              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => onDelete?.(group)}
                disabled={busyId === group.id}
              >
                {busyId === group.id ? "Eliminando…" : "Eliminar"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function GroupsPage() {
  const toast = useToast();
  const { token, me } = useAuth();

  const [selectedProvince, setSelectedProvince] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);

  const [form, setForm] = useState({
    id: null,
    name: "",
    city: "",
    is_private: false,
  });

  const currentUserId = me?.id ?? null;

  async function loadGroups(province = selectedProvince) {
    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();
      if (province) qs.set("city", province);

      const path = `/groups${qs.toString() ? `?${qs.toString()}` : ""}`;
      const res = await api(path, { token });
      setGroups(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los grupos.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createdGroups = useMemo(() => {
    return groups.filter((group) => currentUserId && group.owner_id === currentUserId);
  }, [currentUserId, groups]);

  const joinedGroups = useMemo(() => {
    return groups.filter(
      (group) =>
        Boolean(group?.my_role) &&
        (!currentUserId || group.owner_id !== currentUserId)
    );
  }, [currentUserId, groups]);

  function startCreate() {
    setCreating(true);
    setForm({
      id: null,
      name: "",
      city: selectedProvince || "",
      is_private: false,
    });
  }

  function startEdit(group) {
    setCreating(true);
    setForm({
      id: group.id,
      name: group.name || "",
      city: group.city || "",
      is_private: Boolean(group.is_private),
    });
  }

  function cancelForm() {
    setCreating(false);
    setForm({
      id: null,
      name: "",
      city: "",
      is_private: false,
    });
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitForm(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.city.trim()) {
      toast?.error?.("Introduce nombre y provincia.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      sport: "running",
      city: form.city.trim(),
      is_private: Boolean(form.is_private),
    };

    const targetId = form.id ?? "new";
    setSavingGroupId(targetId);

    try {
      if (form.id) {
        await api(`/groups/${form.id}`, {
          method: "PUT",
          token,
          body: payload,
        });
        toast?.success?.("Grupo actualizado.");
      } else {
        await api("/groups", {
          method: "POST",
          token,
          body: payload,
        });
        toast?.success?.("Grupo creado.");
      }

      cancelForm();
      await loadGroups(selectedProvince);
    } catch (e2) {
      toast?.error?.(e2?.message || "No se pudo guardar el grupo.");
    } finally {
      setSavingGroupId(null);
    }
  }

  async function handleDelete(group) {
    if (!group?.id) return;

    const ok = window.confirm(`¿Eliminar "${group.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setSavingGroupId(group.id);

    try {
      await api(`/groups/${group.id}`, {
        method: "DELETE",
        token,
      });
      toast?.success?.("Grupo eliminado.");
      await loadGroups(selectedProvince);
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo eliminar el grupo.");
    } finally {
      setSavingGroupId(null);
    }
  }

  async function handleJoin(group) {
    if (!group?.id) return;

    if (group.is_private) {
      toast?.info?.("Los grupos privados aún requieren invitación.");
      return;
    }

    setJoiningGroupId(group.id);

    try {
      await api(`/groups/${group.id}/join`, {
        method: "POST",
        token,
      });
      toast?.success?.("Te has unido al grupo.");
      await loadGroups(selectedProvince);
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo unir al grupo.");
    } finally {
      setJoiningGroupId(null);
    }
  }

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 18 }}>
          <div className="page__header" style={{ marginBottom: 0 }}>
            <span className="page__eyebrow">Grupos</span>
            <h1 className="page__title">Explora grupos por provincia</h1>
            <p className="page__subtitle">
              Busca grupos de running por provincia y gestiona tus grupos desde un panel personal.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label">Provincia</label>
              <select
                className="app-select"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Todas las provincias</option>
                {SPAIN_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() => loadGroups(selectedProvince)}
              disabled={loading}
            >
              {loading ? "Buscando…" : "Buscar"}
            </button>

            <button
              type="button"
              className="app-button app-button--primary"
              onClick={startCreate}
            >
              Crear grupo
            </button>
          </div>

          {creating ? (
            <form onSubmit={submitForm} className="app-card" style={{ background: "rgba(255,255,255,0.56)" }}>
              <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
                {panelTitle(
                  form.id ? "Editar grupo" : "Nuevo grupo",
                  "Solo grupos de running. El creador es quien puede editarlo o eliminarlo."
                )}

                <div className="app-field" style={{ marginBottom: 0 }}>
                  <label className="app-label">Nombre del grupo</label>
                  <input
                    className="app-input"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Ej. Alicante Runners"
                  />
                </div>

                <div className="app-field" style={{ marginBottom: 0 }}>
                  <label className="app-label">Provincia</label>
                  <select
                    className="app-select"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                  >
                    <option value="">Selecciona provincia</option>
                    {SPAIN_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_private}
                    onChange={(e) => updateForm("is_private", e.target.checked)}
                  />
                  Grupo privado
                </label>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="app-button app-button--primary"
                    disabled={savingGroupId === (form.id ?? "new")}
                  >
                    {savingGroupId === (form.id ?? "new")
                      ? "Guardando…"
                      : form.id
                      ? "Guardar cambios"
                      : "Crear grupo"}
                  </button>

                  <button
                    type="button"
                    className="app-button app-button--secondary"
                    onClick={cancelForm}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
            {panelTitle("Mis grupos creados", "Aquí aparecen solo los grupos que has creado tú.")}

            {createdGroups.length === 0 ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No has creado grupos aún</strong>
                  <p>Crea tu primer grupo para gestionar tu propia comunidad.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {createdGroups.map((group) => (
                  <GroupSummaryCard
                    key={group.id}
                    group={group}
                    isOwner
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    busyId={savingGroupId}
                    joinBusyId={joiningGroupId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
            {panelTitle("Grupos donde participo", "Grupos a los que perteneces y no has creado tú.")}

            {joinedGroups.length === 0 ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No perteneces a otros grupos</strong>
                  <p>Únete a grupos públicos desde la búsqueda por provincia.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {joinedGroups.map((group) => (
                  <GroupSummaryCard
                    key={group.id}
                    group={group}
                    isOwner={false}
                    onJoin={handleJoin}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    busyId={savingGroupId}
                    joinBusyId={joiningGroupId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
            {panelTitle(
              selectedProvince ? `Grupos en ${selectedProvince}` : "Todos los grupos",
              "Explora grupos públicos o privados por provincia."
            )}

            {error ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No se pudieron cargar</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Cargando grupos</strong>
                  <p>Estamos actualizando la búsqueda por provincia.</p>
                </div>
              </div>
            ) : groups.length === 0 ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No hay grupos disponibles</strong>
                  <p>No se han encontrado grupos para esta provincia.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {groups.map((group) => (
                  <GroupSummaryCard
                    key={group.id}
                    group={group}
                    isOwner={currentUserId && group.owner_id === currentUserId}
                    onJoin={handleJoin}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    busyId={savingGroupId}
                    joinBusyId={joiningGroupId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
