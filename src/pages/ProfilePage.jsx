import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MeetupCalendar from "../components/MeetupCalendar";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import {
  apiPublicProfile,
  apiPublicProfileByHandle,
  apiUpdateProfile,
} from "../services/api";
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
  if (!handle) return "@sin-usuario";
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 18, height: 18 }}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function ActionLink({ to, children, primary = false }) {
  return (
    <Link
      to={to}
      className={`feedCard__action${primary ? " feedCard__action--primary" : ""}`}
    >
      {children}
    </Link>
  );
}

function EventList({ title, items = [] }) {
  return (
    <section className="sectionBlock">
      <div className="sectionHead">
        <div className="sectionHead__copy">
          <span className="sectionEyebrow">Calendario</span>
          <h2 className="sectionTitle">{title}</h2>
          <p className="sectionLead">
            {items.length === 0
              ? "No hay eventos en esta sección."
              : `${items.length} ${items.length === 1 ? "evento" : "eventos"}.`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="stateCard">
          <h3 className="stateCard__title">Sin eventos</h3>
          <p className="stateCard__text">
            Cuando haya actividad asociada al perfil, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="eventList">
          {items.map((item) => (
            <article key={item.id} className="eventCard">
              <div className="eventCard__head">
                <div className="eventCard__meta">
                  <div>
                    <h3 className="eventCard__title">
                      {item.meeting_point || "Evento"}
                    </h3>
                    <p className="eventCard__subtitle">
                      {new Date(item.starts_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>

                {item.status ? <span className="badge">{item.status}</span> : null}
              </div>

              <div className="eventCard__body">
                <div className="eventMetaGrid">
                  {item.level_tag ? (
                    <div className="eventMetaItem">
                      <div className="eventMetaItem__label">Nivel</div>
                      <div className="eventMetaItem__value">{item.level_tag}</div>
                    </div>
                  ) : null}

                  {typeof item.capacity === "number" && item.capacity > 0 ? (
                    <div className="eventMetaItem">
                      <div className="eventMetaItem__label">Aforo</div>
                      <div className="eventMetaItem__value">{item.capacity}</div>
                    </div>
                  ) : null}
                </div>

                {item.notes ? (
                  <p className="eventCard__text">{item.notes}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LinksBlock({ links = {} }) {
  const entries = Object.entries(links || {}).filter(([, value]) => !!value);

  return (
    <section className="sectionBlock">
      <div className="sectionHead">
        <div className="sectionHead__copy">
          <span className="sectionEyebrow">Presencia</span>
          <h2 className="sectionTitle">Enlaces</h2>
          <p className="sectionLead">Perfiles y referencias externas.</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="stateCard">
          <h3 className="stateCard__title">Sin enlaces</h3>
          <p className="stateCard__text">
            Este perfil no ha añadido enlaces todavía.
          </p>
        </div>
      ) : (
        <div className="compactList card">
          {entries.map(([key, value]) => (
            <a
              key={key}
              href={value}
              target="_blank"
              rel="noreferrer"
              className="compactListItem"
            >
              <div className="compactListItem__copy">
                <h3 className="compactListItem__title">{key}</h3>
                <p className="compactListItem__text">{value}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function MembersBlock({ members = [] }) {
  if (!members.length) return null;

  return (
    <section className="sectionBlock">
      <div className="sectionHead">
        <div className="sectionHead__copy">
          <span className="sectionEyebrow">Perfil grupal</span>
          <h2 className="sectionTitle">Miembros</h2>
          <p className="sectionLead">Usuarios vinculados a este grupo.</p>
        </div>
      </div>

      <div className="compactList card">
        {members.map((member) => (
          <Link
            key={`${member.user_id}-${member.profile_id || "na"}`}
            to={member.profile_id ? `/perfil/${member.profile_id}` : "/perfil"}
            className="compactListItem"
          >
            <div className="compactListItem__icon">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name || member.handle || "Miembro"}
                  style={{ width: 40, height: 40, borderRadius: 14, objectFit: "cover" }}
                />
              ) : (
                <span>{initialsFromName(member.full_name || member.handle || "U")}</span>
              )}
            </div>

            <div className="compactListItem__copy">
              <h3 className="compactListItem__title">
                {member.full_name || member.handle || "Miembro"}
              </h3>
              <p className="compactListItem__text">{formatHandle(member.handle)}</p>
            </div>

            <div className="compactListItem__aside">{member.role}</div>
          </Link>
        ))}
      </div>
    </section>
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
      <section className="page">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil</h3>
          <p className="stateCard__text">Estamos preparando la información del perfil.</p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicLoading) {
    return (
      <section className="page">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil público</h3>
          <p className="stateCard__text">Espera un momento.</p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicError) {
    return (
      <section className="page">
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudo cargar el perfil</h3>
          <p className="stateCard__text">{publicError}</p>
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

  const calendarMeetups = useMemo(
    () => [...(profileData.future_meetups || []), ...(profileData.past_meetups || [])],
    [profileData.future_meetups, profileData.past_meetups]
  );

  const displayName = profileData.display_name;
  const avatarUrl = profileData.avatar_url;

  return (
    <section className="page">
      <section className="heroPanel">
        <div className="profileHero">
          <div className="profileHero__top">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="profileHero__avatar"
              />
            ) : (
              <div
                className="profileHero__avatar"
                style={{ display: "grid", placeItems: "center", fontWeight: 800 }}
              >
                {initialsFromName(displayName)}
              </div>
            )}

            <div className="profileHero__identity">
              <h1 className="profileHero__name">{displayName}</h1>
              <div className="profileHero__handle">{formatHandle(profileData.handle)}</div>
              <p className="profileHero__bio">{formatBio(profileData.bio)}</p>
            </div>
          </div>

          <div className="profileHero__chips">
            <span className="badge">
              {profileData.profile_type === "group" ? "Perfil grupal" : "Perfil individual"}
            </span>
            <span className="badge">{formatLocation(profileData.location)}</span>
          </div>

          <div className="profileStats">
            <Link to="/perfil/seguidores" className="profileStats__item">
              <div className="profileStats__value">{profileData.followers_count}</div>
              <div className="profileStats__label">Seguidores</div>
            </Link>

            <Link to="/perfil/seguidos" className="profileStats__item">
              <div className="profileStats__value">{profileData.following_count}</div>
              <div className="profileStats__label">Seguidos</div>
            </Link>

            <div className="profileStats__item">
              <div className="profileStats__value">
                {(profileData.future_meetups?.length || 0) + (profileData.past_meetups?.length || 0)}
              </div>
              <div className="profileStats__label">Eventos</div>
            </div>
          </div>

          <div className="feedCard__actions">
            {!isPublicProfile ? (
              <>
                <ActionLink to="/onboarding?mode=edit" primary>
                  Editar perfil
                </ActionLink>

                <ActionLink to="/ajustes">Ajustes</ActionLink>

                <button
                  type="button"
                  className="feedCard__action"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <span style={{ display: "inline-flex" }}>
                    <IconEdit />
                  </span>
                  <span>{uploadingAvatar ? "Subiendo..." : "Cambiar foto"}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </>
            ) : (
              <ActionLink to="/mensajes" primary>
                Enviar mensaje
              </ActionLink>
            )}
          </div>
        </div>
      </section>

      <MembersBlock members={profileData.members} />

      <section className="sectionBlock">
        <div className="sectionHead">
          <div className="sectionHead__copy">
            <span className="sectionEyebrow">Agenda</span>
            <h2 className="sectionTitle">Calendario</h2>
            <p className="sectionLead">
              Vista compacta de eventos futuros y pasados.
            </p>
          </div>
        </div>

        <div className="card">
          <MeetupCalendar meetups={calendarMeetups} me={me} />
        </div>
      </section>

      <EventList title="Próximos eventos" items={profileData.future_meetups} />
      <EventList title="Eventos pasados" items={profileData.past_meetups} />
      <LinksBlock links={profileData.links} />
    </section>
  );
}
