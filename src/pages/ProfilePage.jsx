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
  Card,
  CardBody,
  Chip,
  EmptyState,
  Loader,
  SectionHeader,
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

  return [...new Set(out.filter(Boolean))].slice(0, 3);
}

function Stat({ value, label }) {
  return (
    <div className="profilePage__stat">
      <strong className="profilePage__statValue">{value}</strong>
      <span className="profilePage__statLabel">{label}</span>
    </div>
  );
}

function ActivityItem({ meetup, me }) {
  return (
    <article className="profilePage__activityItem">
      <div className="profilePage__activityMain">
        <div className="profilePage__activityAvatar">
          <Avatar
            size="sm"
            name={me?.full_name || me?.email || "Usuario"}
            alt={me?.full_name || me?.email || "Usuario"}
          />
        </div>

        <div className="profilePage__activityContent">
          <h3 className="profilePage__activityTitle">
            {meetup?.meeting_point || meetup?.title || "Quedada"}
          </h3>

          <p className="profilePage__activityTime">{timeLabel(meetup?.starts_at)}</p>

          <div className="profilePage__activityMeta">
            {meetup?.group_name ? <Badge variant="neutral">{meetup.group_name}</Badge> : null}
            {meetup?.level_tag ? <Badge variant="primary">{meetup.level_tag}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="profilePage__activitySide">
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
      if (nextTab === "posts") next.set("tab", "posts");
      else next.delete("tab");
      return next;
    });
  }

  return (
    <div className="ui-page profilePage">
      <section className="profilePage__hero">
        <div className="profilePage__heroMain">
          <div className="profilePage__identityBlock">
            <div className="profilePage__avatarSlot">
              {me?.avatar_url || me?.profile_picture ? (
                <Avatar
                  size="xl"
                  src={me?.avatar_url || me?.profile_picture}
                  alt={displayName}
                  name={displayName}
                  className="profilePage__avatar"
                />
              ) : (
                <div className="profilePage__avatarFallback" aria-label={displayName}>
                  {initials}
                </div>
              )}
            </div>

            <div className="profilePage__identityText">
              <div className="profilePage__titleRow">
                <h1 className="profilePage__name">{displayName}</h1>
                {handle ? <span className="profilePage__handle">{handle}</span> : null}
              </div>

              <div className="profilePage__stats">
                {stats.map((stat) => (
                  <Stat key={stat.label} value={stat.value} label={stat.label} />
                ))}
              </div>

              <p className="profilePage__bio">{bio}</p>

              <div className="profilePage__meta">
                {location ? <Badge variant="neutral">{location}</Badge> : null}
                {disciplines.map((item) => (
                  <Badge key={item} variant="primary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="profilePage__actions">
            <Button as={Link} to="/ajustes" variant="secondary" size="sm" block>
              Editar perfil
            </Button>
            <Button as={Link} to="/seguidores" variant="secondary" size="sm" block>
              Seguidores
            </Button>
            <Button as={Link} to="/siguiendo" variant="secondary" size="sm" block>
              Siguiendo
            </Button>
            <Button variant="ghost" size="sm" block onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>

      <div className="profilePage__tabs" role="tablist" aria-label="Secciones del perfil">
        <Chip
          active={tab === "activity"}
          onClick={() => updateTab("activity")}
          aria-pressed={tab === "activity"}
          size="lg"
        >
          Actividad
        </Chip>
        <Chip
          active={tab === "posts"}
          onClick={() => updateTab("posts")}
          aria-pressed={tab === "posts"}
          size="lg"
        >
          Publicaciones
        </Chip>
      </div>

      <section className="profilePage__layout">
        <div className="profilePage__main">
          {tab === "activity" ? (
            <div className="profilePage__activityView">
              <Card className="profilePage__calendarCard">
                <CardBody>
                  <SectionHeader
                    eyebrow="Calendario"
                    title="Tu actividad"
                    description="Aquí ves tus quedadas y entrenamientos programados."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={reload}
                        disabled={meetupsLoading}
                      >
                        {meetupsLoading ? "Actualizando..." : "Actualizar"}
                      </Button>
                    }
                  />

                  <div className="profilePage__calendarWrap">
                    <MeetupCalendar
                      meetups={myMeetups}
                      me={me}
                      onAdd={() => toast?.info?.("Añadir actividad próximamente")}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card className="profilePage__upcomingCard">
                <CardBody>
                  <SectionHeader
                    eyebrow="Resumen"
                    title="Próximas actividades"
                    description="Vista rápida de tus siguientes planes."
                  />

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
                    <div className="profilePage__activityList">
                      {nextMeetups.map((meetup) => (
                        <ActivityItem key={meetup.id} meetup={meetup} me={me} />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : (
            <Card className="profilePage__postsCard">
              <CardBody>
                <SectionHeader
                  eyebrow="Perfil"
                  title="Tus publicaciones"
                  description="Presentación más limpia del grid, manteniendo el componente actual."
                />

                <div className="profilePage__postsWrap">
                  <PostsGrid />
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="profilePage__sidebar">
          <Card className="profilePage__sidebarCard">
            <CardBody>
              <SectionHeader
                eyebrow="Accesos"
                title="Gestión rápida"
                description="Atajos útiles del perfil."
              />

              <div className="profilePage__quickActions">
                <Button as={Link} to="/ajustes" variant="ghost" block>
                  Ajustes de cuenta
                </Button>
                <Button as={Link} to="/seguidores" variant="ghost" block>
                  Ver seguidores
                </Button>
                <Button as={Link} to="/siguiendo" variant="ghost" block>
                  Ver siguiendo
                </Button>
                <Button variant="danger" block onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            </CardBody>
          </Card>
        </aside>
      </section>
    </div>
  );
}
