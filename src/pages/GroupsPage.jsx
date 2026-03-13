import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupList from "../components/GroupList";
import { useGroups } from "../hooks/useGroups";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

function GroupInsight({ value, label, tone = "primary" }) {
  return (
    <div className="groupsPage__insightCard">
      <span className={`app-badge${tone !== "neutral" ? ` app-badge--${tone}` : ""}`}>
        {label}
      </span>
      <strong className="groupsPage__insightValue">{value}</strong>
    </div>
  );
}

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

  const [showCreate, setShowCreate] = useState(false);
  const [gName, setGName] = useState("");
  const [gSport, setGSport] = useState("");
  const [gCity, setGCity] = useState("");
  const [gPrivate, setGPrivate] = useState(false);

  const [inviteToken, setInviteToken] = useState("");

  const [filterSport, setFilterSport] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const isValidGroup = useMemo(() => {
    return gName.trim() && gSport.trim() && gCity.trim();
  }, [gName, gSport, gCity]);

  const visibleGroups = Array.isArray(groups) ? groups : [];
  const joinedGroups = visibleGroups.filter((group) => !!group?.my_role).length;
  const privateGroups = visibleGroups.filter((group) => !!group?.is_private).length;

  useEffect(() => {
    if (!isAuthed) return;
    loadGroups();
  }, [isAuthed]);

  async function handleCreateGroup() {
    if (!isValidGroup) {
      toast?.error?.("Completa nombre, deporte y ciudad");
      return;
    }

    const group = await createGroup({
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

    if (group?.id) {
      nav(`/groups/${group.id}`, { state: { groupName: group.name } });
    }
  }

  async function handleJoinInvite() {
    const tokenValue = inviteToken.trim();

    if (!tokenValue) {
      toast?.info?.("Pega un token de invitación");
      return;
    }

    await joinByInvite(tokenValue);
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

  async function handleOpenOrJoinGroup(group) {
    if (!group?.id) return;

    if (group.my_role) {
      nav(`/groups/${group.id}`, { state: { groupName: group.name } });
      return;
    }

    if (group.is_private) {
      toast?.info?.("Grupo privado. Únete con una invitación.");
      return;
    }

    await joinGroup(group.id);
    nav(`/groups/${group.id}`, { state: { groupName: group.name } });
  }

  return (
    <section className="groupsPage">
      <div className="groupsPage__hero app-section">
        <div className="groupsPage__heroMain">
          <div className="groupsPage__heroCopy">
            <span className="app-kicker">Comunidad</span>
            <h1 className="groupsPage__heroTitle">Gestiona tus grupos deportivos</h1>
            <p className="groupsPage__heroSubtitle">
              Busca comunidades por ciudad y deporte, crea tu propio grupo o accede
              con una invitación privada desde una experiencia más clara y escalable.
            </p>
          </div>

          <div className="groupsPage__heroActions">
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => setShowCreate((value) => !value)}
            >
              {showCreate ? "Cerrar creación" : "Crear grupo"}
            </button>

            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() => loadGroups()}
              disabled={loadingGroups}
            >
              {loadingGroups ? "Cargando…" : "Recargar"}
            </button>
          </div>
        </div>

        <div className="groupsPage__heroStats">
          <GroupInsight
            value={visibleGroups.length}
            label="Grupos visibles"
            tone="primary"
          />
          <GroupInsight
            value={joinedGroups}
            label="Ya unidos"
            tone="success"
          />
          <GroupInsight
            value={privateGroups}
            label="Privados"
            tone="warning"
          />
        </div>
      </div>

      <div className="groupsPage__layout">
        <div className="groupsPage__main">
          <section className="groupsPage__panel app-section">
            <div className="groupsPage__panelHead">
              <div>
                <p className="app-kicker">Discovery</p>
                <h2 className="app-title">Buscar grupos</h2>
                <p className="app-subtitle">
                  Filtra por deporte y ciudad para encontrar una comunidad afín con menos fricción.
                </p>
              </div>
            </div>

            <div className="groupsPage__filters">
              <div className="app-field">
                <label className="app-label" htmlFor="filter-sport">
                  Deporte
                </label>
                <input
                  id="filter-sport"
                  className="app-input"
                  placeholder="Ej. running, ciclismo, trail"
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  disabled={loadingGroups}
                />
              </div>

              <div className="app-field">
                <label className="app-label" htmlFor="filter-city">
                  Ciudad
                </label>
                <input
                  id="filter-city"
                  className="app-input"
                  placeholder="Ej. Alicante"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  disabled={loadingGroups}
                />
              </div>
            </div>

            <div className="groupsPage__panelActions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={handleSearch}
                disabled={loadingGroups}
              >
                Buscar
              </button>

              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={handleClearFilters}
                disabled={loadingGroups}
              >
                Limpiar filtros
              </button>
            </div>
          </section>

          {showCreate ? (
            <section className="groupsPage__panel app-section">
              <div className="groupsPage__panelHead">
                <div>
                  <p className="app-kicker">Creación</p>
                  <h2 className="app-title">Nuevo grupo</h2>
                  <p className="app-subtitle">
                    Crea una comunidad pública o privada con una configuración mínima y clara.
                  </p>
                </div>
              </div>

              <div className="groupsPage__createGrid">
                <div className="app-field">
                  <label className="app-label" htmlFor="group-name">
                    Nombre del grupo
                  </label>
                  <input
                    id="group-name"
                    className="app-input"
                    placeholder="Ej. Alicante Runners"
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    disabled={creatingGroup}
                  />
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="group-sport">
                    Deporte
                  </label>
                  <input
                    id="group-sport"
                    className="app-input"
                    placeholder="Ej. running"
                    value={gSport}
                    onChange={(e) => setGSport(e.target.value)}
                    disabled={creatingGroup}
                  />
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="group-city">
                    Ciudad
                  </label>
                  <input
                    id="group-city"
                    className="app-input"
                    placeholder="Ej. Alicante"
                    value={gCity}
                    onChange={(e) => setGCity(e.target.value)}
                    disabled={creatingGroup}
                  />
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="group-private">
                    Privacidad
                  </label>

                  <label className="groupsPage__checkbox" htmlFor="group-private">
                    <input
                      id="group-private"
                      type="checkbox"
                      checked={gPrivate}
                      onChange={(e) => setGPrivate(e.target.checked)}
                      disabled={creatingGroup}
                    />
                    <span>Grupo privado</span>
                  </label>

                  <p className="groupsPage__hint">
                    Los grupos privados requieren invitación para unirse.
                  </p>
                </div>
              </div>

              <div className="groupsPage__panelActions">
                <button
                  type="button"
                  className="app-button app-button--primary"
                  disabled={!isValidGroup || creatingGroup}
                  onClick={handleCreateGroup}
                >
                  {creatingGroup ? "Creando…" : "Crear grupo"}
                </button>

                <button
                  type="button"
                  className="app-button app-button--ghost"
                  onClick={() => setShowCreate(false)}
                  disabled={creatingGroup}
                >
                  Cancelar
                </button>
              </div>
            </section>
          ) : null}

          <section className="groupsPage__panel app-section">
            <div className="groupsPage__panelHead">
              <div>
                <p className="app-kicker">Comunidad</p>
                <h2 className="app-title">Listado de grupos</h2>
                <p className="app-subtitle">
                  Abre un grupo existente o únete directamente si está disponible.
                </p>
              </div>
            </div>

            <GroupList
              isAuthed={isAuthed}
              groups={groups}
              loadingGroups={loadingGroups}
              onLoadGroups={loadGroups}
              onOpenGroup={handleOpenOrJoinGroup}
            />
          </section>
        </div>

        <aside className="groupsPage__aside">
          <section className="groupsPage__asideCard app-section">
            <div className="groupsPage__panelHead">
              <div>
                <p className="app-kicker">Privado</p>
                <h2 className="app-title">Unirme con invitación</h2>
                <p className="app-subtitle">
                  Accede a grupos privados pegando el token compartido por un administrador.
                </p>
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="invite-token">
                Token de invitación
              </label>
              <input
                id="invite-token"
                className="app-input"
                placeholder="Pega aquí tu token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                disabled={joiningByInvite}
              />
            </div>

            <div className="groupsPage__panelActions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={handleJoinInvite}
                disabled={joiningByInvite}
              >
                {joiningByInvite ? "Uniéndome…" : "Unirme al grupo"}
              </button>
            </div>
          </section>

          <section className="groupsPage__asideCard app-section">
            <div className="groupsPage__panelHead">
              <div>
                <p className="app-kicker">Consejo</p>
                <h2 className="app-title">Mejor descubrimiento</h2>
                <p className="app-subtitle">
                  Prioriza nombres claros, una ciudad bien definida y un deporte principal por grupo para acelerar el descubrimiento.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
