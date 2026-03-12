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
  CardHeader,
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
    "Perfil deportivo listo para conectar con otros usuarios, actividades y grupos."
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

function QuickStat({ value, label }) {
  return (
    <div className="profilePage__stat">
      <div className="profilePage__statValue">{value}</div>
      <div className="profilePage__statLabel">{label}</div>
    </div>
  );
}

function ActivityCard({ meetup, me }) {
  return (
    <article className="profilePage__activityCard">
      <div className="profilePage__activityTop">
        <div className="profilePage__activityIdentity">
          <Avatar
            size="sm"
            name={me?.full_name || me?.email || "Usuario"}
            alt={me?.full_name || me?.email || "Usuario"}
          />
          <div className="profilePage__activityIdentityText">
            <h3 className="profilePage__activityTitle">
              {meetup?.meeting_point || meetup?.title || "Quedada"}
            </h3>
            <p className="profilePage__activityTime">{timeLabel(meetup?.starts_at)}</p>
          </div>
        </div>

        <div className="profilePage__activityCount">
          <span className="profilePage__activityCountValue">
            {meetup?.participants_count ?? 0}
          </span>
          <span className="profilePage__activityCountLabel">inscritos</span>
        </div>
      </div>

      <div className="profilePage__activityMeta">
        {meetup?.group_name ? <Badge variant="neutral">{meetup.group_name}</Badge> : null}
        {meetup?.level_tag ? <Badge variant="primary">{meetup.level_tag}</Badge> : null}
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

  const nextMeetups = sortedMeetups.slice(0, 3);

  const stats = useMemo(
    () => [
      { value: sortedMeetups.length, label: "actividades" },
      { value: me?.followers_count ?? 0, label: "seguidores" },
      { value: me?.following_count ?? 0, label: "siguiendo" },
    ],
    [sortedMeetups.length, me]
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
        <div className="profilePage__heroGlow" />

        <div className="profilePage__heroMain">
          <div className="profilePage__avatarWrap">
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

          <div className="profilePage__heroText">
            <div className="profilePage__nameRow">
              <h1 className="profilePage__name">{displayName}</h1>
              {handle ? <span className="profilePage__handle">{handle}</span> : null}
            </div>

            <p className="profilePage__bio">{bio}</p>

            <div className="profilePage__metaRow">
              {location ? <Badge variant="neutral">{location}</Badge> : null}
              {disciplines.map((discipline) => (
                <Badge key={discipline} variant="primary">
                  {discipline}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="profilePage__stats">
          {stats.map((stat) => (
            <QuickStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>

        <div className="profilePage__heroActions">
          <Button as={Link} to="/ajustes" variant="primary">
            Ajustes
          </Button>
          <Button as={Link} to="/siguiendo" variant="secondary">
            Siguiendo
          </Button>
          <Button as={Link} to="/seguidores" variant="secondary">
            Seguidores
          </Button>
        </div>
      </section>

      <section className="profilePage__content">
        <div className="profilePage__segmentWrap" role="tablist" aria-label="Secciones del perfil">
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

        <Card className="profilePage__mainPanel">
          <CardHeader>
            <SectionHeader
              eyebrow={tab === "activity" ? "Movimiento" : "Contenido"}
              title={tab === "activity" ? "Tu actividad" : "Tus publicaciones"}
              description={
                tab === "activity"
                  ? "Consulta tu calendario y las próximas quedadas desde un mismo espacio."
                  : "Vista de tus publicaciones con un layout más limpio y consistente."
              }
              action={
                tab === "activity" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={reload}
                    disabled={meetupsLoading}
                  >
                    {meetupsLoading ? "Actualizando..." : "Actualizar"}
                  </Button>
                ) : null
              }
            />
          </CardHeader>

          <CardBody>
            {tab === "activity" ? (
              <div className="profilePage__panelContent">
                <div className="profilePage__calendarWrap">
                  <MeetupCalendar
                    meetups={myMeetups}
                    me={me}
                    onAdd={() => toast?.info?.("Añadir actividad próximamente")}
                  />
                </div>

                <div className="profilePage__summaryBlock">
                  <SectionHeader
                    title="Próximas actividades"
                    description="Resumen rápido de tus próximos planes."
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
                      title="Sin actividades próximas"
                      description="Cuando te unas o crees una actividad, aparecerá aquí."
                    />
                  ) : (
                    <div className="profilePage__activityList">
                      {nextMeetups.map((meetup) => (
                        <ActivityCard key={meetup.id} meetup={meetup} me={me} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="profilePage__postsWrap">
                <PostsGrid />
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="profilePage__secondaryPanel">
          <CardHeader>
            <SectionHeader
              eyebrow="Acciones"
              title="Gestión rápida"
              description="Accesos directos a las secciones secundarias del perfil."
            />
          </CardHeader>

          <CardBody>
            <div className="profilePage__quickLinks">
              <Button as={Link} to="/seguidores" variant="ghost" block>
                Ver seguidores
              </Button>
              <Button as={Link} to="/siguiendo" variant="ghost" block>
                Ver siguiendo
              </Button>
              <Button as={Link} to="/ajustes" variant="ghost" block>
                Ajustes de cuenta
              </Button>
              <Button variant="danger" block onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
