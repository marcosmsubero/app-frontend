import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import settingsIcon from "../assets/Ajustes.png";
import "../styles/blablarun.css";
import "../styles/profile.css";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import {
  apiCreateMyMeetup,
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

function daySummary(items = []) {
  if (!items.length) return "No hay eventos este día";
  if (items.length === 1) return "1 evento";
  return `${items.length} eventos`;
}

function defaultTimeForDay(dayKey) {
  const now = new Date();
  const selected = new Date(`${dayKey}T00:00:00`);
  const sameDay = localDayKey(now) === localDayKey(selected);

  if (sameDay) {
    const hour = Math.min(21, Math.max(6, now.getHours() + 1));
    return `${String(hour).padStart(2, "0")}:00`;
  }

  return "19:00";
}

function buildStartsAt(dayKey, timeValue) {
  const [year, month, day] = String(dayKey).split("-").map(Number);
  const [hours, minutes] = String(timeValue || "19:00").split(":").map(Number);
  const date = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );
  return date.toISOString();
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function creatorLabel(event) {
  return (
    event?.host_profile_name ||
    event?.creator_profile_name ||
    event?.group_name ||
    "Perfil"
  );
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

function ModalCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function DayEventCard({ event }) {
  const notesText = String(event?.notes || "").replace(/^\[[^\]]+\]\s*/, "").trim();

  return (
    <article className="discoverEventCard discoverEventCard--agenda">
      <div className="discoverEventCard__top">
        <div className="discoverEventCard__date">
          <span className="discoverEventCard__time">{formatEventDateLabel(event.starts_at)}</span>
        </div>

        <span
          className={`discoverTag ${
            event?.visibility === "private" ? "" : "discoverTag--accent"
          }`}
        >
          {event?.visibility === "private" ? "Privado" : "Público"}
        </span>
      </div>

      <div className="discoverEventCard__body">
        <div className="discoverEventCard__main">
          <h3 className="discoverEventCard__title">
            {event.meeting_point || event.title || "Evento"}
          </h3>

          <p className="discoverEventCard__metaLine">
            {timeLabel(event.starts_at)}
            {event?.level_tag ? ` · ${event.level_tag}` : ""}
            {typeof event?.participants_count === "number"
              ? ` · ${event.participants_count} inscritos`
              : ""}
          </p>

          {notesText ? (
            <p className="discoverEventCard__text">{notesText}</p>
          ) : (
            <p className="discoverEventCard__text">
              Quedada preparada para salir a correr con la comunidad.
            </p>
          )}
        </div>

        <div className="discoverEventCard__footerRow">
          <span className="discoverEventCard__hostInline">{creatorLabel(event)}</span>

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
    </article>
  );
}

function LinksBlock({ links = {} }) {
  const entries = Object.entries(links || {}).filter(([, value]) => !!value);

  if (entries.length === 0) return null;

  return (
    <section className="sectionBlock profileSectionStack profileSimpleLinks">
      <h2 className="profileBlockTitle">Enlaces</h2>

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
    <section className="sectionBlock profileSectionStack">
      <h2 className="profileBlockTitle">Miembros</h2>

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

function CreateEventModal({ open, dayKey, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    event_type: "entrenamiento",
    time: "19:00",
    meeting_point: "",
    notes: "",
    level_tag: "",
    pace_min: "",
    pace_max: "",
    capacity: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      event_type: "entrenamiento",
      time: defaultTimeForDay(dayKey),
      meeting_point: "",
      notes: "",
      level_tag: "",
      pace_min: "",
      pace_max: "",
      capacity: "",
    });
  }, [dayKey, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !dayKey) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.meeting_point.trim()) return;

    const notesParts = [];
    if (form.event_type) notesParts.push(`Tipo: ${form.event_type}`);
    if (form.notes.trim()) notesParts.push(form.notes.trim());

    await onSubmit?.({
      starts_at: buildStartsAt(dayKey, form.time),
      title: form.meeting_point.trim(),
      meeting_point: form.meeting_point.trim(),
      notes: notesParts.join("\n"),
      level_tag: form.level_tag || null,
      pace_min: numberOrNull(form.pace_min),
      pace_max: numberOrNull(form.pace_max),
      capacity: numberOrNull(form.capacity),
    });
  }

  return (
    <div className="ui-modalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="ui-modal calendarMini__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-calendar-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div>
            <p className="app-kicker">Crear evento</p>
            <h3 id="profile-calendar-create-title" className="ui-modal__title">
              Nueva actividad para {dayKey}
            </h3>
          </div>

          <button
            type="button"
            className="ui-iconBtn"
            onClick={() => onClose?.()}
            aria-label="Cerrar"
            title="Cerrar"
            disabled={saving}
          >
            <ModalCloseIcon />
          </button>
        </div>

        <div className="ui-modal__body">
          <form className="calendarMini__form" onSubmit={handleSubmit}>
            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="profile-calendar-event-type">
                  Tipo
                </label>
                <select
                  id="profile-calendar-event-type"
                  className="app-select"
                  value={form.event_type}
                  onChange={(event) => updateField("event_type", event.target.value)}
                  disabled={saving}
                >
                  <option value="entrenamiento">Entrenamiento</option>
                  <option value="rodaje">Rodaje</option>
                  <option value="serie">Series</option>
                  <option value="tirada_larga">Tirada larga</option>
                  <option value="carrera">Carrera</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div className="app-field calendarMini__fieldNarrow">
                <label className="app-label" htmlFor="profile-calendar-time">
                  Hora
                </label>
                <input
                  id="profile-calendar-time"
                  className="app-input"
                  type="time"
                  value={form.time}
                  onChange={(event) => updateField("time", event.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="profile-calendar-meeting-point">
                Punto de encuentro
              </label>
              <input
                id="profile-calendar-meeting-point"
                className="app-input"
                value={form.meeting_point}
                onChange={(event) => updateField("meeting_point", event.target.value)}
                placeholder="Ej. parque, pista, salida de carrera..."
                disabled={saving}
              />
            </div>

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="profile-calendar-level">
                  Nivel
                </label>
                <select
                  id="profile-calendar-level"
                  className="app-select"
                  value={form.level_tag}
                  onChange={(event) => updateField("level_tag", event.target.value)}
                  disabled={saving}
                >
                  <option value="">Sin especificar</option>
                  <option value="suave">Suave</option>
                  <option value="medio">Medio</option>
                  <option value="rapido">Rápido</option>
                </select>
              </div>

              <div className="app-field calendarMini__fieldNarrow">
                <label className="app-label" htmlFor="profile-calendar-capacity">
                  Aforo
                </label>
                <input
                  id="profile-calendar-capacity"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => updateField("capacity", event.target.value)}
                  placeholder="10"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="profile-calendar-pace-min">
                  Ritmo mín. (seg/km)
                </label>
                <input
                  id="profile-calendar-pace-min"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.pace_min}
                  onChange={(event) => updateField("pace_min", event.target.value)}
                  placeholder="300"
                  disabled={saving}
                />
              </div>

              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="profile-calendar-pace-max">
                  Ritmo máx. (seg/km)
                </label>
                <input
                  id="profile-calendar-pace-max"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.pace_max}
                  onChange={(event) => updateField("pace_max", event.target.value)}
                  placeholder="360"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="profile-calendar-notes">
                Notas
              </label>
              <textarea
                id="profile-calendar-notes"
                className="app-textarea"
                rows={4}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Detalles opcionales"
                disabled={saving}
              />
            </div>

            <div className="calendarMini__formActions">
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => onClose?.()}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="app-button app-button--primary"
                disabled={saving || !form.meeting_point.trim()}
              >
                {saving ? "Guardando…" : "Crear evento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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

  return (
    <section className="sectionBlock discoverSection discoverSection--calendarOnly profileAgendaSection">
      <div className="discoverCalendarHeader">
        <div className="discoverCalendarHeader__copy">
          <h2 className="discoverCalendarHeader__title">Calendario</h2>
        </div>

        <div className="discoverMonthControls">
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
              onClick={onCreateEvent}
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
              <div className="profileAgendaSummary">{daySummary(selectedEvents)}</div>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="discoverEmptyText">No hay eventos este día</div>
          ) : (
            <div className="discoverEventList discoverEventList--day">
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

  const { me, meReady, token, refreshMe, user } = useAuth();
  const { items: myMeetups = [] } = useMyMeetups();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [createdEvents, setCreatedEvents] = useState([]);

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

  async function handleCreateEvent(payload) {
    setSavingEvent(true);

    try {
      const created = await apiCreateMyMeetup(payload, token);

      const normalizedCreated = {
        id: created?.id ?? `tmp-${Date.now()}`,
        starts_at: created?.starts_at || payload.starts_at,
        meeting_point: created?.meeting_point || payload.meeting_point,
        notes: created?.notes || payload.notes,
        level_tag: created?.level_tag ?? payload.level_tag,
        pace_min: created?.pace_min ?? payload.pace_min,
        pace_max: created?.pace_max ?? payload.pace_max,
        capacity: created?.capacity ?? payload.capacity,
        group_id: created?.group_id ?? null,
        creator_profile_id: created?.creator_profile_id ?? null,
        creator_profile_type: created?.creator_profile_type ?? "individual",
        creator_profile_name:
          created?.creator_profile_name ||
          me?.display_name ||
          me?.full_name ||
          me?.handle ||
          me?.email ||
          "Mi perfil",
        creator_profile_handle: created?.creator_profile_handle ?? me?.handle ?? null,
        participants_count: created?.participants_count ?? 1,
        created_by: created?.created_by ?? me?.id ?? user?.id ?? null,
        is_joined: true,
        title: payload.title,
      };

      setCreatedEvents((prev) => [normalizedCreated, ...prev]);
      setShowCreateModal(false);
      toast?.success?.("Evento creado correctamente.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo crear el evento.");
    } finally {
      setSavingEvent(false);
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
    : [...myMeetups, ...createdEvents];

  if (!meReady) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil</h3>
          <p className="stateCard__text">Estamos preparando la información del perfil.</p>
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
    <section className="page profilePage">
      <section className="sectionBlock profileIdentityCard">
        <div
          className={`profileIdentityTop${!isPublicProfile ? " profileIdentityTop--editable" : ""}`}
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
          {!isPublicProfile ? (
            <Link
              to="/ajustes"
              className="profileSettingsShortcut"
              aria-label="Ir a ajustes"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={settingsIcon} alt="" className="profileSettingsShortcut__icon" />
            </Link>
          ) : null}

          <div className="profileIdentityMain">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="profileHero__avatar" />
            ) : (
              <div
                className="profileHero__avatar profileHero__avatar--fallback"
                style={{ display: "grid", placeItems: "center", fontWeight: 800 }}
              >
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

              <div className="profileHero__handle">{formatHandle(profileData.handle)}</div>
              <p className="profileHero__bio">{formatBio(profileData.bio)}</p>
              <span className="profileLocationText">{formatLocation(profileData.location)}</span>
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
          <article className="profileMiniSummary__card">
            <div className="profileMiniSummary__topline">
              <span className="profileMiniSummary__label">Seguidores</span>
              <Link to="/perfil/seguidores" className="profileMiniSummary__link">
                Ver lista
              </Link>
            </div>
            <strong className="profileMiniSummary__value">{profileData.followers_count}</strong>
          </article>

          <article className="profileMiniSummary__card">
            <div className="profileMiniSummary__topline">
              <span className="profileMiniSummary__label">Seguidos</span>
              <Link to="/perfil/seguidos" className="profileMiniSummary__link">
                Ver lista
              </Link>
            </div>
            <strong className="profileMiniSummary__value">{profileData.following_count}</strong>
          </article>
        </div>
      </section>

      <MembersBlock members={profileData.members} />

      <ProfileAgenda
        meetups={agendaMeetups}
        canCreate={!isPublicProfile}
        onCreateEvent={() => setShowCreateModal(true)}
      />

      <LinksBlock links={profileData.links} />

      {!isPublicProfile ? (
        <CreateEventModal
          open={showCreateModal}
          dayKey={localDayKey(new Date())}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          saving={savingEvent}
        />
      ) : null}
    </section>
  );
}
