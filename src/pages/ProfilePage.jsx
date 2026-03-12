import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMyMeetups } from "../hooks/useMyMeetups";

import MeetupCalendar from "../components/MeetupCalendar";
import PostsGrid from "../components/PostsGrid";
import ProfileCard from "../components/ProfileCard";

import { timeLabel } from "../utils/dates";

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
    <div className="profile-pageShell">
      <ProfileCard me={me} token={token} onLogout={handleLogout} />

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tabBtn ${tab === "calendar" ? "active" : ""}`}
          onClick={() => setTabAndUrl("calendar")}
        >
          Calendario
        </button>
        <button
          type="button"
          className={`profile-tabBtn ${tab === "posts" ? "active" : ""}`}
          onClick={() => setTabAndUrl("posts")}
        >
          Publicaciones
        </button>
      </div>

      <div className="profile-panel">
        {tab === "calendar" ? (
          <MeetupCalendar
            meetups={myMeetups}
            me={me}
            onAdd={() => toast?.info?.("Añadir actividad (próximamente)")}
          />
        ) : (
          <PostsGrid />
        )}
      </div>

      <div className="profile-activity card">
        <div className="profile-sectionHead">
          <div>
            <h3 className="m0">Actividades</h3>
            <p className="profile-sectionSub m0">Tus quedadas y entrenamientos programados.</p>
          </div>

          <button
            type="button"
            className={`link-btn reload-btn ${meetupsLoading ? "loading" : ""}`}
            onClick={reload}
            disabled={meetupsLoading}
            aria-label={meetupsLoading ? "Cargando actividades" : "Actualizar actividades"}
            title={meetupsLoading ? "Cargando…" : "Actualizar"}
          >
            {meetupsLoading ? "⏳" : "↻"}
          </button>
        </div>

        {meetupsError && <div className="auth-msg error">{meetupsError}</div>}

        {!meetupsLoading && sortedFeed.length === 0 ? (
          <p className="profile-emptyText m0">Aún no tienes actividades.</p>
        ) : (
          <div className="feed">
            {sortedFeed.map((m) => (
              <div key={m.id} className="feed-item">
                <div className="feed-ava">{initials}</div>

                <div className="feed-mid">
                  <div className="feed-title">{m.meeting_point || "Quedada"}</div>
                  <div className="feed-meta">
                    {timeLabel(m.starts_at)}
                    {m.group_name ? ` · ${m.group_name}` : ""}
                    {m.level_tag ? ` · ${m.level_tag}` : ""}
                  </div>
                </div>

                <div className="feed-right">
                  <div className="feed-n">{m.participants_count ?? 0}</div>
                  <div className="feed-l">Inscritos</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}