import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MeetupCalendar from "../components/MeetupCalendar";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import { apiPublicProfile, apiPublicProfileByHandle, apiUpdateProfile } from "../services/api";
import { uploadAvatarToSupabase } from "../services/storage";

function initialsFromName(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

function formatHandle(handle) {
  if (!handle) return "Sin usuario";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function formatLocation(location) {
  return location || "Ubicación no indicada";
}

function formatBio(bio) {
  return bio || "Todavía no hay biografía disponible.";
}

function splitMeetupsByTime(meetups = []) {
  const now = Date.now();
  const future = [];
  const past = [];

  for (const meetup of meetups) {
    const ts = new Date(meetup.starts_at).getTime();
    if (Number.isNaN(ts)) continue;

    if (ts >= now && (meetup.status === "open" || meetup.status === "full")) {
      future.push(meetup);
    } else {
      past.push(meetup);
    }
  }

  future.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  past.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

  return { future, past };
}

function MeetupList({ title, items = [] }) {
  return (
    <article className="app-section" style={{ width: "100%" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ margin: "6px 0 0", color: "var(--app-text-muted)" }}>
            {items.length} {items.length === 1 ? "evento" : "eventos"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="app-empty">
            <div className="notificationsSimple__emptyBody">
              <strong>Sin eventos</strong>
              <p>No hay información para mostrar en esta sección.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => (
              <article key={item.id} className="app-card">
                <div className="app-card__body" style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{item.meeting_point || "Evento"}</strong>
                    <span className="app-chip app-chip--soft">
                      {new Date(item.starts_at).toLocaleString("es-ES")}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      color: "var(--app-text-muted)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {item.level_tag ? <span>Nivel: {item.level_tag}</span> : null}
                    {typeof item.capacity === "number" && item.capacity > 0 ? (
                      <span>• Aforo: {item.capacity}</span>
                    ) : null}
                    {item.status ? <span>• Estado: {item.status}</span> : null}
                  </div>

                  {item.notes ? (
                    <p style={{ margin: 0, color: "var(--app-text-muted)" }}>{item.notes}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function LinksBlock({ links = {} }) {
  const entries = Object.entries(links || {}).filter(([, value]) => !!value);

  return (
    <article className="app-section" style={{ width: "100%" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: 0 }}>Enlaces</h3>
          <p style={{ margin: "6px 0 0", color: "var(--app-text-muted)" }}>
            Presencia externa del perfil.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="app-empty">
            <div className="notificationsSimple__emptyBody">
              <strong>Sin enlaces</strong>
              <p>Este perfil no ha añadido enlaces todavía.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {entries.map(([key, value]) => (
              <a
                key={key}
                href={value}
                target="_blank"
                rel="noreferrer"
                className="app-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="app-card__body" style={{ display: "grid", gap: 4 }}>
                  <strong>{key}</strong>
                  <span style={{ color: "var(--app-text-muted)", wordBreak: "break-all" }}>
                    {value}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function MembersBlock({ members = [] }) {
  if (!members.length) return null;

  return (
    <article className="app-section" style={{ width: "100%" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: 0 }}>Miembros</h3>
          <p style={{ margin: "6px 0 0", color: "var(--app-text-muted)" }}>
            Usuarios vinculados a este perfil grupal.
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {members.map((member) => (
            <Link
              key={`${member.user_id}-${member.profile_id || "na"}`}
              to={member.profile_id ? `/perfil/${member.profile_id}` : "/perfil"}
              className="app-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="app-card__body"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || member.handle || "Miembro"}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "999px",
                        objectFit: "cover",
                        border: "1px solid var(--app-border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "999px",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid var(--app-border)",
                        background: "var(--app-surface-muted)",
                        fontWeight: 700,
                      }}
                    >
                      {initialsFromName(member.full_name || member.handle || "U")}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 2 }}>
                    <strong>{member.full_name || member.handle || "Miembro"}</strong>
                    <span style={{ color: "var(--app-text-muted)" }}>
                      {formatHandle(member.handle)}
                    </span>
                  </div>
                </div>

                <span className="app-chip app-chip--soft">{member.role}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

function StatCard({ value, label }) {
  return (
    <article className="profilePage__statCard">
      <strong className="profilePage__statValue">{value}</strong>
      <span className="profilePage__statLabel">{label}</span>
    </article>
  );
}

function ActionLink({ to, children, variant = "secondary" }) {
  return (
    <Link to={to} className={`app-button app-button--${variant}`}>
      {children}
    </Link>
  );
}

export default function ProfilePage() {
  const { profileId, handle } = useParams();
  const isPublicProfile = Boolean(profileId || handle);

  const { me, meReady, token, refreshMe, user } = useAuth();
  const { items: myMeetups = [] } = useMyMeetups();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPublicProfile() {
      if (!isPublicProfile) {
        setPublicProfile(null);
        setPublicError("");
        setPublicLoading(false);
        return;
      }

      if (!token) return;

      setPublicLoading(true);
      setPublicError("");

      try {
        const data = profileId
          ? await apiPublicProfile(profileId, token)
          : await apiPublicProfileByHandle(handle, token);

        if (!cancelled) {
          setPublicProfile(data);
        }
      } catch (error) {
        if (!cancelled) {
          setPublicProfile(null);
          setPublicError(error?.message || "No se pudo cargar el perfil.");
        }
      } finally {
        if (!cancelled) {
          setPublicLoading(false);
        }
      }
    }

    loadPublicProfile();

    return () => {
      cancelled = true;
    };
  }, [handle, isPublicProfile, profileId, token]);

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const ownerId = user?.id || me?.supabase_user_id || null;

    if (!ownerId) {
      toast?.error?.("No se pudo identificar al usuario.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const { publicUrl } = await uploadAvatarToSupabase(file, ownerId);
      await apiUpdateProfile({ avatar_url: publicUrl }, token);
      await refreshMe(token);
      toast?.success?.("Foto de perfil actualizada.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo actualizar la foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (!meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando perfil…</div>
        </div>
      </div>
    );
  }

  if (isPublicProfile && publicLoading) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando perfil público…</div>
        </div>
      </div>
    );
  }

  if (isPublicProfile && publicError) {
    return (
      <section className="page">
        <div className="app-empty">
          <div className="notificationsSimple__emptyBody">
            <strong>No se pudo cargar el perfil</strong>
            <p>{publicError}</p>
          </div>
        </div>
      </section>
    );
  }

  const mySplit = splitMeetupsByTime(myMeetups);

  const profileData = isPublicProfile
    ? {
        display_name: publicProfile?.display_name || "Perfil",
        handle: publicProfile?.handle || "",
        bio: publicProfile?.bio || "",
        location: publicProfile?.location || "",
        avatar_url: publicProfile?.avatar_url || "",
        followers_count: Number(publicProfile?.followers_count ?? 0),
        following_count: Number(publicProfile?.following_count ?? 0),
        links: publicProfile?.links || {},
        profile_type: publicProfile?.profile_type || "individual",
        members: publicProfile?.members || [],
        future_meetups: publicProfile?.future_meetups || [],
        past_meetups: publicProfile?.past_meetups || [],
      }
    : {
        display_name: me?.display_name || me?.full_name || me?.handle || "Tu perfil",
        handle: me?.handle || "",
        bio: me?.bio || "",
        location: me?.location || "",
        avatar_url: me?.avatar_url || "",
        followers_count: Number(me?.followers_count ?? 0),
        following_count: Number(me?.following_count ?? 0),
        links: me?.links || {},
        profile_type: me?.profile_type || "individual",
        members: me?.members || [],
        future_meetups: mySplit.future,
        past_meetups: mySplit.past,
      };

  const calendarMeetups = useMemo(() => {
    return [...(profileData.future_meetups || []), ...(profileData.past_meetups || [])];
  }, [profileData.future_meetups, profileData.past_meetups]);

  const displayName = profileData.display_name;
  const avatarUrl = profileData.avatar_url;

  return (
    <section className="profilePage" style={{ width: "100%", display: "grid", gap: 18 }}>
      <article className="app-section profilePage__hero">
        <div className="profilePage__heroTop">
          <div className="profilePage__identity">
            <div style={{ position: "relative", width: 104, height: 104 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="profilePage__avatarImage" />
              ) : (
                <div className="profilePage__avatarFallback">
                  {initialsFromName(displayName)}
                </div>
              )}

              {!isPublicProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Cambiar foto de perfil"
                    aria-label="Cambiar foto de perfil"
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      border: "1px solid var(--app-border)",
                      background: "#fff",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "var(--shadow-sm)",
                      color: "var(--app-text)",
                      cursor: uploadingAvatar ? "default" : "pointer",
                    }}
                  >
                    ✎
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                </>
              ) : null}
            </div>

            <div className="profilePage__identityCopy">
              <div className="profilePage__identityHead">
                <div className="profilePage__nameBlock">
                  <h1 className="profilePage__name">{displayName}</h1>
                  <p className="profilePage__handle">{formatHandle(profileData.handle)}</p>
                </div>

                <div className="profilePage__metaInline">
                  <span className="app-chip app-chip--soft">
                    {profileData.profile_type === "group" ? "Perfil grupal" : "Perfil individual"}
                  </span>
                  <span className="app-chip app-chip--soft">
                    {formatLocation(profileData.location)}
                  </span>
                </div>
              </div>

              <p className="profilePage__bio">{formatBio(profileData.bio)}</p>

              <div
                className="profilePage__actions"
                style={{ justifyContent: "flex-start", alignItems: "center", gap: 8 }}
              >
                {!isPublicProfile ? (
                  <>
                    <ActionLink to="/ajustes">Ajustes</ActionLink>
                    <ActionLink to="/onboarding?mode=edit">Editar perfil</ActionLink>
                  </>
                ) : (
                  <ActionLink to="/mensajes">Enviar mensaje</ActionLink>
                )}
              </div>
            </div>
          </div>

          <div
            className="profilePage__stats"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <StatCard value={profileData.followers_count} label="Seguidores" />
            <StatCard value={profileData.following_count} label="Seguidos" />
          </div>
        </div>
      </article>

      <MembersBlock members={profileData.members} />

      <article className="app-section profilePage__calendarCard" style={{ width: "100%" }}>
        <MeetupCalendar meetups={calendarMeetups} me={me} />
      </article>

      <MeetupList title="Eventos futuros" items={profileData.future_meetups} />
      <MeetupList title="Eventos pasados" items={profileData.past_meetups} />
      <LinksBlock links={profileData.links} />
    </section>
  );
}
