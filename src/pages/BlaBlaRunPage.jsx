import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiCreateMyMeetup } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import { useToast } from "../hooks/useToast";
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
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  );
}

function daySummary(items = []) {
  if (!items.length) return "No hay eventos este día";
  if (items.length === 1) return "1 evento";
  return `${items.length} eventos`;
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

function creatorLabel(event) {
  return event?.host_profile_name || event?.creator_profile_name || event?.group_name || "Perfil";
}

function CreatorLink({ event }) {
  const label = creatorLabel(event);

  if (!event?.creator_profile_id) {
    return <span>{label}</span>;
  }

  return (
    <Link to={`/perfil/${event.creator_profile_id}`} className="blablarunPage__creatorLink">
      {label}
    </Link>
  );
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
    0
  );

  return date.toISOString();
}

function normalizeCreatedMeetup(created, me) {
  return {
    ...created,
    host_profile_id: created?.host_profile_id ?? created?.creator_profile_id ?? null,
    host_profile_type: created?.host_profile_type ?? created?.creator_profile_type ?? "individual",
    host_profile_name:
      created?.host_profile_name ||
      created?.creator_profile_name ||
      me?.full_name ||
      me?.handle ||
      me?.email ||
      "Tú",
    host_profile_handle: created?.host_profile_handle ?? created?.creator_profile_handle ?? null,
    host_profile_avatar_url:
      created?.host_profile_avatar_url ?? created?.creator_profile_avatar_url ?? me?.avatar_url ?? null,
    creator_profile_name:
      created?.creator_profile_name || me?.full_name || me?.handle || me?.email || "Tú",
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

function EventCard({ event }) {
  return (
    <article className="app-card blablarunPage__eventCard">
      <div className="app-card__body blablarunPage__eventCardBody">
        <div className="blablarunPage__eventTop">
          <h4 className="blablarunPage__eventTitle">
            {event.meeting_point || "Evento"}
          </h4>

          <span className="app-chip app-chip--soft">{timeLabel(event.starts_at)}</span>
        </div>

        <div className="blablarunPage__eventMeta">
          <span>
            Host: <CreatorLink event={event} />
          </span>

          {event.level_tag ? <span>• Nivel: {event.level_tag}</span> : null}

          {typeof event.participants_count === "number" ? (
            <span>• {event.participants_count} inscritos</span>
          ) : null}

          {typeof event.capacity === "number" && event.capacity > 0 ? (
            <span>• Aforo: {event.capacity}</span>
          ) : null}

          {event.visibility ? (
            <span>• {event.visibility === "private" ? "Privado" : "Público"}</span>
          ) : null}
        </div>

        {event.notes ? <p className="blablarunPage__eventNotes">{event.notes}</p> : null}

        <div className="blablarunPage__eventActions">
          {event?.creator_profile_id ? (
            <Link
              to={`/perfil/${event.creator_profile_id}`}
              className="app-button app-button--secondary app-button--sm"
            >
              Ver perfil
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function CreateMeetupModal({ open, initialDayKey, saving, onClose, onSubmit }) {
  const todayKey = localDayKey(new Date());
  const [form, setForm] = useState(() => ({
    dayKey: initialDayKey || todayKey,
    time: defaultTimeForDay(initialDayKey || todayKey),
    meeting_point: "",
    event_type: "entrenamiento",
    level_tag: "",
    pace_min: "",
    pace_max: "",
    capacity: "",
    notes: "",
  }));

  useMemo(() => {
    if (!open) return null;
    return null;
  }, [open]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForDay(nextDayKey) {
    setForm({
      dayKey: nextDayKey || todayKey,
      time: defaultTimeForDay(nextDayKey || todayKey),
      meeting_point: "",
      event_type: "entrenamiento",
      level_tag: "",
      pace_min: "",
      pace_max: "",
      capacity: "",
      notes: "",
    });
  }

  if (form.dayKey !== (initialDayKey || todayKey) && !form.meeting_point && !form.notes) {
    // no-op deliberado; evita reset continuo si el usuario ya está escribiendo
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

    resetForDay(initialDayKey || todayKey);
  }

  const startsAtPreview = buildStartsAt(form.dayKey, form.time);
  const isPast = new Date(startsAtPreview).getTime() <= Date.now();
  const invalidPace =
    form.pace_min !== "" &&
    form.pace_max !== "" &&
    Number(form.pace_min) > Number(form.pace_max);

  return (
    <div className="ui-modalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="ui-modal blablarunPage__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blablarun-create-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="blablarunPage__modalBody">
          <div className="blablarunPage__modalHead">
            <div className="blablarunPage__modalCopy">
              <p className="page__eyebrow blablarunPage__modalEyebrow">Crear quedada</p>
              <h2 id="blablarun-create-title" className="blablarunPage__modalTitle">
                Publica tu evento de running
              </h2>
              <p className="blablarunPage__modalSubtitle">
                Hazlo simple: fecha, hora, punto de encuentro y nivel.
              </p>
            </div>

            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="calendarMini__form">
            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="create-meetup-date">
                  Día
                </label>
                <input
                  id="create-meetup-date"
                  className="app-input"
                  type="date"
                  value={form.dayKey}
                  min={todayKey}
                  onChange={(e) => updateField("dayKey", e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="app-field calendarMini__fieldNarrow">
                <label className="app-label" htmlFor="create-meetup-time">
                  Hora
                </label>
                <input
                  id="create-meetup-time"
                  className="app-input"
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-meetup-point">
                Punto de encuentro
              </label>
              <input
                id="create-meetup-point"
                className="app-input"
                value={form.meeting_point}
                onChange={(e) => updateField("meeting_point", e.target.value)}
                placeholder="Ej. Estadio, parque, pista, salida de carrera..."
                disabled={saving}
                required
              />
            </div>

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="create-meetup-type">
                  Tipo de salida
                </label>
                <select
                  id="create-meetup-type"
                  className="app-select"
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

              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="create-meetup-level">
                  Nivel
                </label>
                <select
                  id="create-meetup-level"
                  className="app-select"
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

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="create-meetup-pace-min">
                  Ritmo mín. (seg/km)
                </label>
                <input
                  id="create-meetup-pace-min"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.pace_min}
                  onChange={(e) => updateField("pace_min", e.target.value)}
                  placeholder="300"
                  disabled={saving}
                />
              </div>

              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="create-meetup-pace-max">
                  Ritmo máx. (seg/km)
                </label>
                <input
                  id="create-meetup-pace-max"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.pace_max}
                  onChange={(e) => updateField("pace_max", e.target.value)}
                  placeholder="360"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-meetup-capacity">
                Aforo
              </label>
              <input
                id="create-meetup-capacity"
                className="app-input"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
                placeholder="Opcional"
                disabled={saving}
              />
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-meetup-notes">
                Notas
              </label>
              <textarea
                id="create-meetup-notes"
                className="app-textarea"
                rows="4"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Añade contexto útil: distancia, objetivo, material recomendado..."
                disabled={saving}
              />
            </div>

            {isPast ? (
              <div className="app-empty" style={{ marginTop: 8 }}>
                <div className="notificationsSimple__emptyBody">
                  <strong>La fecha debe ser futura</strong>
                  <p>Elige una hora posterior al momento actual.</p>
                </div>
              </div>
            ) : null}

            {invalidPace ? (
              <div className="app-empty" style={{ marginTop: 8 }}>
                <div className="notificationsSimple__emptyBody">
                  <strong>Rango de ritmo no válido</strong>
                  <p>El ritmo mínimo no puede ser mayor que el máximo.</p>
                </div>
              </div>
            ) : null}

            <div className="calendarMini__formActions">
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="app-button app-button--primary"
                disabled={saving || isPast || invalidPace || !form.meeting_point.trim()}
              >
                {saving ? "Publicando..." : "Publicar quedada"}
              </button>
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
    <div className="ui-modalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="ui-modal blablarunPage__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blablarun-day-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="blablarunPage__modalBody">
          <div className="blablarunPage__modalHead">
            <div className="blablarunPage__modalCopy">
              <p className="page__eyebrow blablarunPage__modalEyebrow">BlaBlaRun</p>
              <h2 id="blablarun-day-title" className="blablarunPage__modalTitle">
                {formatDayTitle(dayKey)}
              </h2>
              <p className="blablarunPage__modalSubtitle">{daySummary(events)}</p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => onCreateForDay?.(dayKey)}
              >
                Crear aquí
              </button>

              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No hay eventos este día</strong>
                <p>Publica una quedada y aparecerá aquí en cuanto se cree.</p>
              </div>
            </div>
          ) : (
            <div className="blablarunPage__modalList">
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
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDayKey, setCreateDayKey] = useState(localDayKey(new Date()));
  const [saving, setSaving] = useState(false);
  const [localCreated, setLocalCreated] = useState([]);

  const allItems = useMemo(() => mergeMeetups(items, localCreated), [items, localCreated]);
  const byDay = useMemo(() => groupByDay(allItems), [allItems]);
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthIndex = month.getMonth();
  const todayKey = localDayKey(new Date());

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(selectedDay) || [];
  }, [byDay, selectedDay]);

  const visibleDaysWithActivity = useMemo(() => {
    return days.filter((day) => byDay.has(localDayKey(day))).length;
  }, [byDay, days]);

  function goPrevMonth() {
    setMonth((prev) => addMonths(prev, -1));
  }

  function goNextMonth() {
    setMonth((prev) => addMonths(prev, 1));
  }

  function goToday() {
    setMonth(new Date());
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
      <section className="page blablarunPage">
        <div className="app-card blablarunPage__shell">
          <div className="app-card__body blablarunPage__shellBody">
            <div className="page__header blablarunPage__hero">
              <span className="page__eyebrow">BlaBlaRun</span>
              <h1 className="page__title">Calendario de eventos</h1>
              <p className="page__subtitle">
                Explora quedadas del mes y publica la tuya en pocos segundos.
              </p>
            </div>

            <div className="blablarunPage__toolbar">
              <div className="blablarunPage__toolbarCopy">
                <h2 className="blablarunPage__monthTitle">{monthLabel(month)}</h2>
                <p className="blablarunPage__monthMeta">
                  {visibleDaysWithActivity} días con actividad visible
                </p>
              </div>

              <div
                className="blablarunPage__toolbarActions"
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                <button
                  type="button"
                  className="app-button app-button--primary"
                  onClick={() => openCreateModal()}
                >
                  Crear quedada
                </button>

                <button
                  type="button"
                  className="app-button app-button--secondary"
                  onClick={goPrevMonth}
                >
                  ←
                </button>

                <button
                  type="button"
                  className="app-button app-button--secondary"
                  onClick={goToday}
                >
                  Hoy
                </button>

                <button
                  type="button"
                  className="app-button app-button--secondary"
                  onClick={goNextMonth}
                >
                  →
                </button>
              </div>
            </div>

            {error ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>No se pudo cargar el calendario</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Cargando eventos</strong>
                  <p>Estamos preparando el calendario.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="blablarunPage__week" aria-hidden="true">
                  {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className="blablarunPage__weekday">
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className="blablarunPage__grid">
                  {days.map((day) => {
                    const inMonth = day.getMonth() === monthIndex;
                    const key = localDayKey(day);
                    const dayItems = byDay.get(key) || [];
                    const isToday = key === todayKey;

                    return (
                      <button
                        key={`${key}-${inMonth ? "in" : "out"}`}
                        type="button"
                        onClick={() => openDay(key)}
                        title={`${key} · ${daySummary(dayItems)}`}
                        className={[
                          "blablarunPage__day",
                          !inMonth ? "blablarunPage__day--muted" : "",
                          isToday ? "blablarunPage__day--today" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="blablarunPage__dayTop">
                          <span className="blablarunPage__dayNumber">{day.getDate()}</span>

                          {dayItems.length > 0 ? (
                            <span className="app-badge app-badge--primary">{dayItems.length}</span>
                          ) : null}
                        </div>

                        <div className="blablarunPage__dayBody">
                          {dayItems.slice(0, 2).map((item) => (
                            <div key={item.id} className="blablarunPage__dayItem">
                              {timeLabel(item.starts_at)} · {creatorLabel(item)}
                            </div>
                          ))}

                          {dayItems.length === 0 ? (
                            <div className="blablarunPage__dayEmpty">Sin eventos</div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
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
