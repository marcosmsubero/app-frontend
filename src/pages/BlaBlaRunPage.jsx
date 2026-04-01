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
    <Link to={`/perfil/${event.creator_profile_id}`}>
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
    <article className="eventCard">
      <div className="eventCard__head">
        <div className="eventCard__meta">
          <div>
            <h3 className="eventCard__title">{event.meeting_point || "Evento"}</h3>
            <p className="eventCard__subtitle">
              {timeLabel(event.starts_at)} · <CreatorLink event={event} />
            </p>
          </div>
        </div>

        <span className="badge">
          {event.visibility === "private" ? "Privado" : "Público"}
        </span>
      </div>

      <div className="eventCard__body">
        <div className="eventMetaGrid">
          {event.level_tag ? (
            <div className="eventMetaItem">
              <div className="eventMetaItem__label">Nivel</div>
              <div className="eventMetaItem__value">{event.level_tag}</div>
            </div>
          ) : null}

          {typeof event.participants_count === "number" ? (
            <div className="eventMetaItem">
              <div className="eventMetaItem__label">Inscritos</div>
              <div className="eventMetaItem__value">{event.participants_count}</div>
            </div>
          ) : null}

          {typeof event.capacity === "number" && event.capacity > 0 ? (
            <div className="eventMetaItem">
              <div className="eventMetaItem__label">Aforo</div>
              <div className="eventMetaItem__value">{event.capacity}</div>
            </div>
          ) : null}
        </div>

        {event.notes ? <p className="eventCard__text">{event.notes}</p> : null}

        {event?.creator_profile_id ? (
          <div className="eventCard__actions">
            <Link
              to={`/perfil/${event.creator_profile_id}`}
              className="feedCard__action"
            >
              Ver perfil
            </Link>
          </div>
        ) : null}
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
      <div className="modalSheet" onClick={(e) => e.stopPropagation()}>
        <div className="formCard">
          <h2 className="cardTitle">Crear quedada</h2>
          <p className="cardSubtitle">
            Publica un evento simple, claro y listo para móvil.
          </p>

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
                placeholder="Ej. parque, pista, salida de carrera..."
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

            {isPast ? (
              <p className="formHint">La fecha debe ser futura.</p>
            ) : null}

            {invalidPace ? (
              <p className="formHint">El ritmo mínimo no puede ser mayor que el máximo.</p>
            ) : null}

            <div className="formActions">
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn--primary"
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
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalSheet" onClick={(e) => e.stopPropagation()}>
        <div className="sectionBlock">
          <div className="sectionHead">
            <div className="sectionHead__copy">
              <span className="sectionEyebrow">BlaBlaRun</span>
              <h2 className="sectionTitle">{formatDayTitle(dayKey)}</h2>
              <p className="sectionLead">{daySummary(events)}</p>
            </div>
          </div>

          <div className="feedCard__actions">
            <button
              type="button"
              className="feedCard__action feedCard__action--primary"
              onClick={() => onCreateForDay?.(dayKey)}
            >
              Crear aquí
            </button>

            <button type="button" className="feedCard__action" onClick={onClose}>
              Cerrar
            </button>
          </div>

          {events.length === 0 ? (
            <div className="stateCard">
              <h3 className="stateCard__title">No hay eventos</h3>
              <p className="stateCard__text">
                Publica una quedada y aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="eventList">
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
      <section className="page">
        <section className="heroPanel">
          <div className="heroPanel__top">
            <div>
              <span className="sectionEyebrow">BlaBlaRun</span>
              <h1 className="heroPanel__title">Calendario de eventos</h1>
            </div>

            <span className="heroPanel__badge">
              {visibleDaysWithActivity} días activos
            </span>
          </div>

          <p className="heroPanel__text">
            Explora quedadas del mes y publica la tuya en pocos segundos.
          </p>

          <div className="feedCard__actions">
            <button
              type="button"
              className="feedCard__action feedCard__action--primary"
              onClick={() => openCreateModal()}
            >
              Crear quedada
            </button>

            <button type="button" className="feedCard__action" onClick={goPrevMonth}>
              ←
            </button>

            <button type="button" className="feedCard__action" onClick={goToday}>
              Hoy
            </button>

            <button type="button" className="feedCard__action" onClick={goNextMonth}>
              →
            </button>
          </div>
        </section>

        <section className="sectionBlock">
          <div className="sectionHead">
            <div className="sectionHead__copy">
              <h2 className="sectionTitle">{monthLabel(month)}</h2>
              <p className="sectionLead">
                Pulsa un día para ver detalle o crear una quedada ahí.
              </p>
            </div>
          </div>

          {error ? (
            <div className="stateCard">
              <h3 className="stateCard__title">No se pudo cargar el calendario</h3>
              <p className="stateCard__text">{error}</p>
            </div>
          ) : loading ? (
            <div className="stateCard">
              <h3 className="stateCard__title">Cargando eventos</h3>
              <p className="stateCard__text">Estamos preparando el calendario.</p>
            </div>
          ) : (
            <div className="card">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 12,
                }}
                aria-hidden="true"
              >
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--text-muted)",
                    }}
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
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
                      style={{
                        minHeight: 84,
                        borderRadius: 18,
                        border: isToday
                          ? "1px solid rgba(255, 107, 87, 0.28)"
                          : "1px solid var(--surface-border)",
                        background:
                          dayItems.length > 0
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(255,255,255,0.03)",
                        color: inMonth ? "var(--text)" : "var(--text-muted)",
                        padding: 10,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <strong>{day.getDate()}</strong>
                        {dayItems.length > 0 ? (
                          <span className="badge badge--primary">{dayItems.length}</span>
                        ) : null}
                      </div>

                      <div style={{ fontSize: 11, lineHeight: 1.35, color: "var(--text-soft)" }}>
                        {dayItems.slice(0, 2).map((item) => (
                          <div key={item.id}>
                            {timeLabel(item.starts_at)} · {creatorLabel(item)}
                          </div>
                        ))}

                        {dayItems.length === 0 ? <div>Sin eventos</div> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
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
