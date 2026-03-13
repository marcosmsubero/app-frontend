import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";
import ProfileCard from "../components/ProfileCard";

import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Loader,
} from "../components/ui";

import { timeLabel } from "../utils/dates";

function getInitials(me) {
  const name = (me?.full_name || me?.name || "").trim();

  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
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

  return [...new Set(out.filter(Boolean))].slice(0, 4);
}

function getPosts(me) {
  if (Array.isArray(me?.posts)) return me.posts;
  if (Array.isArray(me?.publications)) return me.publications;
  if (Array.isArray(me?.feed_posts)) return me.feed_posts;
  return [];
}

function ProfileStat({ value, label, to }) {
  const content = (
    <div className="profile-stat card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="profile-statLink">
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
  const { me, logout, token } = useAuth();
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
  const posts = useMemo(() => getPosts(me), [me]);

  const sortedMeetups = useMemo(() => {
    const arr = Array.isArray(myMeetups) ? [...myMeetups] : [];
    arr.sort((a, b) => new Date(a?.starts_at) - new Date(b?.starts_at));
    return arr;
  }, [myMeetups]);

  const nextMeetups = useMemo(() => sortedMeetups.slice(0, 4), [sortedMeetups]);

  const stats = useMemo(
    () => [
      {
        value: Number(me?.posts_count ?? posts.length ?? 0),
        label: "publicaciones",
        to: "/perfil?tab=posts",
      },
      {
        value: Number(me?.followers_count ?? 0),
        label: "seguidores",
        to: "/perfil/seguidores",
      },
      {
        value: Number(me?.following_count ?? 0),
        label: "siguiendo",
        to: "/perfil/seguidos",
      },
    ],
    [me, posts.length]
  );

  const nextMeetup = nextMeetups[0] || null;

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
    <div className="profile-pageShell">
      <ProfileCard me={me} token={token} onLogout={handleLogout} />

      <Card className="profile-overview">
        <CardBody>
          <div className="profile-sectionHead">
            <div>
              <p className="profile-sectionEyebrow">Resumen</p>
              <h2 className="m0">{displayName}</h2>
              <p className="profile-sectionSub m0">
                {handle} · {bio}
              </p>
            </div>

            <div className="profile-overviewActions">
              <Button
                as={Link}
                to="/onboarding"
                variant="secondary"
                size="md"
              >
                Editar perfil
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>

          <div className="profile-metaRow">
            {location ? <Badge>{location}</Badge> : null}
            {disciplines.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>

          <div className="profile-statsGrid">
            {stats.map((stat) => (
              <ProfileStat
                key={stat.label}
                value={stat.value}
                label={stat.label}
                to={stat.to}
              />
            ))}
          </div>

          <div className="profile-summaryGrid">
            <Card className="profile-summaryCard">
              <CardBody>
                <div className="profile-summaryLabel">Siguiente actividad</div>
                <strong className="profile-summaryValue">
                  {nextMeetup?.meeting_point || nextMeetup?.title || "Sin planes"}
                </strong>
                <p className="profile-summaryText m0">
                  {nextMeetup
                    ? timeLabel(nextMeetup?.starts_at) || "Fecha pendiente"
                    : "Aún no tienes una próxima actividad programada."}
                </p>
              </CardBody>
            </Card>

            <Card className="profile-summaryCard">
              <CardBody>
                <div className="profile-summaryLabel">Estado del perfil</div>
                <strong className="profile-summaryValue">
                  {disciplines.length > 0 ? "Perfil activo" : "Perfil incompleto"}
                </strong>
                <p className="profile-summaryText m0">
                  {disciplines.length > 0
                    ? "Tu perfil ya comunica disciplina y contexto deportivo."
                    : "Añade disciplinas y detalles para mejorar tu descubrimiento."}
                </p>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      <div className="profile-tabs" role="tablist" aria-label="Secciones del perfil">
        <button
          type="button"
          className={`profile-tabBtn ${tab === "activity" ? "active" : ""}`}
          aria-pressed={tab === "activity"}
          onClick={() => updateTab("activity")}
        >
          Actividad
        </button>

        <button
          type="button"
          className={`profile-tabBtn ${tab === "posts" ? "active" : ""}`}
          aria-pressed={tab === "posts"}
          onClick={() => updateTab("posts")}
        >
          Publicaciones
        </button>
      </div>

      <div className="profile-panel">
        {tab === "activity" ? (
          <div className="profile-mainGrid">
            <Card className="profile-calendarCard">
              <CardBody>
                <div className="profile-sectionHead">
                  <div>
                    <p className="profile-sectionEyebrow">Agenda</p>
                    <h3 className="m0">Calendario deportivo</h3>
                    <p className="profile-sectionSub m0">
                      Consulta próximas quedadas y mantén visible tu ritmo de actividad.
                    </p>
                  </div>

                  <div className="profile-inlineActions">
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
                      onClick={() =>
                        toast?.info?.("Añadir actividad próximamente")
                      }
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

            <Card className="profile-activity card">
              <CardBody>
                <div className="profile-sectionHead">
                  <div>
                    <p className="profile-sectionEyebrow">Actividad</p>
                    <h3 className="m0">Tus siguientes planes</h3>
                    <p className="profile-sectionSub m0">
                      Confirmados o pendientes, con acceso rápido al estado de tu agenda.
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
                    description="Únete a un grupo o explora quedadas para empezar a llenar tu agenda."
                  />
                ) : (
                  <div className="feed">
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
        ) : (
          <Card className="profile-postsCard">
            <CardBody>
              <div className="profile-sectionHead">
                <div>
                  <p className="profile-sectionEyebrow">Contenido</p>
                  <h3 className="m0">Tus publicaciones</h3>
                  <p className="profile-sectionSub m0">
                    Vista tipo grid para tus imágenes y publicaciones recientes.
                  </p>
                </div>
              </div>

              <PostsGrid posts={posts} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
