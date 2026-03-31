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

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function SectionIntro({ title, subtitle }) {
  return (
    <div className="profilePage__sectionIntro">
      <h3 className="profilePage__sectionTitle">{title}</h3>
      <p className="profilePage__sectionSubtitle">{subtitle}</p>
    </div>
  );
}

function MeetupList({ title, items = [] }) {
  return (
    <article className="app-section profilePage__panel">
      <div className="profilePage__panelBody">
        <SectionIntro
          title={title}
          subtitle={`${items.length} ${items.length === 1 ? "evento" : "eventos"}`}
        />

        {items.length === 0 ? (
          <div className="app-empty profilePage__emptyState">
            <div className="notificationsSimple__emptyBody">
              <strong>Sin eventos</strong>
              <p>No hay información para mostrar en esta sección.</p>
            </div>
          </div>
        ) : (
          <div className="profilePage__list">
            {items.map((item) => (
              <article key={item.id} className="app-card profilePage__listCard">
                <div className="profilePage__listCardBody">
                  <div className="profilePage__listCardTop">
                    <strong>{item.meeting_point || "Evento"}</strong>
                    <span className="app-badge">{new Date(item.starts_at).toLocaleString("es-ES")}</span>
                  </div>

                  <div className="profilePage__metaRow">
                    {item.level_tag ? <span>Nivel: {item.level_tag}</span> : null}
                    {typeof item.capacity === "number" && item.capacity > 0 ? (
                      <span>Aforo: {item.capacity}</span>
                    ) : null}
                    {item.status ? <span>Estado: {item.status}</span> : null}
                  </div>

                  {item.notes ? <p className="profilePage__listNote">{item.notes}</p> : null}
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
    <article className="app-section profilePage__panel">
      <div className="profilePage__panelBody">
        <SectionIntro title="Enlaces" subtitle="Presencia externa del perfil." />

        {entries.length === 0 ? (
          <div className="app-empty profilePage__emptyState">
            <div className="notificationsSimple__emptyBody">
              <strong>Sin enlaces</strong>
              <p>Este perfil no ha añadido enlaces todavía.</p>
            </div>
          </div>
        ) : (
          <div className="profilePage__list">
            {entries.map(([key, value]) => (
              <a
                key={key}
                href={value}
                target="_blank"
                rel="noreferrer"
                className="app-card app-card--interactive profilePage__linkCard"
              >
                <div className="profilePage__linkCardBody">
                  <strong>{key}</strong>
                  <span className="profilePage__linkValue">{value}</span>
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
    <article className="app-section profilePage__panel">
      <div className="profilePage__panelBody">
        <SectionIntro
          title="Miembros"
          subtitle="Usuarios vinculados a este perfil grupal."
        />

        <div className="profilePage__list">
          {members.map((member) => (
            <Link
              key={`${member.user_id}-${member.profile_id || "na"}`}
              to={member.profile_id ? `/perfil/${member.profile_id}` : "/perfil"}
              className="app-card app-card--interactive profilePage__memberCard"
            >
              <div className="profilePage__memberRow">
                <div className="profilePage__memberIdentity">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || member.handle || "Miembro"}
                      className="profilePage__memberAvatar"
                    />
                  ) : (
                    <div className="profilePage__memberAvatar profilePage__memberAvatar--fallback">
                      {initialsFromName(member.full_name || member.handle || "U")}
                    </div>
                  )}

                  <div className="profilePage__memberCopy">
                    <strong>{member.full_name || member.handle || "Miembro"}</strong>
                    <span>{formatHandle(member.handle)}</span>
                  </div>
                </div>

                <span className="app-badge">{member.role}</span>
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
        members: [],
        future_meetups: mySplit.future,
        past_meetups: mySplit.past,
      };

  const calendarMeetups = useMemo(() => {
    return [...(profileData.future_meetups || []), ...(profileData.past_meetups || [])];
  }, [profileData.future_meetups, profileData.past_meetups]);

  const displayName = profileData.display_name;
  const avatarUrl = profileData.avatar_url;

  return (
    <section className="profilePage">
      <article className="app-section profilePage__hero">
        <div className="profilePage__heroTop">
          <div className="profilePage__identity">
            <div className="profilePage__avatarShell">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="profilePage__avatarImage" />
              ) : (
                <div className="profilePage__avatarFallback">{initialsFromName(displayName)}</div>
              )}

              {!isPublicProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Cambiar foto de perfil"
                    aria-label="Cambiar foto de perfil"
                    className="profilePage__avatarEdit"
                  >
                    <IconEdit />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="profilePage__fileInput"
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
                  <span className="app-badge">
                    {profileData.profile_type === "group" ? "Perfil grupal" : "Perfil individual"}
                  </span>
                  <span className="app-badge">{formatLocation(profileData.location)}</span>
                </div>
              </div>

              <p className="profilePage__bio">{formatBio(profileData.bio)}</p>

              <div className="profilePage__actions">
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

          <div className="profilePage__stats">
            <StatCard value={profileData.followers_count} label="Seguidores" />
            <StatCard value={profileData.following_count} label="Seguidos" />
          </div>
        </div>
      </article>

      <MembersBlock members={profileData.members} />

      <article className="app-section profilePage__calendarCard">
        <MeetupCalendar meetups={calendarMeetups} me={me} />
      </article>

      <MeetupList title="Eventos futuros" items={profileData.future_meetups} />
      <MeetupList title="Eventos pasados" items={profileData.past_meetups} />
      <LinksBlock links={profileData.links} />
    </section>
  );
}
