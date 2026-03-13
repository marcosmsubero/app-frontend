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
    <div className="profilePage__stat">
      <strong className="profilePage__statValue">{value}</strong>
      <span className="profilePage__statLabel">{label}</span>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="profilePage__statLink">
      {content}
    </Link>
  );
}

function ActivityRow({ meetup }) {
  return (
    <article className="app-card profilePage__activityCard">
      <div className="app-card__header">
        <h3 className="app-card__title">
          {meetup?.meeting_point || meetup?.title || "Quedada"}
        </h3>
        <p className="app-card__description">
          {timeLabel(meetup?.starts_at) || "Fecha pendiente"}
        </p>
      </div>

      <div className="app-inline">
        {meetup?.group_name ? <span className="app-badge">{meetup.group_name}</span> : null}
        {meetup?.level_tag ? <span className="app-badge app-badge--primary">{meetup.level_tag}</span> : null}
        <span className="app-badge">{meetup?.participants_count ?? 0} inscritos</span>
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
    <div className="app-page profilePage">
      <section className="app-card profilePage__hero">
        <div className="profilePage__identity">
          {me?.avatar_url || me?.profile_picture ? (
            <img
              className="profilePage__avatarImage"
              src={me.avatar_url || me.profile_picture}
              alt={displayName}
            />
          ) : (
            <div className="profilePage__avatarFallback" aria-hidden="true">
              {initials}
            </div>
          )}

          <div className="profilePage__identityCopy">
            <span className="app-badge app-badge--primary">Perfil</span>
            <h2 className="profilePage__name">{displayName}</h2>
            {handle ? <p className="profilePage__handle">{handle}</p> : null}
            <p className="profilePage__bio">{bio}</p>

            {(location || disciplines.length > 0) && (
              <div className="app-inline">
                {location ? <span className="app-badge">{location}</span> : null}
                {disciplines.map((item) => (
                  <span key={item} className="app-badge">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="profilePage__actions">
          <Link to="/perfil/onboarding" className="app-button app-button--primary app-button--sm">
            Editar perfil
          </Link>
          <Link to="/followers" className="app-button app-button--secondary app-button--sm">
            Seguidores
          </Link>
          <Link to="/following" className="app-button app-button--ghost app-button--sm">
            Siguiendo
          </Link>
          <button type="button" className="app-button app-button--ghost app-button--sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="profilePage__stats">
        <ProfileStat value={sortedMeetups.length} label="Actividad" />
        <ProfileStat value="—" label="Posts" to="/perfil?tab=posts" />
        <ProfileStat value="Ver" label="Seguidores" to="/followers" />
        <ProfileStat value="Ver" label="Siguiendo" to="/following" />
      </section>

      <section className="app-card profilePage__tabsCard">
        <div className="profilePage__tabs">
          <button
            type="button"
            className={`profilePage__tab${tab === "activity" ? " profilePage__tab--active" : ""}`}
            onClick={() => updateTab("activity")}
            aria-pressed={tab === "activity"}
          >
            Actividad
          </button>
          <button
            type="button"
            className={`profilePage__tab${tab === "posts" ? " profilePage__tab--active" : ""}`}
            onClick={() => updateTab("posts")}
            aria-pressed={tab === "posts"}
          >
            Publicaciones
          </button>
        </div>
      </section>

      {tab === "activity" ? (
        <div className="profilePage__activityLayout">
          <section className="app-card profilePage__calendarCard">
            <div className="app-card__header">
              <span className="app-badge">Calendario</span>
              <h3 className="app-card__title">Vista rápida de tu agenda deportiva</h3>
              <p className="app-card__description">
                Consulta próximos planes y mantén visible tu actividad.
              </p>
            </div>

            <div className="profilePage__calendarWrap">
              <MeetupCalendar items={sortedMeetups} />
            </div>
          </section>

          <section className="app-card profilePage__upcomingCard">
            <div className="profilePage__sectionHead">
              <div className="app-card__header">
                <span className="app-badge app-badge--warning">Próximas quedadas</span>
                <h3 className="app-card__title">Tus siguientes planes</h3>
                <p className="app-card__description">
                  Confirmados o pendientes, con acceso rápido al estado de tu agenda.
                </p>
              </div>

              <div className="app-inline">
                <button
                  type="button"
                  className="app-button app-button--secondary app-button--sm"
                  onClick={reload}
                >
                  {meetupsLoading ? "Actualizando…" : "Actualizar"}
                </button>

                <button
                  type="button"
                  className="app-button app-button--ghost app-button--sm"
                  onClick={() => toast?.info?.("Añadir actividad próximamente")}
                >
                  Añadir actividad
                </button>
              </div>
            </div>

            {meetupsError ? (
              <div className="app-empty">
                <strong>No se pudo cargar tu actividad</strong>
                <span>{meetupsError}</span>
              </div>
            ) : meetupsLoading ? (
              <div className="app-empty">
                <strong>Cargando actividad</strong>
                <span>Estamos actualizando tus próximas quedadas.</span>
              </div>
            ) : nextMeetups.length === 0 ? (
              <div className="app-empty">
                <strong>Aún no tienes actividad próxima</strong>
                <span>Únete a un grupo o explora quedadas para empezar a llenar tu agenda.</span>
              </div>
            ) : (
              <div className="profilePage__activityList">
                {nextMeetups.map((meetup) => (
                  <ActivityRow
                    key={meetup?.id || `${meetup?.starts_at}-${meetup?.title || meetup?.meeting_point || "meetup"}`}
                    meetup={meetup}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="app-card profilePage__postsCard">
          <div className="app-card__header">
            <span className="app-badge">Tus publicaciones</span>
            <h3 className="app-card__title">Contenido compartido</h3>
            <p className="app-card__description">
              Una vista tipo grid para tus imágenes y publicaciones recientes.
            </p>
          </div>

          <PostsGrid />
        </section>
      )}
    </div>
  );
}
