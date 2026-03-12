import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";

import {
  Avatar,
  Badge,
  Button,
  Chip,
  EmptyState,
  Loader,
} from "../components/ui";

import { timeLabel } from "../utils/dates";
import "../styles/profile-page.css";

function getInitials(me) {
  const name = (me?.full_name || me?.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
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
    "Comparte tus actividades, conecta con otros deportistas y descubre nuevos planes."
  );
}

function normalizeDisciplines(me) {
  const values = [];

  if (Array.isArray(me?.disciplines)) {
    for (const item of me.disciplines) {
      if (typeof item === "string") values.push(item);
      else if (item && typeof item === "object") {
        values.push(item.name || item.label || item.value || "");
      }
    }
  }

  if (me?.discipline) values.push(me.discipline);
  if (me?.primary_discipline) values.push(me.primary_discipline);
  if (me?.sport) values.push(me.sport);

  return [...new Set(values.filter(Boolean))].slice(0, 3);
}

function formatLocation(me) {
  return me?.city || me?.location || me?.province || null;
}

function Stat({ value, label }) {
  return (
    <div className="profileIg__stat">
      <strong className="profileIg__statValue">{value}</strong>
      <span className="profileIg__statLabel">{label}</span>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ActivityRow({ meetup, me }) {
  return (
    <article className="profileIg__activityRow">
      <div className="profileIg__activityLeft">
        <Avatar
          size="sm"
          name={me?.full_name || me?.email || "Usuario"}
          alt={me?.full_name || me?.email || "Usuario"}
        />
        <div className="profileIg__activityText">
          <h3 className="profileIg__activityTitle">
            {meetup?.meeting_point || meetup?.title || "Quedada"}
          </h3>
          <p className="profileIg__activityTime">{timeLabel(meetup?.starts_at)}</p>
          <div className="profileIg__activityBadges">
            {meetup?.group_name ? <Badge variant="neutral">{meetup.group_name}</Badge> : null}
            {meetup?.level_tag ? <Badge variant="primary">{meetup.level_tag}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="profileIg__activityRight">
        <strong>{meetup?.participants_count ?? 0}</strong>
        <span>inscritos</span>
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const { me, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialTab = params.get("tab") === "activity" ? "activity" : "posts";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const nextTab = params.get("tab") === "activity" ? "activity" : "posts";
    setTab(nextTab);
  }, [params]);

  const {
    items: myMeetups,
    loading: meetupsLoading,
    error: meetupsError,
    reload,
  } = useMyMeetups();

  const initials = useMemo(() => getInitials(me), [me]);
  const displayName = useMemo(() => getDisplayName(me), [me]);
  const handle = useMemo(() => getHandle(me), [me]);
  const bio = useMemo(() => getBio(me), [me]);
  const disciplines = useMemo(() => normalizeDisciplines(me), [me]);
  const location = useMemo(() => formatLocation(me), [me]);

  const sortedMeetups = useMemo(() => {
    const arr = Array.isArray(myMeetups) ? [...myMeetups] : [];
    arr.sort((a, b) => new Date(a?.starts_at) - new Date(b?.starts_at));
    return arr;
  }, [myMeetups]);

  const nextMeetups = sortedMeetups.slice(0, 5);

  const stats = useMemo(
    () => [
      { value: me?.posts_count ?? 0, label: "publicaciones" },
      { value: me?.followers_count ?? 0, label: "seguidores" },
      { value: me?.following_count ?? 0, label: "siguiendo" },
    ],
    [me]
  );

  function handleLogout() {
    logout();
    toast?.info?.("Sesión cerrada");
    navigate("/", { replace: true });
  }

  function updateTab(nextTab) {
    setTab(nextTab);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextTab === "activity") next.set("tab", "activity");
      else next.delete("tab");
      return next;
    });
  }

  return (
    <div className="ui-page profileIg">
      <header className="profileIg__topbar">
        <div>
          <h1 className="profileIg__topbarTitle">{handle || displayName}</h1>
        </div>

        <div className="profileIg__topbarActions">
          <Button as={Link} to="/ajustes" variant="ghost" size="sm">
            Ajustes
          </Button>
        </div>
      </header>

      <section className="profileIg__header">
        <div className="profileIg__headerMain">
          <div className="profileIg__avatarCol">
            {me?.avatar_url || me?.profile_picture ? (
              <Avatar
                size="xl"
                src={me?.avatar_url || me?.profile_picture}
                alt={displayName}
                name={displayName}
                className="profileIg__avatar"
              />
            ) : (
              <div className="profileIg__avatarFallback" aria-label={displayName}>
                {initials}
              </div>
            )}
          </div>

          <div className="profileIg__statsCol">
            {stats.map((stat) => (
              <Stat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>

        <div className="profileIg__identity">
          <h2 className="profileIg__name">{displayName}</h2>
          {location ? <p className="profileIg__location">{location}</p> : null}
          <p className="profileIg__bio">{bio}</p>

          {!!disciplines.length && (
            <div className="profileIg__meta">
              {disciplines.map((discipline) => (
                <Badge key={discipline} variant="primary">
                  {discipline}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="profileIg__actions">
          <Button as={Link} to="/ajustes" variant="secondary" size="sm" block>
            Editar perfil
          </Button>
          <Button as={Link} to="/seguidores" variant="secondary" size="sm" block>
            Compartir perfil
          </Button>
        </div>

        <div className="profileIg__subactions">
          <Button as={Link} to="/seguidores" variant="ghost" size="sm">
            Seguidores
          </Button>
          <Button as={Link} to="/siguiendo" variant="ghost" size="sm">
            Siguiendo
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </section>

      <nav className="profileIg__tabs" aria-label="Secciones del perfil">
        <button
          type="button"
          className={`profileIg__tab ${tab === "posts" ? "is-active" : ""}`}
          onClick={() => updateTab("posts")}
          aria-pressed={tab === "posts"}
        >
          <GridIcon />
          <span>Publicaciones</span>
        </button>

        <button
          type="button"
          className={`profileIg__tab ${tab === "activity" ? "is-active" : ""}`}
          onClick={() => updateTab("activity")}
          aria-pressed={tab === "activity"}
        >
          <CalendarIcon />
          <span>Actividad</span>
        </button>
      </nav>

      <section className="profileIg__body">
        {tab === "posts" ? (
          <div className="profileIg__posts">
            <PostsGrid />
          </div>
        ) : (
          <div className="profileIg__activity">
            <div className="profileIg__activityToolbar">
              <div>
                <h3 className="profileIg__sectionTitle">Tus próximas actividades</h3>
                <p className="profileIg__sectionText">
                  Revisa calendario y próximos planes desde tu perfil.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={reload}
                disabled={meetupsLoading}
              >
                {meetupsLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>

            <div className="profileIg__calendarBlock">
              <MeetupCalendar
                meetups={myMeetups}
                me={me}
                onAdd={() => toast?.info?.("Añadir actividad próximamente")}
              />
            </div>

            <div className="profileIg__activityFeed">
              {meetupsError ? (
                <EmptyState
                  icon="⚠"
                  title="No se pudieron cargar las actividades"
                  description={meetupsError}
                  actionLabel="Reintentar"
                  onAction={reload}
                />
              ) : meetupsLoading ? (
                <Loader block label="Cargando actividades..." />
              ) : nextMeetups.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No tienes actividades próximas"
                  description="Cuando te unas o crees una actividad aparecerá aquí."
                />
              ) : (
                nextMeetups.map((meetup) => (
                  <ActivityRow key={meetup.id} meetup={meetup} me={me} />
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
