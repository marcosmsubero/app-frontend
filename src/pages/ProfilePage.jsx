import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";
import ProfileCard from "../components/ProfileCard";

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

function initialsFromNameOrEmail(me) {
  const name = (me?.full_name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase() || (me?.email?.[0] || "U").toUpperCase();
  }
  return (me?.email?.[0] || "U").toUpperCase();
}

export default function ProfilePage() {
  const { me, logout, token } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialTab = params.get("tab") === "posts" ? "posts" : "calendar";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const t = params.get("tab") === "posts" ? "posts" : "calendar";
    setTab(t);
  }, [params]);

  const {
    items: myMeetups,
    loading: meetupsLoading,
    error: meetupsError,
    reload,
  } = useMyMeetups();

  const initials = useMemo(() => initialsFromNameOrEmail(me), [me]);

  const sortedFeed = useMemo(() => {
    const arr = Array.isArray(myMeetups) ? [...myMeetups] : [];
    arr.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    return arr;
  }, [myMeetups]);

  const nextMeetupsCount = sortedFeed.length;

  function handleLogout() {
    logout();
    toast?.info?.("Sesión cerrada");
    nav("/", { replace: true });
  }

  function setTabAndUrl(next) {
    setTab(next);
    setParams((p) => {
      const np = new URLSearchParams(p);
      if (next === "posts") np.set("tab", "posts");
      else np.delete("tab");
      return np;
    });
  }

  return (
    <div className="ui-page profile-view ui-stack-lg">
      <SectionHeader
        eyebrow="Tu espacio"
        title="Perfil"
        description="Gestiona tu actividad, consulta tus publicaciones y revisa tus próximas quedadas."
        action={
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        }
      />

      <div className="profile-view__hero">
        <ProfileCard me={me} token={token} onLogout={handleLogout} />
      </div>

      <div className="profile-view__tabs ui-inline-wrap" role="tablist" aria-label="Secciones del perfil">
        <Chip
          active={tab === "calendar"}
          onClick={() => setTabAndUrl("calendar")}
          aria-pressed={tab === "calendar"}
        >
          Calendario
        </Chip>

        <Chip
          active={tab === "posts"}
          onClick={() => setTabAndUrl("posts")}
          aria-pressed={tab === "posts"}
        >
          Publicaciones
        </Chip>
      </div>

      <Card className="profile-view__panel">
        <CardHeader>
          <SectionHeader
            eyebrow="Contenido"
            title={tab === "calendar" ? "Calendario de actividad" : "Publicaciones"}
            description={
              tab === "calendar"
                ? "Consulta tus entrenamientos y quedadas programadas."
                : "Visualiza tu contenido publicado desde el perfil."
            }
          />
        </CardHeader>

        <CardBody>
          {tab === "calendar" ? (
            <MeetupCalendar
              meetups={myMeetups}
              me={me}
              onAdd={() => toast?.info?.("Añadir actividad (próximamente)")}
            />
          ) : (
            <PostsGrid />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            eyebrow="Resumen"
            title="Próximas actividades"
            description="Tus quedadas y entrenamientos programados, ordenados por fecha."
            action={
              <div className="profile-view__header-actions">
                <Badge variant={nextMeetupsCount > 0 ? "primary" : "neutral"}>
                  {nextMeetupsCount} {nextMeetupsCount === 1 ? "actividad" : "actividades"}
                </Badge>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={reload}
                  disabled={meetupsLoading}
                  aria-label={meetupsLoading ? "Cargando actividades" : "Actualizar actividades"}
                  title={meetupsLoading ? "Cargando…" : "Actualizar"}
                >
                  {meetupsLoading ? "Actualizando…" : "Actualizar"}
                </Button>
              </div>
            }
          />
        </CardHeader>

        <CardBody>
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
          ) : sortedFeed.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Aún no tienes actividades"
              description="Cuando te unas o crees quedadas, aparecerán aquí con su fecha y detalles."
              actionLabel="Ir al calendario"
              onAction={() => setTabAndUrl("calendar")}
            />
          ) : (
            <div className="profile-view__activity-list">
              {sortedFeed.map((m) => (
                <article key={m.id} className="profile-view__activity-item">
                  <div className="profile-view__activity-avatar">
                    <Avatar
                      size="sm"
                      name={me?.full_name || me?.email || "Usuario"}
                      alt={me?.full_name || me?.email || "Usuario"}
                    />
                  </div>

                  <div className="profile-view__activity-main">
                    <div className="profile-view__activity-top">
                      <h3 className="profile-view__activity-title">
                        {m.meeting_point || "Quedada"}
                      </h3>

                      <div className="profile-view__activity-badges">
                        {m.group_name ? <Badge variant="neutral">{m.group_name}</Badge> : null}
                        {m.level_tag ? <Badge variant="primary">{m.level_tag}</Badge> : null}
                      </div>
                    </div>

                    <p className="profile-view__activity-meta">
                      {timeLabel(m.starts_at)}
                    </p>
                  </div>

                  <div className="profile-view__activity-side">
                    <div className="profile-view__activity-count">
                      {m.participants_count ?? 0}
                    </div>
                    <div className="profile-view__activity-label">Inscritos</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
