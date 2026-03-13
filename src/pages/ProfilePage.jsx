import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";
import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";
import { timeLabel } from "../utils/dates";

function getInitials(me) {
  const name = (me?.full_name || me?.name || "").trim();

  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return (me?.email?.[0] || "U").toUpperCase();
}

function getDisplayName(me) {
  return me?.full_name || me?.name || "Tu perfil";
}

function getHandle(me) {
  return me?.handle ? `@${me.handle}` : null;
}

function getBio(me) {
  return (
    me?.bio ||
    me?.description ||
    "Comparte tu actividad, conecta con otros deportistas y organiza próximos planes."
  );
}

function getLocation(me) {
  return me?.city || me?.location || me?.province || null;
}

function normalizeDisciplines(me) {
  const out = [];

  if (Array.isArray(me?.disciplines)) {
    for (const item of me.disciplines) {
      if (typeof item === "string") out.push(item);
      else if (item && typeof item === "object") {
        out.push(item.name || item.label || item.value || "");
      }
    }
  }

  if (me?.discipline) out.push(me.discipline);
  if (me?.primary_discipline) out.push(me.primary_discipline);
  if (me?.sport) out.push(me.sport);

  return [...new Set(out.filter(Boolean))].slice(0, 5);
}

function ProfileStat({ value, label, to }) {
  const content = (
    <div className="profile-stat">
      <div className="profile-stat__value">{value}</div>
      <div className="profile-stat__label">{label}</div>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="profile-stat-link">
      {content}
    </Link>
  );
}

