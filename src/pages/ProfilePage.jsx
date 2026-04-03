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

    if (ts >= now && (meetup.status === "open" || meetup.status === "full" || !meetup.status)) {
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
  const notesText = String(event?.notes || "").replace(/^\[[^\]]+\]\s*/, "").trim();
  const imageSrc = eventImageSrc(event);

  return (
    <article
      className={`discoverEventFlipCard${isFlipped ? " is-flipped" : ""}`}
    >
      <div className="discoverEventFlipCard__inner">
        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--front">
          <div className="discoverEventFlipCard__mediaWrap">
            {imageSrc ? (
              <button
                type="button"
                className="discoverEventFlipCard__mediaButton"
                onClick={() => setIsFlipped(true)}
                aria-label={`Ver detalles de ${event.meeting_point || "evento"}`}
              >
                <img
                  src={imageSrc}
                  alt={event.meeting_point || "Evento"}
                  className="discoverEventFlipCard__image"
                />
              </button>
            ) : (
              <button
                type="button"
                className="discoverEventFlipCard__mediaButton discoverEventFlipCard__mediaButton--placeholder"
                onClick={() => setIsFlipped(true)}
                aria-label={`Ver detalles de ${event.meeting_point || "evento"}`}
              >
                <span className="discoverEventFlipCard__placeholderTitle">
                  {event.meeting_point || "Evento"}
                </span>
              </button>
            )}
            <span
              className={`discoverTag discoverEventFlipCard__tag ${
                event?.visibility === "private" ? "" : "discoverTag--accent"
              }`}
            >
              {event?.visibility === "private" ? "Privado" : "Público"}
            </span>
          </div>

          <div className="discoverEventFlipCard__frontBody">
            <h3 className="discoverEventFlipCard__title">
              {event.meeting_point || "Evento"}
            </h3>

            <p className="discoverEventFlipCard__meta">
              {formatEventDateLabel(event.starts_at)} · {timeLabel(event.starts_at)}
            </p>
          </div>
        </div>

        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--back">
          <div className="discoverEventFlipCard__backHead">
            <h3 className="discoverEventFlipCard__title">
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
    <section className="sectionBlock profileMembersSection">
      <h2 className="activitySection__title">Miembros</h2>

      <div className="profileMembersList">
        {members.map((member) => (
          <Link
            key={member.id}
            to={`/perfil/${member.id}`}
            className="profileLinkItem"
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name || "Miembro"}
                  style={{ width: 40, height: 40, borderRadius: 14, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--border)",
                    fontWeight: 800,
                  }}
                >
                  {initialsFromName(member.name)}
                </div>
              )}

              <div style={{ minWidth: 0, display: "grid", gap: 2 }}>
                <span className="profileLinkItem__label">{member.name || "Miembro"}</span>
                <span className="profileLinkItem__value">
                  {formatHandle(member.handle || member.username)}
                </span>
              </div>
            </div>
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
    () => (meetups || []).filter((item) => item?.starts_at && isSameOrAfterToday(item.starts_at)),
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

        <div className={`discoverMonthControls${canCreate ? " discoverMonthControls--withCreate" : ""}`}>
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
              <div className="discoverSelectedDay__title">{formatSelectedDay(selectedDay)}</div>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="discoverEmptyText">No hay eventos este día</div>
          ) : (
            <div className={`discoverEventList discoverEventList--day${selectedEvents.length > 1 ? " discoverEventList--dayGrid" : ""}`}>
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
        const payload = profileId
          ? await apiPublicProfile(profileId, token)
          : await apiPublicProfileByHandle(handle, token);

        if (!cancelled) {
          setPublicProfile(payload || null);
          setPublicError("");
        }
      } catch (error) {
        if (!cancelled) {
          setPublicProfile(null);
          setPublicError(error?.message || "No se pudo cargar el perfil.");
        }
      } finally {
        if (!cancelled) setPublicLoading(false);
      }
    }

    loadPublicProfile();

    return () => {
      cancelled = true;
    };
  }, [handle, isPublicProfile, profileId, token]);

  const profileData = isPublicProfile ? publicProfile : me;
  const avatarUrl = profileData?.avatar_url;
  const displayName = profileData?.name || user?.email || "Perfil";
  const displayHandle = formatHandle(profileData?.handle || profileData?.username);
  const displayBio = formatBio(profileData?.bio);
  const displayLocation = formatLocation(profileData?.location);
  const followersCount = profileData?.followers_count ?? 0;
  const followingCount = profileData?.following_count ?? 0;
  const memberLinks = profileData?.links || {};
  const members = profileData?.members || [];
  const meetups = isPublicProfile ? publicProfile?.meetups || [] : myMeetups;

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !token || isPublicProfile) return;

    try {
      setUploadingAvatar(true);

      const publicUrl = await uploadAvatarToSupabase(file, me?.id || user?.id);
      await apiUpdateProfile({ avatar_url: publicUrl }, token);
      await refreshMe?.();

      toast?.success?.("Avatar actualizado.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo actualizar el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (isPublicProfile && publicLoading) {
    return (
      <section className="page page--eventsHome blablaRunPage profilePage">
        <section className="sectionBlock">
          <p className="discoverLoading">Cargando perfil…</p>
        </section>
      </section>
    );
  }

  if (isPublicProfile && publicError) {
    return (
      <section className="page page--eventsHome blablaRunPage profilePage">
        <section className="sectionBlock">
          <p className="discoverLoading">{publicError}</p>
        </section>
      </section>
    );
  }

  if (!profileData && !isPublicProfile && !meReady) {
    return (
      <section className="page page--eventsHome blablaRunPage profilePage">
        <section className="sectionBlock">
          <p className="discoverLoading">Cargando perfil…</p>
        </section>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="page page--eventsHome blablaRunPage profilePage">
        <section className="sectionBlock">
          <p className="discoverLoading">No se encontró el perfil.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="page page--eventsHome blablaRunPage profilePage">
      <section className="sectionBlock profileIdentityCard">
        <div
          className={`profileIdentityTop${!isPublicProfile ? " profileIdentityTop--editable" : ""}`}
          onClick={
            !isPublicProfile
              ? () => {
                  if (!uploadingAvatar) fileInputRef.current?.click();
                }
              : undefined
          }
          onKeyDown={
            !isPublicProfile
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!uploadingAvatar) fileInputRef.current?.click();
                  }
                }
              : undefined
          }
          role={!isPublicProfile ? "button" : undefined}
          tabIndex={!isPublicProfile ? 0 : undefined}
          aria-label={!isPublicProfile ? "Cambiar avatar" : undefined}
        >
          <div className="profileIdentityMain">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="profileHero__avatar"
              />
            ) : (
              <div className="profileHero__avatar profileHero__avatar--fallback">
                {initialsFromName(displayName)}
              </div>
            )}

            <div className="profileIdentityCopy">
              <div className="profileHero__nameRow">
                <h1 className="profileHero__name">{displayName}</h1>

                {!isPublicProfile ? (
                  <button
                    type="button"
                    className="profileInlineEditBtn"
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Editar perfil"
                    title="Editar perfil"
                  >
                    <IconEdit />
                  </button>
                ) : null}
              </div>

              <div className="profileHero__handle">{displayHandle}</div>
              <p className="profileHero__bio">{displayBio}</p>
              <div className="profileLocationText">{displayLocation}</div>
            </div>
          </div>

          {!isPublicProfile ? (
            <div className="profileUploadState">
              {uploadingAvatar ? "Subiendo avatar…" : "Pulsa para cambiar la imagen del perfil"}
            </div>
          ) : null}
        </div>

        {!isPublicProfile ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        ) : null}

        <div className="profileMiniSummary profileMiniSummary--duo">
          <Link to="/seguidores" className="profileStatButton">
            <span className="profileStatButton__label">Seguidores</span>
            <span className="profileStatButton__value">{followersCount}</span>
          </Link>

          <Link to="/siguiendo" className="profileStatButton">
            <span className="profileStatButton__label">Siguiendo</span>
            <span className="profileStatButton__value">{followingCount}</span>
          </Link>
        </div>
      </section>

      <ProfileAgenda
        meetups={meetups}
        canCreate={!isPublicProfile}
        onCreateEvent={(dayKey) => {
          navigate(`/crear-evento?day=${encodeURIComponent(dayKey)}`);
        }}
      />

      <MembersBlock members={members} />
      <LinksBlock links={memberLinks} />
    </section>
  );
}
