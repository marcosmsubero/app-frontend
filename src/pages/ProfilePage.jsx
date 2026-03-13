import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";

import { Badge, Button, Card, CardBody, EmptyState, Loader } from "../components/ui";

import { timeLabel } from "../utils/dates";

function getInitials(me) {
  const raw = (me?.full_name || me?.name || me?.handle || me?.email || "U").trim();

  return raw
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getDisplayName(me) {
  return me?.full_name || me?.name || "Tu perfil";
}

function getHandle(me) {
  return me?.handle ? `@${me.handle}` : "@usuario";
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

function getPosts(me) {
  if (Array.isArray(me?.posts)) return me.posts;
  if (Array.isArray(me?.publications)) return me.publications;
  if (Array.isArray(me?.feed_posts)) return me.feed_posts;
  return [];
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

function ActivityRow({ meetup, initials }) {
  return (
    <div className="feed-item" key={meetup?.id}>
      <div className="feed-ava">{initials}</div>

      <div className="feed-mid">
        <div className="feed-title">
          {meetup?.meeting_point || meetup?.title || "Quedada"}
        </div>

        <div className="feed-meta">
          {timeLabel(meetup?.starts_at) || "Fecha pendiente"}
          {meetup?.group_name ? ` · ${meetup.group_name}` : ""}
          {meetup?.level_tag ? ` · ${meetup.level_tag}` : ""}
        </div>
      </div>

      <div className="feed-right">
        <div className="feed-n">{meetup?.participants_count ?? 0}</div>
        <div className="feed-l">Inscritos</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { me, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialTab = params.get("tab") === "posts" ? "posts" : "calendar";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const nextTab = params.get("tab") === "posts" ? "posts" : "calendar";
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
  const posts = useMemo(() => getPosts(me), [me]);

  const sortedMeetups = useMemo(() => {
    const arr = Array.isArray(myMeetups) ? [...myMeetups] : [];
    arr.sort((a, b) => new Date(a?.starts_at) - new Date(b?.starts_at));
    return arr;
  }, [myMeetups]);

  const nextMeetups = useMemo(() => sortedMeetups.slice(0, 5), [sortedMeetups]);

  const stats = useMemo(
    () => [
      {
        value: Number(me?.posts_count ?? posts.length ?? 0),
        label: "Publicaciones",
        to: "/perfil?tab=posts",
      },
      {
        value: Number(me?.followers_count ?? 0),
        label: "Seguidores",
        to: "/perfil/seguidores",
      },
      {
        value: Number(me?.following_count ?? 0),
        label: "Siguiendo",
        to: "/perfil/siguiendo",
      },
    ],
    [me, posts.length]
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

      if (nextTab === "posts") {
        next.set("tab", "posts");
      } else {
        next.set("tab", "calendar");
      }

      return next;
    });
  }

  return (
    <div className="profilePage">
      <Card className="profilePage__hero">
        <CardBody>
          <div className="profilePage__identity">
            {me?.avatar_url ? (
              <img
                src={me.avatar_url}
                alt={displayName}
                className="profilePage__avatarImage"
              />
            ) : (
              <div className="profilePage__avatarFallback" aria-hidden="true">
                {initials}
              </div>
            )}

            <div className="profilePage__identityCopy">
              <div className="profilePage__headline">
                <div>
                  <h1 className="profilePage__name">{displayName}</h1>
                  <p className="profilePage__handle">{handle}</p>
                </div>

                <div className="profilePage__actions">
                  <Button as={Link} to="/onboarding" variant="secondary" size="md">
                    Editar perfil
                  </Button>

                  <Button type="button" variant="ghost" size="md" onClick={handleLogout}>
                    Cerrar sesión
                  </Button>
                </div>
              </div>

              <div className="profilePage__stats">
                {stats.map((stat) => (
                  <ProfileStat
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    to={stat.to}
                  />
                ))}
              </div>

              <p className="profilePage__bio">{bio}</p>

              <div className="profilePage__metaInline">
                {location ? <Badge>{location}</Badge> : null}
                {disciplines.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="profilePage__tabsCard">
        <CardBody>
          <div className="profilePage__tabs" role="tablist" aria-label="Contenido del perfil">
            <button
              type="button"
              className={`profilePage__tab ${
                tab === "posts" ? "profilePage__tab--active" : ""
              }`}
              aria-pressed={tab === "posts"}
              onClick={() => updateTab("posts")}
            >
              Publicaciones
            </button>

            <button
              type="button"
              className={`profilePage__tab ${
                tab === "calendar" ? "profilePage__tab--active" : ""
              }`}
              aria-pressed={tab === "calendar"}
              onClick={() => updateTab("calendar")}
            >
              Calendario
            </button>
          </div>
        </CardBody>
      </Card>

      {tab === "posts" ? (
        <Card className="profilePage__postsCard">
          <CardBody>
            <div className="profilePage__sectionHead">
              <div>
                <p className="app-kicker">Perfil</p>
                <h2 className="app-title">Tus publicaciones</h2>
                <p className="app-subtitle">
                  Vista visual del contenido compartido en tu perfil.
                </p>
              </div>
            </div>

            <PostsGrid posts={posts} />
          </CardBody>
        </Card>
      ) : (
        <div className="profilePage__activityLayout">
          <Card className="profilePage__calendarWrap">
            <CardBody>
              <div className="profilePage__sectionHead">
                <div>
                  <p className="app-kicker">Agenda</p>
                  <h2 className="app-title">Calendario deportivo</h2>
                  <p className="app-subtitle">
                    Consulta próximas quedadas y mantén visible tu ritmo de actividad.
                  </p>
                </div>

                <div className="profilePage__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => reload()}
                    disabled={meetupsLoading}
                  >
                    {meetupsLoading ? "Actualizando..." : "Actualizar"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => toast?.info?.("Añadir actividad próximamente")}
                  >
                    Añadir actividad
                  </Button>
                </div>
              </div>

              <MeetupCalendar
                meetups={myMeetups}
                me={me}
                onAdd={() => toast?.info?.("Añadir actividad próximamente")}
              />
            </CardBody>
          </Card>

          <Card className="profilePage__activityCard">
            <CardBody>
              <div className="profilePage__sectionHead">
                <div>
                  <p className="app-kicker">Próximo</p>
                  <h2 className="app-title">Tus siguientes planes</h2>
                  <p className="app-subtitle">
                    Acceso rápido a las quedadas más cercanas de tu agenda.
                  </p>
                </div>
              </div>

              {meetupsError ? (
                <EmptyState
                  title="No se pudo cargar tu actividad"
                  description={meetupsError}
                />
              ) : meetupsLoading ? (
                <Loader label="Actualizando actividad" />
              ) : nextMeetups.length === 0 ? (
                <EmptyState
                  title="Aún no tienes actividad próxima"
                  description="Únete a un grupo o explora quedadas para empezar a llenar tu calendario."
                />
              ) : (
                <div className="profilePage__activityList">
                  {nextMeetups.map((meetup) => (
                    <ActivityRow
                      key={meetup?.id}
                      meetup={meetup}
                      initials={initials}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