function ActivityRow({ meetup }) {
  return (
    <article className="profile-activity-row">
      <div className="profile-activity-row__main">
        <div className="profile-activity-row__icon">🏃</div>

        <div className="profile-activity-row__content">
          <div className="profile-activity-row__title">
            {meetup?.meeting_point || meetup?.title || "Quedada"}
          </div>

          <div className="profile-activity-row__time">
            {timeLabel(meetup?.starts_at) || "Fecha pendiente"}
          </div>

          <div className="profile-activity-row__meta">
            {meetup?.group_name ? (
              <span className="app-chip app-chip--active">{meetup.group_name}</span>
            ) : null}

            {meetup?.level_tag ? <span className="app-chip">{meetup.level_tag}</span> : null}

            <span className="app-chip">
              {meetup?.participants_count ?? 0} inscritos
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const { me, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialTab = params.get("tab") === "posts" ? "posts" : "activity";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const nextTab = params.get("tab") === "posts" ? "posts" : "activity";
    setTab(nextTab);
  }, [params]);

  const {
    items: myMeetups,
    loading: meetupsLoading,
    error: meetupsError,
    reload,
  } = useMyMeetups();

  const displayName = useMemo(() => getDisplayName(me), [me]);
  const handle = useMemo(() => getHandle(me), [me]);
  const bio = useMemo(() => getBio(me), [me]);
  const location = useMemo(() => getLocation(me), [me]);
  const disciplines = useMemo(() => normalizeDisciplines(me), [me]);
  const initials = useMemo(() => getInitials(me), [me]);

  const sortedMeetups = useMemo(() => {
    const arr = Array.isArray(myMeetups) ? [...myMeetups] : [];
    arr.sort((a, b) => new Date(a?.starts_at) - new Date(b?.starts_at));
    return arr;
  }, [myMeetups]);

  const nextMeetups = useMemo(() => sortedMeetups.slice(0, 4), [sortedMeetups]);

  function handleLogout() {
    logout();
    toast?.info?.("Sesión cerrada");
    navigate("/", { replace: true });
  }

  function updateTab(nextTab) {
    setTab(nextTab);

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextTab === "posts") next.set("tab", "posts");
      else next.delete("tab");
      return next;
    });
  }

  return (
    <section className="page">
      <div className="page__hero profile-hero">
        <div className="profile-hero__main">
          <div className="profile-hero__identity">
            <div className="profile-hero__avatar-slot">
              {me?.avatar_url || me?.profile_picture ? (
                <div className="app-avatar app-avatar--xl profile-hero__avatar">
                  <img
                    src={me.avatar_url || me.profile_picture}
                    alt={displayName}
                  />
                </div>
              ) : (
                <div className="app-avatar app-avatar--xl profile-hero__avatar-fallback">
                  {initials}
                </div>
              )}
            </div>

            <div className="profile-hero__copy">
              <div className="page__header">
                <span className="page__eyebrow">Perfil</span>
                <h1 className="page__title">{displayName}</h1>
                {handle ? <div className="profile-hero__handle">{handle}</div> : null}
                <p className="page__subtitle">{bio}</p>
              </div>

              <div className="profile-hero__meta">
                {location ? <span className="app-chip app-chip--active">{location}</span> : null}
                {disciplines.map((item) => (
                  <span key={item} className="app-chip">
                    {item}
                  </span>
                ))}
              </div>

              <div className="profile-stats-grid">
                <ProfileStat value={me?.posts_count ?? 0} label="Publicaciones" />
                <ProfileStat
                  value={me?.followers_count ?? 0}
                  label="Seguidores"
                  to="/seguidores"
                />
                <ProfileStat
                  value={me?.following_count ?? 0}
                  label="Siguiendo"
                  to="/siguiendo"
                />
              </div>

              <div className="split-actions">
                <Link to="/onboarding" className="app-btn app-btn--primary">
                  Editar perfil
                </Link>
                <Link to="/seguidores" className="app-btn app-btn--secondary">
                  Seguidores
                </Link>
                <Link to="/siguiendo" className="app-btn app-btn--secondary">
                  Siguiendo
                </Link>
                <button
                  type="button"
                  className="app-btn app-btn--ghost"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page__columns profile-page-columns">
        <div className="app-stack app-stack--lg">
          <div className="app-card">
            <div className="app-card__body">
              <div className="app-tabs profile-tabs">
                <button
                  type="button"
                  className={`app-tab${tab === "activity" ? " app-tab--active" : ""}`}
                  onClick={() => updateTab("activity")}
                  aria-pressed={tab === "activity"}
                >
                  Actividad
                </button>

                <button
                  type="button"
                  className={`app-tab${tab === "posts" ? " app-tab--active" : ""}`}
                  onClick={() => updateTab("posts")}
                  aria-pressed={tab === "posts"}
                >
                  Publicaciones
                </button>
              </div>
            </div>
          </div>

          {tab === "activity" ? (
            <div className="app-stack app-stack--lg">
              <div className="app-card">
                <div className="app-card__header">
                  <div className="app-section-header">
                    <div>
                      <div className="app-section-header__title">Calendario</div>
                      <div className="app-section-header__subtitle">
                        Vista rápida de tu agenda deportiva y próximas actividades.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="app-card__body">
                  <div className="profile-calendar-wrap">
                    <MeetupCalendar items={sortedMeetups} />
                  </div>
                </div>
              </div>

              <div className="app-card">
                <div className="app-card__header">
                  <div className="app-section-header">
                    <div>
                      <div className="app-section-header__title">Próximas quedadas</div>
                      <div className="app-section-header__subtitle">
                        Tus próximos planes confirmados o pendientes.
                      </div>
                    </div>

                    <div className="split-actions">
                      <button
                        type="button"
                        className="app-btn app-btn--secondary app-btn--sm"
                        onClick={reload}
                        disabled={meetupsLoading}
                      >
                        {meetupsLoading ? "Actualizando…" : "Actualizar"}
                      </button>

                      <button
                        type="button"
                        className="app-btn app-btn--ghost app-btn--sm"
                        onClick={() => toast?.info?.("Añadir actividad próximamente")}
                      >
                        Añadir actividad
                      </button>
                    </div>
                  </div>
                </div>

                <div className="app-card__body">
                  {meetupsError ? (
                    <div className="app-empty-state">
                      <div className="app-empty-state__title">
                        No se pudo cargar tu actividad
                      </div>
                      <div className="app-empty-state__text">{meetupsError}</div>
                    </div>
                  ) : meetupsLoading ? (
                    <div className="app-empty-state">
                      <div className="app-empty-state__title">Cargando actividad</div>
                      <div className="app-empty-state__text">
                        Estamos actualizando tus próximas quedadas.
                      </div>
                    </div>
                  ) : nextMeetups.length === 0 ? (
                    <div className="app-empty-state">
                      <div className="app-empty-state__title">
                        Aún no tienes actividad próxima
                      </div>
                      <div className="app-empty-state__text">
                        Únete a un grupo o explora quedadas para empezar a llenar tu agenda.
                      </div>
                    </div>
                  ) : (
                    <div className="profile-activity-list">
                      {nextMeetups.map((meetup) => (
                        <ActivityRow key={meetup.id} meetup={meetup} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="app-card">
              <div className="app-card__header">
                <div className="app-section-header">
                  <div>
                    <div className="app-section-header__title">Tus publicaciones</div>
                    <div className="app-section-header__subtitle">
                      Revisa, sube y gestiona tu contenido desde un único panel.
                    </div>
                  </div>
                </div>
              </div>

              <div className="app-card__body">
                <PostsGrid />
              </div>
            </div>
          )}
        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Acciones rápidas</div>
              <p className="app-text-soft">
                Accede de forma directa a configuración, seguidores y publicación de contenido.
              </p>

              <div className="app-list">
                <Link to="/ajustes" className="profile-quick-link">
                  <span className="app-badge app-badge--primary">⚙</span>
                  <span>Ajustes de cuenta</span>
                </Link>

                <Link to="/seguidores" className="profile-quick-link">
                  <span className="app-badge app-badge--success">👥</span>
                  <span>Ver seguidores</span>
                </Link>

                <Link to="/siguiendo" className="profile-quick-link">
                  <span className="app-badge app-badge--warning">➜</span>
                  <span>Ver siguiendo</span>
                </Link>

                <button
                  type="button"
                  className="profile-quick-link profile-quick-link--button"
                  onClick={handleLogout}
                >
                  <span className="app-badge app-badge--danger">⎋</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Resumen</div>
              <div className="app-stat-grid">
                <div className="app-stat">
                  <div className="app-stat__value">{sortedMeetups.length}</div>
                  <div className="app-stat__label">Quedadas</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">{disciplines.length}</div>
                  <div className="app-stat__label">Disciplinas</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">{location || "—"}</div>
                  <div className="app-stat__label">Ubicación</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">{handle || "Perfil"}</div>
                  <div className="app-stat__label">Identidad</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
