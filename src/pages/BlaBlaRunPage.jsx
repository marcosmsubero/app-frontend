import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiCreateMyMeetup } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import { useToast } from "../hooks/useToast";
import { Button, EmptyState } from "../components/ui";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  monthLabel,
  timeLabel,
} from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const DEFAULT_FILTERS = {
  only_open: true,
  limit: 60,
  offset: 0,
};

const DISCOVERY_FILTERS = [
  { id: "all", label: "Todo" },
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "mine", label: "Creados por mí" },
  { id: "joined", label: "Me apunto" },
];

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

function mergeMeetups(remoteItems = [], localItems = []) {
  const seen = new Map();

  [...localItems, ...remoteItems].forEach((item) => {
    if (!item?.id) return;
    seen.set(String(item.id), item);
  });

  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at),
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

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function defaultTimeForDay(dayKey) {
  const now = new Date();
  const selected = dayKey ? new Date(`${dayKey}T00:00:00`) : now;
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

function normalizeCreatedMeetup(created, me) {
  return {
    ...created,
    host_profile_id: created?.host_profile_id ?? created?.creator_profile_id ?? null,
    host_profile_type:
      created?.host_profile_type ?? created?.creator_profile_type ?? "individual",
    host_profile_name:
      created?.host_profile_name ||
      created?.creator_profile_name ||
      me?.full_name ||
      me?.handle ||
      me?.email ||
      "Tú",
    host_profile_handle:
      created?.host_profile_handle ?? created?.creator_profile_handle ?? null,
    host_profile_avatar_url:
      created?.host_profile_avatar_url ??
      created?.creator_profile_avatar_url ??
      me?.avatar_url ??
      null,
    creator_profile_name:
      created?.creator_profile_name ||
      me?.full_name ||
      me?.handle ||
      me?.email ||
      "Tú",
    creator_profile_handle: created?.creator_profile_handle ?? me?.handle ?? null,
    creator_profile_avatar_url:
      created?.creator_profile_avatar_url ?? me?.avatar_url ?? null,
    participants_count:
      typeof created?.participants_count === "number" ? created.participants_count : 1,
    is_joined: true,
    visibility: created?.visibility || "public",
  };
}

function buildNotes(eventType, notes) {
  const safeType = String(eventType || "").trim();
  const safeNotes = String(notes || "").trim();

  if (safeType && safeNotes) return `[${safeType}] ${safeNotes}`;
  if (safeType) return `[${safeType}]`;
  return safeNotes || null;
}

function formatDayTitle(dayKey) {
  if (!dayKey) return "Selecciona un día";

  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daySummary(items = []) {
  if (!items.length) return "No hay eventos este día";
  if (items.length === 1) return "1 evento";
  return `${items.length} eventos`;
}

function isSameOrAfterToday(isoDate) {
  return new Date(isoDate).getTime() >= Date.now();
}

function isWithinNextWeek(isoDate) {
  const now = new Date();
  const inSevenDays = new Date();
  inSevenDays.setDate(now.getDate() + 7);

  const value = new Date(isoDate).getTime();
  return value >= now.getTime() && value <= inSevenDays.getTime();
}

function matchesDiscoveryFilter(event, filterId, me) {
  if (!event?.starts_at) return false;

  const myIds = new Set(
    [me?.id, me?.app_profile_id].filter(
      (value) => value !== null && value !== undefined && value !== "",
    ).map(String),
  );

  const creatorId = event?.creator_profile_id ?? event?.host_profile_id ?? event?.created_by;

  switch (filterId) {
    case "today":
      return localDayKey(event.starts_at) === localDayKey(new Date());

    case "week":
      return isWithinNextWeek(event.starts_at);

    case "mine":
      return creatorId !== null && creatorId !== undefined && myIds.has(String(creatorId));

    case "joined":
      return Boolean(event?.is_joined);

    case "all":
    default:
      return isSameOrAfterToday(event.starts_at);
  }
}

function EventCard({ event }) {
  const notesText = String(event?.notes || "").replace(/^\[[^\]]+\]\s*/, "").trim();

  return (
    <article className="discoverEventCard">
      <div className="discoverEventCard__top">
        <div className="discoverEventCard__date">
          <span className="discoverEventCard__time">{timeLabel(event.starts_at)}</span>
          <span className="discoverEventCard__host">
            <CreatorLink event={event} />
          </span>
        </div>

        <span className={`discoverTag ${event.visibility === "private" ? "" : "discoverTag--accent"}`}>
          {event.visibility === "private" ? "Privado" : "Público"}
        </span>
      </div>

      <div className="discoverEventCard__body">
        <div className="discoverEventCard__main">
          <h3 className="discoverEventCard__title">
            {event.meeting_point || "Evento"}
          </h3>

          {notesText ? (
            <p className="discoverEventCard__text">{notesText}</p>
          ) : (
            <p className="discoverEventCard__text">
              Quedada preparada para salir a correr con la comunidad.
            </p>
          )}
        </div>

        <div className="discoverMetaRow">
          {event.level_tag ? (
            <span className="discoverMetaPill">Nivel {event.level_tag}</span>
          ) : null}

          {typeof event.participants_count === "number" ? (
            <span className="discoverMetaPill">
              {event.participants_count} inscritos
            </span>
          ) : null}

          {typeof event.capacity === "number" && event.capacity > 0 ? (
            <span className="discoverMetaPill">
              Aforo {event.capacity}
            </span>
          ) : null}
        </div>

        {event?.creator_profile_id ? (
          <div className="discoverEventCard__actions">
            <Link
              to={`/perfil/${event.creator_profile_id}`}
              className="discoverInlineLink"
            >
              Ver perfil
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <article className={`discoverStatCard${accent ? " discoverStatCard--accent" : ""}`}>
      <span className="discoverStatCard__label">{label}</span>
      <strong className="discoverStatCard__value">{value}</strong>
    </article>
  );
}

function CalendarLegend() {
  return (
    <div className="calendarLegend" aria-label="Leyenda del calendario">
      <span className="calendarLegend__item">
        <span className="calendarLegend__dot" />
        Sin actividad
      </span>
      <span className="calendarLegend__item">
        <span className="calendarLegend__dot calendarLegend__dot--active" />
        Con eventos
      </span>
      <span className="calendarLegend__item">
        <span className="calendarLegend__dot calendarLegend__dot--today" />
        Hoy
      </span>
    </div>
  );
}

function CreateMeetupModal({ open, initialDayKey, saving, onClose, onSubmit }) {
  const todayKey = localDayKey(new Date());
  const [form, setForm] = useState({
    dayKey: initialDayKey || todayKey,
    time: defaultTimeForDay(initialDayKey || todayKey),
    meeting_point: "",
    event_type: "entrenamiento",
    level_tag: "",
    pace_min: "",
    pace_max: "",
    capacity: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      dayKey: initialDayKey || todayKey,
      time: defaultTimeForDay(initialDayKey || todayKey),
      meeting_point: "",
      event_type: "entrenamiento",
      level_tag: "",
      pace_min: "",
      pace_max: "",
      capacity: "",
      notes: "",
    });
  }, [initialDayKey, open, todayKey]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const meetingPoint = String(form.meeting_point || "").trim();
    if (!meetingPoint) return;

    const startsAt = buildStartsAt(form.dayKey, form.time);
    if (new Date(startsAt).getTime() <= Date.now()) return;

    const paceMin = numberOrNull(form.pace_min);
    const paceMax = numberOrNull(form.pace_max);
    const capacity = numberOrNull(form.capacity);

    await onSubmit?.({
      starts_at: startsAt,
      meeting_point: meetingPoint,
      notes: buildNotes(form.event_type, form.notes),
      level_tag: form.level_tag || null,
      pace_min: paceMin,
      pace_max: paceMax,
      capacity,
    });
  }

  const startsAtPreview = buildStartsAt(form.dayKey, form.time);
  const isPast = new Date(startsAtPreview).getTime() <= Date.now();
  const invalidPace =
    form.pace_min !== "" &&
    form.pace_max !== "" &&
    Number(form.pace_min) > Number(form.pace_max);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalSheet modalSheet--discover" onClick={(e) => e.stopPropagation()}>
        <div className="discoverModalCard">
          <div className="discoverModalCard__head">
            <div>
              <span className="sectionEyebrow">Crear quedada</span>
              <h2 className="cardTitle">Nuevo evento</h2>
              <p className="cardSubtitle">
                Crea una quedada clara, rápida y lista para descubrir desde la home.
              </p>
            </div>

            <button
              type="button"
              className="discoverModalClose"
              onClick={onClose}
              aria-label="Cerrar"
              disabled={saving}
            >
              ×
            </button>
          </div>

          <form className="formStack" onSubmit={handleSubmit}>
            <div className="formSplit">
              <div className="formRow">
                <label htmlFor="create-meetup-date">Día</label>
                <input
                  id="create-meetup-date"
                  type="date"
                  value={form.dayKey}
                  min={todayKey}
                  onChange={(e) => updateField("dayKey", e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="formRow">
                <label htmlFor="create-meetup-time">Hora</label>
                <input
                  id="create-meetup-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="formRow">
              <label htmlFor="create-meetup-point">Punto de encuentro</label>
              <input
                id="create-meetup-point"
                value={form.meeting_point}
                onChange={(e) => updateField("meeting_point", e.target.value)}
                placeholder="Ej. Retiro, pista, salida de carrera..."
                disabled={saving}
                required
              />
            </div>

            <div className="formSplit">
              <div className="formRow">
                <label htmlFor="create-meetup-type">Tipo</label>
                <select
                  id="create-meetup-type"
                  value={form.event_type}
                  onChange={(e) => updateField("event_type", e.target.value)}
                  disabled={saving}
                >
                  <option value="entrenamiento">Entrenamiento</option>
                  <option value="rodaje">Rodaje</option>
                  <option value="series">Series</option>
                  <option value="tirada larga">Tirada larga</option>
                  <option value="social">Social</option>
                  <option value="carrera">Carrera</option>
                </select>
              </div>

              <div className="formRow">
                <label htmlFor="create-meetup-level">Nivel</label>
                <select
                  id="create-meetup-level"
                  value={form.level_tag}
                  onChange={(e) => updateField("level_tag", e.target.value)}
                  disabled={saving}
                >
                  <option value="">Sin especificar</option>
                  <option value="suave">Suave</option>
                  <option value="medio">Medio</option>
                  <option value="rapido">Rápido</option>
                </select>
              </div>
            </div>

            <div className="formSplit">
              <div className="formRow">
                <label htmlFor="create-meetup-pace-min">Ritmo mín.</label>
                <input
                  id="create-meetup-pace-min"
                  type="number"
                  min="1"
                  value={form.pace_min}
                  onChange={(e) => updateField("pace_min", e.target.value)}
                  placeholder="300"
                  disabled={saving}
                />
              </div>

              <div className="formRow">
                <label htmlFor="create-meetup-pace-max">Ritmo máx.</label>
                <input
                  id="create-meetup-pace-max"
                  type="number"
                  min="1"
                  value={form.pace_max}
                  onChange={(e) => updateField("pace_max", e.target.value)}
                  placeholder="360"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="formRow">
              <label htmlFor="create-meetup-capacity">Aforo</label>
              <input
                id="create-meetup-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="Opcional"
                disabled={saving}
              />
            </div>

            <div className="formRow">
              <label htmlFor="create-meetup-notes">Notas</label>
              <textarea
                id="create-meetup-notes"
                rows="4"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Distancia, objetivo, material recomendado..."
                disabled={saving}
              />
            </div>

            {isPast ? <p className="formHint">La fecha debe ser futura.</p> : null}

            {invalidPace ? (
              <p className="formHint">
                El ritmo mínimo no puede ser mayor que el máximo.
              </p>
            ) : null}

            <div className="discoverModalActions">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
                block
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={saving || isPast || invalidPace || !form.meeting_point.trim()}
                block
              >
                {saving ? "Publicando..." : "Publicar quedada"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DayModal({ open, dayKey, events, onClose, onCreateForDay }) {
  if (!open) return null;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalSheet modalSheet--discover" onClick={(e) => e.stopPropagation()}>
        <div className="discoverModalCard">
          <div className="discoverModalCard__head discoverModalCard__head--spaced">
            <div>
              <span className="sectionEyebrow">Agenda del día</span>
              <h2 className="cardTitle">{formatDayTitle(dayKey)}</h2>
              <p className="cardSubtitle">{daySummary(events)}</p>
            </div>

            <button
              type="button"
              className="discoverModalClose"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="discoverModalActions discoverModalActions--top">
            <Button variant="primary" onClick={() => onCreateForDay?.(dayKey)} block>
              Crear aquí
            </Button>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon="○"
              title="No hay eventos este día"
              description="Publica una quedada y aparecerá aquí dentro del calendario."
            />
          ) : (
            <div className="discoverEventList">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlaBlaRunPage() {
  const toast = useToast();
  const { token, me, isAuthed } = useAuth();
  const { items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(localDayKey(new Date()));
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDayKey, setCreateDayKey] = useState(localDayKey(new Date()));
  const [saving, setSaving] = useState(false);
  const [localCreated, setLocalCreated] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const allItems = useMemo(() => mergeMeetups(items, localCreated), [items, localCreated]);

  const upcomingItems = useMemo(
    () => allItems.filter((item) => item?.starts_at && isSameOrAfterToday(item.starts_at)),
    [allItems],
  );

  const filteredItems = useMemo(() => {
    return upcomingItems.filter((event) => matchesDiscoveryFilter(event, activeFilter, me));
  }, [activeFilter, me, upcomingItems]);

  const byDay = useMemo(() => groupByDay(filteredItems), [filteredItems]);
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthIndex = month.getMonth();
  const todayKey = localDayKey(new Date());

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(selectedDay) || [];
  }, [byDay, selectedDay]);

  const visibleDaysWithActivity = useMemo(
    () => days.filter((day) => byDay.has(localDayKey(day))).length,
    [byDay, days],
  );

  const todayEventsCount = useMemo(
    () => upcomingItems.filter((item) => localDayKey(item.starts_at) === todayKey).length,
    [todayKey, upcomingItems],
  );

  const nextEvents = useMemo(() => filteredItems.slice(0, 6), [filteredItems]);

  function goPrevMonth() {
    setMonth((prev) => addMonths(prev, -1));
  }

  function goNextMonth() {
    setMonth((prev) => addMonths(prev, 1));
  }

  function goToday() {
    setMonth(new Date());
    setSelectedDay(todayKey);
  }

  function openDay(dayKey) {
    setSelectedDay(dayKey);
    setDayModalOpen(true);
  }

  function openCreateModal(dayKey = localDayKey(new Date())) {
    setCreateDayKey(dayKey);
    setCreateOpen(true);
  }

  async function handleCreateMeetup(payload) {
    if (!isAuthed || !token) {
      toast?.error?.("Debes iniciar sesión para crear una quedada");
      return;
    }

    setSaving(true);

    try {
      const created = await apiCreateMyMeetup(payload, token);
      const normalized = normalizeCreatedMeetup(created, me);

      setLocalCreated((prev) => {
        const next = prev.filter((item) => String(item.id) !== String(normalized.id));
        return [normalized, ...next];
      });

      await run();
      setSelectedDay(localDayKey(normalized.starts_at));
      setDayModalOpen(true);
      setCreateOpen(false);

      toast?.success?.("Quedada creada correctamente");
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo crear la quedada");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page page--eventsHome">
        <section className="discoverHero">
          <div className="discoverHero__copy">
            <span className="sectionEyebrow">Home de eventos</span>
            <h1 className="discoverHero__title">
              Descubre planes, entrenamientos y quedadas para correr con otros runners.
            </h1>
            <p className="discoverHero__text">
              Entra, explora rápido el calendario y crea tu próxima quedada desde una interfaz ligera y clara.
            </p>
          </div>

          <div className="discoverHero__actions">
            <Button variant="primary" onClick={() => openCreateModal()}>
              Crear quedada
            </Button>

            <Button variant="secondary" onClick={goToday}>
              Ir a hoy
            </Button>
          </div>

          <div className="discoverStatsGrid">
            <StatCard label="Próximos eventos" value={upcomingItems.length} accent />
            <StatCard label="Eventos hoy" value={todayEventsCount} />
            <StatCard label="Días activos este mes" value={visibleDaysWithActivity} />
          </div>
        </section>

        <section className="discoverFiltersSection">
          <div className="sectionHead">
            <div className="sectionHead__copy">
              <span className="sectionEyebrow">Exploración rápida</span>
              <h2 className="sectionTitle">Filtra lo importante</h2>
              <p className="sectionLead">
                Reduce ruido y encuentra antes lo que te interesa hacer ahora.
              </p>
            </div>
          </div>

          <div className="discoverFilterRow">
            {DISCOVERY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`discoverFilterChip${activeFilter === filter.id ? " is-active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="discoverSection">
          <div className="sectionHead">
            <div className="sectionHead__copy">
              <span className="sectionEyebrow">Calendario</span>
              <h2 className="sectionTitle">{monthLabel(month)}</h2>
              <p className="sectionLead">
                Pulsa un día para ver detalle o crear una quedada exactamente ahí.
              </p>
            </div>

            <div className="discoverMonthControls">
              <button type="button" className="discoverMonthBtn" onClick={goPrevMonth} aria-label="Mes anterior">
                ←
              </button>
              <button type="button" className="discoverMonthBtn discoverMonthBtn--wide" onClick={goToday}>
                Hoy
              </button>
              <button type="button" className="discoverMonthBtn" onClick={goNextMonth} aria-label="Mes siguiente">
                →
              </button>
            </div>
          </div>

          {error ? (
            <EmptyState
              icon="!"
              title="No se pudo cargar el calendario"
              description={error}
              actionLabel="Reintentar"
              onAction={() => run()}
            />
          ) : loading ? (
            <div className="discoverCalendarCard discoverCalendarCard--loading">
              <p className="discoverLoading">Cargando calendario de eventos…</p>
            </div>
          ) : (
            <div className="discoverCalendarCard">
              <CalendarLegend />

              <div className="discoverWeekdays" aria-hidden="true">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="discoverWeekdays__item">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="discoverCalendarGrid">
                {days.map((day) => {
                  const inMonth = day.getMonth() === monthIndex;
                  const key = localDayKey(day);
                  const dayItems = byDay.get(key) || [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;

                  return (
                    <button
                      key={`${key}-${inMonth ? "in" : "out"}`}
                      type="button"
                      onClick={() => openDay(key)}
                      className={`discoverDayCell${!inMonth ? " is-outside" : ""}${dayItems.length > 0 ? " has-events" : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
                      title={`${key} · ${daySummary(dayItems)}`}
                    >
                      <div className="discoverDayCell__top">
                        <span className="discoverDayCell__date">{day.getDate()}</span>
                        {dayItems.length > 0 ? (
                          <span className="discoverDayCell__count">{dayItems.length}</span>
                        ) : null}
                      </div>

                      <div className="discoverDayCell__preview">
                        {dayItems.length > 0 ? (
                          <>
                            {dayItems.slice(0, 2).map((item) => (
                              <span key={item.id} className="discoverDayCell__line">
                                {timeLabel(item.starts_at)} · {creatorLabel(item)}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="discoverDayCell__empty">Sin eventos</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="discoverSection">
          <div className="sectionHead">
            <div className="sectionHead__copy">
              <span className="sectionEyebrow">Próximos planes</span>
              <h2 className="sectionTitle">Qué puedes hacer ahora</h2>
              <p className="sectionLead">
                Una lista rápida para descubrir actividad sin depender solo del calendario.
              </p>
            </div>
          </div>

          {loading ? null : nextEvents.length === 0 ? (
            <EmptyState
              icon="○"
              title="No hay eventos para este filtro"
              description="Prueba otro filtro o crea una nueva quedada para activar el calendario."
              actionLabel="Crear quedada"
              onAction={() => openCreateModal(selectedDay || todayKey)}
            />
          ) : (
            <div className="discoverEventList">
              {nextEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </section>

      <DayModal
        open={dayModalOpen}
        dayKey={selectedDay}
        events={selectedEvents}
        onClose={() => setDayModalOpen(false)}
        onCreateForDay={(dayKey) => {
          setDayModalOpen(false);
          openCreateModal(dayKey);
        }}
      />

      <CreateMeetupModal
        open={createOpen}
        initialDayKey={createDayKey}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateMeetup}
      />
    </>
  );
}
