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
    <section className="page">
      <div className="page__hero glass-banner">
        <div className="glass-banner__body">
          <div className="page__header">
            <span className="page__eyebrow">Comunidad</span>
            <h1 className="page__title">Gestiona tus grupos deportivos</h1>
            <p className="page__subtitle">
              Busca comunidades por ciudad y deporte, crea tu propio grupo o accede con una
              invitación privada.
            </p>
          </div>

          <div className="split-actions">
            <button
              type="button"
              className="app-btn app-btn--primary"
              onClick={() => setShowCreate((value) => !value)}
            >
              {showCreate ? "Cerrar creación" : "Crear grupo"}
            </button>

            <button
              type="button"
              className="app-btn app-btn--secondary"
              onClick={() => loadGroups()}
              disabled={loadingGroups}
            >
              {loadingGroups ? "Cargando…" : "Recargar"}
            </button>
          </div>
        </div>
      </div>

      <div className="page__columns">
        <div className="app-stack app-stack--lg">
          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">Buscar grupos</div>
                  <div className="app-section-header__subtitle">
                    Filtra por deporte y ciudad para encontrar comunidad afín.
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card__body">
              <div className="form-grid form-grid--2">
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

              <div className="split-actions" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  onClick={handleSearch}
                  disabled={loadingGroups}
                >
                  Buscar
                </button>

                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={handleClearFilters}
                  disabled={loadingGroups}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {showCreate ? (
            <div className="app-card">
              <div className="app-card__header">
                <div className="app-section-header">
                  <div>
                    <div className="app-section-header__title">Nuevo grupo</div>
                    <div className="app-section-header__subtitle">
                      Crea una comunidad pública o privada en pocos pasos.
                    </div>
                  </div>
                </div>
              </div>

              <div className="app-card__body app-stack">
                <div className="form-grid form-grid--2">
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
                    <label className="app-checkbox" htmlFor="group-private">
                      <input
                        id="group-private"
                        type="checkbox"
                        checked={gPrivate}
                        onChange={(e) => setGPrivate(e.target.checked)}
                        disabled={creatingGroup}
                      />
                      <span>Grupo privado</span>
                    </label>
                    <div className="app-field__hint">
                      Los grupos privados requieren invitación para unirse.
                    </div>
                  </div>
                </div>

                <div className="split-actions">
                  <button
                    type="button"
                    className="app-btn app-btn--primary"
                    disabled={!isValidGroup || creatingGroup}
                    onClick={handleCreateGroup}
                  >
                    {creatingGroup ? "Creando…" : "Crear grupo"}
                  </button>

                  <button
                    type="button"
                    className="app-btn app-btn--secondary"
                    onClick={() => setShowCreate(false)}
                    disabled={creatingGroup}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">Listado de grupos</div>
                  <div className="app-section-header__subtitle">
                    Abre un grupo existente o únete directamente si está disponible.
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card__body">
              <GroupList
                isAuthed={isAuthed}
                groups={groups}
                loadingGroups={loadingGroups}
                onLoadGroups={loadGroups}
                onOpenGroup={handleOpenOrJoinGroup}
              />
            </div>
          </div>
        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Unirme con invitación</div>
              <p className="app-text-soft">
                Accede a grupos privados pegando el token compartido por un administrador.
              </p>

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

              <button
                type="button"
                className="app-btn app-btn--primary"
                onClick={handleJoinInvite}
                disabled={joiningByInvite}
              >
                {joiningByInvite ? "Uniéndome…" : "Unirme al grupo"}
              </button>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Consejo de producto</div>
              <p className="app-text-soft">
                Prioriza nombres claros, una ciudad bien definida y un deporte principal por grupo
                para que el descubrimiento sea más rápido.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
