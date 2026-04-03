import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../styles/blablarun.css";
import "../styles/profile.css";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import {
  apiPublicProfile,
  apiPublicProfileByHandle,
  apiUpdateProfile,
} from "../services/api";
import { uploadAvatarToSupabase } from "../services/storage";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  timeLabel,
} from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

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

    if (
      ts >= now &&
      (meetup.status === "open" || meetup.status === "full" || !meetup.status)
    ) {
      future.push(meetup);
    } else {
      past.push(meetup);
    }
  }

  future.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  past.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

  return { future, past };
}

function groupByDay(meetups = []) {
  const map = new Map();

  for (const meetup of meetups) {
    if (!meetup?.starts_at) continue;
    const key = localDayKey(meetup.starts_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(meetup);
  }

  for (const [key, items] of map.entries()) {
    items.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    map.set(key, items);
  }

  return map;
}

function formatMonthYear(date) {
  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDay(dayKey) {
  if (!dayKey) return "";

  const date = new Date(`${dayKey}T12:00:00`);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
  const formatted = date.toLocaleDateString("es-ES");

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${formatted}`;
}

function isSameOrAfterToday(isoDate) {
  return new Date(isoDate).getTime() >= Date.now();
}

function formatEventDateLabel(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function eventImageSrc(event) {
  return (
    event?.image_url ||
    event?.poster_url ||
    event?.cover_url ||
    event?.photo_url ||
    event?.thumbnail_url ||
    event?.banner_url ||
    ""
  );
}

function creatorLabel(event) {
  return (
    event?.host_profile_name ||
    event?.creator_profile_name ||
    event?.group_name ||
    "Perfil"
  );
}

function CreatorLink({ event }) {
  const label = creatorLabel(event);

  if (!event?.creator_profile_id) {
    return <span>{label}</span>;
  }

  return <Link to={`/perfil/${event.creator_profile_id}`}>{label}</Link>;
}

function IconEdit({ size = 16 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16 }}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function DayEventCard({ event }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const notesText = String(event?.notes || "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  const imageSrc = eventImageSrc(event);

  return (
    <article className={`discoverEventFlipCard${isFlipped ? " is-flipped" : ""}`}>
      <div className="discoverEventFlipCard__inner">
        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--front">
          <div className="discoverEventFlipCard__mediaWrap">
            <button
              type="button"
              className={`discoverEventFlipCard__mediaButton${
                !imageSrc ? " discoverEventFlipCard__mediaButton--placeholder" : ""
              }`}
              onClick={() => setIsFlipped(true)}
              aria-label={`Ver detalles de ${event.meeting_point || "evento"}`}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={event.meeting_point || "Evento"}
                  className="discoverEventFlipCard__image"
                />
              ) : (
                <span className="discoverEventFlipCard__placeholderTitle">
                  {event.meeting_point || "Evento"}
                </span>
              )}
            </button>
          </div>

          <div className="discoverEventFlipCard__frontBody">
            <h3 className="discoverEventFlipCard__title">
              {event.meeting_point || "Evento"}
            </h3>
          </div>
        </div>

        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--back">
          <div className="discoverEventFlipCard__backHead">
            <h3 className="discoverEventFlipCard__title discoverEventFlipCard__title--back">
              {event.meeting_point || "Evento"}
            </h3>

            <button
              type="button"
              className="discoverEventFlipCard__close"
              onClick={() => setIsFlipped(false)}
              aria-label="Volver a la portada del evento"
            >
              ×
            </button>
          </div>

          <div className="discoverEventFlipCard__details">
            <p className="discoverEventFlipCard__detailLine">
              {formatEventDateLabel(event.starts_at)} · {timeLabel(event.starts_at)}
            </p>

            {event?.level_tag ? (
              <p className="discoverEventFlipCard__detailLine">
                Nivel: {event.level_tag}
              </p>
            ) : null}

            {typeof event?.participants_count === "number" ? (
              <p className="discoverEventFlipCard__detailLine">
                Inscritos: {event.participants_count}
              </p>
            ) : null}

            <p className="discoverEventFlipCard__detailText">
              {notesText || "Quedada preparada para salir a correr con la comunidad."}
            </p>
          </div>

          <div className="discoverEventFlipCard__footer">
            <span className="discoverEventFlipCard__host">
              <CreatorLink event={event} />
            </span>

            {event?.creator_profile_id ? (
              <Link
                to={`/perfil/${event.creator_profile_id}`}
                className="discoverInlineLink"
              >
                Ver perfil
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function LinksBlock({ links = {} }) {
  const entries = Object.entries(links || {}).filter(([, value]) => !!value);

  if (entries.length === 0) return null;

  return (
    <section className="sectionBlock profileLinksSection">
      <h2 className="activitySection__title">Enlaces</h2>

      <div className="profileLinksList">
        {entries.map(([key, value]) => (
          <a
            key={key}
            href={value}
            target="_blank"
            rel="noreferrer"
            className="profileLinkItem"
          >
            <span className="profileLinkItem__label">{key}</span>
            <span className="profileLinkItem__value">{value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function MembersBlock({ members = [] }) {
  if (!members.length) return null;

  return (
    <section className="sectionBlock activitySection">
      <h2 className="activitySection__title">Miembros</h2>

      <div className="compactList card profileMembersList">
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
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    objectFit: "cover",
                  }}
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

function ProfileAgenda({ meetups = [], canCreate = false, onCreateEvent }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const upcomingItems = useMemo(
    () =>
      (meetups || []).filter(
        (item) => item?.starts_at && isSameOrAfterToday(item.starts_at)
      ),
    [meetups]
  );

  const byDay = useMemo(() => groupByDay(upcomingItems), [upcomingItems]);
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthIndex = month.getMonth();
  const todayKey = localDayKey(new Date());

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(selectedDay) || [];
  }, [byDay, selectedDay]);

  function goPrevMonth() {
    setMonth((prev) => addMonths(prev, -1));
  }

  function goNextMonth() {
    setMonth((prev) => addMonths(prev, 1));
  }

  function handleOpenCreate() {
    onCreateEvent?.(selectedDay || todayKey);
  }

  return (
    <section className="sectionBlock discoverSection discoverSection--calendarOnly profileAgendaSection">
      <div className="discoverCalendarHeader">
        <div className="discoverCalendarHeader__copy"></div>

        <div
          className={`discoverMonthControls${
            canCreate ? " discoverMonthControls--withCreate" : ""
          }`}
        >
          <button
            type="button"
            className="discoverMonthBtn"
            onClick={goPrevMonth}
            aria-label="Mes anterior"
          >
            ←
          </button>

          <div className="discoverMonthLabel">{formatMonthYear(month)}</div>

          <button
            type="button"
            className="discoverMonthBtn"
            onClick={goNextMonth}
            aria-label="Mes siguiente"
          >
            →
          </button>

          {canCreate ? (
            <button
              type="button"
              className="discoverMonthBtn profileAgendaCreateBtn"
              onClick={handleOpenCreate}
              aria-label="Crear evento"
              title="Crear evento"
            >
              <IconPlus />
            </button>
          ) : null}
        </div>
      </div>

      <div className="discoverCalendarCard discoverCalendarCard--premium">
        <div className="discoverWeekdays">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="discoverWeekdays__item">
              {weekday}
            </div>
          ))}
        </div>

        <div className="discoverCalendarGrid discoverCalendarGrid--compact">
          {days.map((day) => {
            const inMonth = day.getMonth() === monthIndex;
            const key = localDayKey(day);
            const dayItems = byDay.get(key) || [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <button
                key={`${key}-${inMonth}`}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`discoverDayCell discoverDayCell--compact${
                  !inMonth ? " is-outside" : ""
                }${dayItems.length > 0 ? " has-events" : ""}${
                  isToday ? " is-today" : ""
                }${isSelected ? " is-selected" : ""}`}
              >
                <span className="discoverDayCell__date">{day.getDate()}</span>
                <span className="discoverDayCell__marker" />
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        <section className="discoverSelectedDay">
          <div className="discoverSelectedDay__head">
            <div>
              <div className="discoverSelectedDay__title">
                {formatSelectedDay(selectedDay)}
              </div>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="discoverEmptyText">No hay eventos este día</div>
          ) : (
            <div
              className={`discoverEventList discoverEventList--day${
                selectedEvents.length > 1 ? " discoverEventList--dayGrid" : ""
              }`}
            >
              {selectedEvents.map((event) => (
                <DayEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}

export default function ProfilePage() {
  const { profileId, handle } = useParams();
  const isPublicProfile = Boolean(profileId || handle);
  const navigate = useNavigate();

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

  const mySplit = useMemo(() => splitMeetupsByTime(myMeetups), [myMeetups]);

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

  const displayName = profileData.display_name;
  const avatarUrl = profileData.avatar_url;
  const agendaMeetups = isPublicProfile
    ? [...(profileData.future_meetups || []), ...(profileData.past_meetups || [])]
    : [...myMeetups];

  if (!meReady) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil</h3>
          <p className="stateCard__text">
            Estamos preparando la información del perfil.
          </p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicLoading) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil público</h3>
          <p className="stateCard__text">Espera un momento.</p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicError) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudo cargar el perfil</h3>
          <p className="stateCard__text">{publicError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page page--eventsHome blablaRunPage profilePage">
      <section className="sectionBlock profileHeroCard profileIdentityCard">
        <div
          className={`profileIdentityTop${
            !isPublicProfile ? " profileIdentityTop--editable" : ""
          }`}
          onClick={!isPublicProfile ? () => fileInputRef.current?.click() : undefined}
          onKeyDown={
            !isPublicProfile
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }
              : undefined
          }
          role={!isPublicProfile ? "button" : undefined}
          tabIndex={!isPublicProfile ? 0 : undefined}
          aria-label={!isPublicProfile ? "Cambiar foto de perfil" : undefined}
        >
          <div className="profileIdentityMain">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="profileHero__avatar" />
            ) : (
              <div className="profileHero__avatar profileHero__avatar--fallback">
                {initialsFromName(displayName)}
              </div>
            )}

            <div className="profileIdentityCopy">
              <div className="profileHero__nameRow">
                <h1 className="profileHero__name">{displayName}</h1>

                {!isPublicProfile ? (
                  <Link
                    to="/onboarding?mode=edit"
                    className="profileInlineEditBtn"
                    aria-label="Editar perfil"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <IconEdit size={15} />
                  </Link>
                ) : null}
              </div>

              <div className="profileHero__handle">
                {formatHandle(profileData.handle)}
              </div>
              <p className="profileHero__bio">{formatBio(profileData.bio)}</p>
              <span className="profileLocationText">
                {formatLocation(profileData.location)}
              </span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="profileMiniSummary profileMiniSummary--duo">
          <Link to="/perfil/seguidores" className="profileStatButton">
            <span className="profileStatButton__label">Seguidores</span>
            <strong className="profileStatButton__value">
              {profileData.followers_count}
            </strong>
          </Link>

          <Link to="/perfil/seguidos" className="profileStatButton">
            <span className="profileStatButton__label">Seguidos</span>
            <strong className="profileStatButton__value">
              {profileData.following_count}
            </strong>
          </Link>
        </div>

        {!isPublicProfile && uploadingAvatar ? (
          <div className="profileUploadState">Subiendo foto…</div>
        ) : null}
      </section>

      <MembersBlock members={profileData.members} />

      <ProfileAgenda
        meetups={agendaMeetups}
        canCreate={!isPublicProfile}
        onCreateEvent={(dayKey) => {
          navigate(`/crear-evento?day=${encodeURIComponent(dayKey)}`);
        }}
      />

      <LinksBlock links={profileData.links} />
    </section>
  );
}
