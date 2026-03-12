import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupList from "../components/GroupList";
import { useGroups } from "../hooks/useGroups";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function GroupsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token, isAuthed } = useAuth();

  const {
    groups,
    loadGroups,
    createGroup,
    joinGroup,
    joinByInvite,
    loadingGroups,
    creatingGroup,
    joiningByInvite,
  } = useGroups(token, toast);

  // Crear grupo
  const [showCreate, setShowCreate] = useState(false);
  const [gName, setGName] = useState("");
  const [gSport, setGSport] = useState("");
  const [gCity, setGCity] = useState("");
  const [gPrivate, setGPrivate] = useState(false);

  // Invitación
  const [inviteToken, setInviteToken] = useState("");

  // Filtros
  const [filterSport, setFilterSport] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const isValidGroup = useMemo(() => {
    return gName.trim() && gSport.trim() && gCity.trim();
  }, [gName, gSport, gCity]);

  useEffect(() => {
    if (!isAuthed) return;
    loadGroups();
  }, [isAuthed]);

  async function handleCreateGroup() {
    if (!isValidGroup) {
      toast?.error?.("Completa nombre, deporte y ciudad");
      return;
    }

    const g = await createGroup({
      name: gName.trim(),
      sport: gSport.trim(),
      city: gCity.trim(),
      is_private: gPrivate,
    });

    setShowCreate(false);
    setGName("");
    setGSport("");
    setGCity("");
    setGPrivate(false);

    if (g?.id) nav(`/groups/${g.id}`, { state: { groupName: g.name } });
  }

  async function handleJoinInvite() {
    const t = inviteToken.trim();
    if (!t) {
      toast?.info?.("Pega un token de invitación");
      return;
    }
    await joinByInvite(t);
    setInviteToken("");
  }

  async function handleSearch() {
    const qs = new URLSearchParams();
    if (filterSport.trim()) qs.set("sport", filterSport.trim());
    if (filterCity.trim()) qs.set("city", filterCity.trim());

    const query = qs.toString() ? `?${qs.toString()}` : "";
    await loadGroups(query);
  }

  function handleClearFilters() {
    setFilterSport("");
    setFilterCity("");
    loadGroups();
  }

  async function handleOpenOrJoinGroup(g) {
    if (!g?.id) return;

    if (g.my_role) {
      nav(`/groups/${g.id}`, { state: { groupName: g.name } });
      return;
    }

    if (g.is_private) {
      toast?.info?.("Grupo privado. Únete con una invitación.");
      return;
    }

    await joinGroup(g.id);
    nav(`/groups/${g.id}`, { state: { groupName: g.name } });
  }

  return (
    <div className="stack">
      {/* Volver atrás */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <button className="link-btn" onClick={() => nav(-1)}>
          ← Volver
        </button>
        <h2 className="m0">Grupos</h2>
      </div>

      {isAuthed && (
        <>
          {/* Filtros */}
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              className="input-wide"
              placeholder="Deporte (ej. running)"
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              disabled={loadingGroups}
              style={{ maxWidth: 240 }}
            />

            <input
              className="input-wide"
              placeholder="Ciudad"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              disabled={loadingGroups}
              style={{ maxWidth: 240 }}
            />

            <button onClick={handleSearch} disabled={loadingGroups}>
              Buscar
            </button>

            <button
              className="btn-secondary"
              onClick={handleClearFilters}
              disabled={loadingGroups}
            >
              Limpiar
            </button>

            <button onClick={loadGroups} disabled={loadingGroups}>
              {loadingGroups ? "Cargando…" : "Recargar"}
            </button>
          </div>

          {/* Crear grupo */}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "✖ Cancelar" : "➕ Crear grupo"}
            </button>
          </div>

          {showCreate && (
            <div
              className="stack"
              style={{
                padding: 14,
                borderRadius: 8,
                background: "#1e1e1e",
              }}
            >
              <input
                className={`input-wide ${!gName.trim() ? "input-error" : ""}`}
                placeholder="Nombre del grupo"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                disabled={creatingGroup}
              />

              <input
                className={`input-wide ${!gSport.trim() ? "input-error" : ""}`}
                placeholder="Deporte"
                value={gSport}
                onChange={(e) => setGSport(e.target.value)}
                disabled={creatingGroup}
              />

              <input
                className={`input-wide ${!gCity.trim() ? "input-error" : ""}`}
                placeholder="Ciudad"
                value={gCity}
                onChange={(e) => setGCity(e.target.value)}
                disabled={creatingGroup}
              />

              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={gPrivate}
                  onChange={(e) => setGPrivate(e.target.checked)}
                  disabled={creatingGroup}
                />
                Grupo privado
              </label>

              <div className="row" style={{ gap: 8 }}>
                <button
                  disabled={!isValidGroup || creatingGroup}
                  onClick={handleCreateGroup}
                >
                  {creatingGroup ? "Creando…" : "Crear"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowCreate(false)}
                  disabled={creatingGroup}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Unirse por invitación */}
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input-wide"
              placeholder="Token de invitación"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              disabled={joiningByInvite}
            />
            <button onClick={handleJoinInvite} disabled={joiningByInvite}>
              {joiningByInvite ? "Uniéndote…" : "Unirme"}
            </button>
          </div>
        </>
      )}

      {/* Lista */}
      <GroupList
        isAuthed={isAuthed}
        groups={groups}
        loadingGroups={loadingGroups}
        onLoadGroups={loadGroups}
        onOpenGroup={handleOpenOrJoinGroup}
      />
    </div>
  );
}