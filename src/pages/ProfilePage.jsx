import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import UpcomingMeetups from "../components/UpcomingMeetups";
import PostsGrid from "../components/PostsGrid";

import { Badge, Button, Card, CardBody } from "../components/ui";

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
  return me?.bio || me?.description || "Comparte tu actividad y conecta con otros deportistas.";
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
    <div className="profileMinimal__statCard">
      <strong className="profileMinimal__statValue">{value}</strong>
      <span className="profileMinimal__statLabel">{label}</span>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="profileMinimal__statLink">
      {content}
    </Link>
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
    reload,
  } = useMyMeetups();

  const displayName = useMemo(() => getDisplayName(me), [me]);
  const handle = useMemo(() => getHandle(me), [me]);
  const bio = useMemo(() => getBio(me), [me]);
  const location = useMemo(() => getLocation(me), [me]);
  const disciplines = useMemo(() => normalizeDisciplines(me), [me]);
  const initials = useMemo(() => getInitials(me), [me]);
  const posts = useMemo(() => getPosts(me), [me]);

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
      next.set("tab", nextTab === "posts" ? "posts" : "calendar");
      return next;
    });
  }

  return (
    <div className="profileMinimal">
      <section className="profileMinimal__hero app-section">
        <div className="profileMinimal__identity">
          {me?.avatar_url ? (
            <img
              src={me.avatar_url}
              alt={displayName}
              className="profileMinimal__avatarImage"
            />
          ) : (
            <div className="profileMinimal__avatarFallback" aria-hidden="true">
              {initials}
            </div>
          )}

          <div className="profileMinimal__identityCopy">
            <div className="profileMinimal__head">
              <div>
                <span className="app-kicker">Perfil</span>
                <h1 className="profileMinimal__name">{displayName}</h1>
                <p className="profileMinimal__handle">{handle}</p>
              </div>

              <div className="profileMinimal__actions">
                <Button as={Link} to="/onboarding" variant="secondary" size="md">
                  Editar
                </Button>

                <Button type="button" variant="ghost" size="md" onClick={handleLogout}>
                  Salir
                </Button>
              </div>
            </div>

            <p className="profileMinimal__bio">{bio}</p>

            <div className="profileMinimal__meta">
              {location ? <Badge>{location}</Badge> : null}
              {disciplines.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="profileMinimal__stats">
          {stats.map((stat) => (
            <ProfileStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              to={stat.to}
            />
          ))}
        </div>
      </section>

      <section className="profileMinimal__tabs app-section">
        <button
          type="button"
          className={`profileMinimal__tab ${tab === "posts" ? "profileMinimal__tab--active" : ""}`}
          onClick={() => updateTab("posts")}
        >
          Publicaciones
        </button>

        <button
          type="button"
          className={`profileMinimal__tab ${tab === "calendar" ? "profileMinimal__tab--active" : ""}`}
          onClick={() => updateTab("calendar")}
        >
          Calendario
        </button>
      </section>

      {tab === "posts" ? (
        <Card>
          <CardBody>
            <div className="profileMinimal__sectionHead">
              <div>
                <p className="app-kicker">Contenido</p>
                <h2 className="app-title">Publicaciones</h2>
              </div>
            </div>

            <PostsGrid posts={posts} />
          </CardBody>
        </Card>
      ) : (
        <section className="profileMinimal__content">
          <Card>
            <CardBody>
              <div className="profileMinimal__sectionHead">
                <div>
                  <p className="app-kicker">Agenda</p>
                  <h2 className="app-title">Calendario</h2>
                </div>

                <div className="profileMinimal__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => reload()}
                    disabled={meetupsLoading}
                  >
                    {meetupsLoading ? "Actualizando..." : "Actualizar"}
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

          <UpcomingMeetups />
        </section>
      )}
    </div>
  );
}
