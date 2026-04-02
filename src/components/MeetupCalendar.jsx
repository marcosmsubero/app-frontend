import { useEffect, useMemo, useState } from "react";
import { apiCreateMyMeetup } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  monthLabel,
  timeLabel,
} from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

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

function dotKind(meetup, myUserId) {
  if (meetup?.created_by === myUserId) return "own";
  if (meetup?.is_joined) return "joined";
  return "other";
}

function daySummary(items = []) {
  if (!items.length) return "Sin actividad";
  if (items.length === 1) return "1 actividad";
  return `${items.length} actividades`;
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

function ownerLabel(meetup) {
  return meetup?.creator_profile_name || meetup?.group_name || "Perfil";
}

function formatSelectedDay(dayKey) {
  if (!dayKey) return "Selecciona un día";

  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function CalendarLegend() {
  return (
    <div className="calendarMini__legend" aria-label="Leyenda del calendario">
      <span className="calendarMini__legendItem">
        <span className="calendarMini__legendDot calendarMini__legendDot--own" />
        Creados por ti
      </span>
      <span className="calendarMini__legendItem">
        <span className="calendarMini__legendDot calendarMini__legendDot--joined" />
        Te has unido
      </span>
      <span className="calendarMini__legendItem">
        <span className="calendarMini__legendDot calendarMini__legendDot--other" />
        Otros eventos
      </span>
    </div>
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

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
        aria-labelledby="calendar-create-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal__header">
          <div>
            <p className="app-kicker">Crear evento</p>
            <h3 id="calendar-create-title" className="ui-modal__title">
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
                <label className="app-label" htmlFor="calendar-event-type">
                  Tipo
                </label>
                <select
                  id="calendar-event-type"
                  className="app-select"
                  value={form.event_type}
                  onChange={(e) => updateField("event_type", e.target.value)}
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
                <label className="app-label" htmlFor="calendar-time">
                  Hora
                </label>
                <input
                  id="calendar-time"
                  className="app-input"
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="calendar-meeting-point">
                Punto de encuentro
              </label>
              <input
                id="calendar-meeting-point"
                className="app-input"
                value={form.meeting_point}
                onChange={(e) => updateField("meeting_point", e.target.value)}
                placeholder="Ej. parque, pista, salida de carrera..."
                disabled={saving}
              />
            </div>

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="calendar-level">
                  Nivel
                </label>
                <select
                  id="calendar-level"
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

              <div className="app-field calendarMini__fieldNarrow">
                <label className="app-label" htmlFor="calendar-capacity">
                  Aforo
                </label>
                <input
                  id="calendar-capacity"
                  className="app-input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                  placeholder="10"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="calendarMini__formRow calendarMini__formRow--split">
              <div className="app-field calendarMini__fieldGrow">
                <label className="app-label" htmlFor="calendar-pace-min">
                  Ritmo mín. (seg/km)
                </label>
                <input
                  id="calendar-pace-min"
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
                <label className="app-label" htmlFor="calendar-pace-max">
                  Ritmo máx. (seg/km)
                </label>
                <input
                  id="calendar-pace-max"
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
              <label className="app-label" htmlFor="calendar-notes">
                Notas
              </label>
              <textarea
                id="calendar-notes"
                className="app-textarea"
                rows={4}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
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

export default function MeetupCalendar({
  meetups = [],
  me,
  canCreate = true,
  eyebrow = "Agenda",
  title = "Calendario",
  description = "Vista mensual de la actividad asociada al perfil.",
}) {
  const toast = useToast();
  const { token } = useAuth();

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => localDayKey(today));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [localMeetups, setLocalMeetups] = useState([]);

  const allMeetups = useMemo(() => {
    return [...(Array.isArray(meetups) ? meetups : []), ...localMeetups];
  }, [localMeetups, meetups]);

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const byDay = useMemo(() => groupByDay(allMeetups), [allMeetups]);

  const monthIndex = month.getMonth();
  const todayKey = localDayKey(today);
  const selectedItems = selectedDay ? byDay.get(selectedDay) || [] : [];
  const activeDaysCount = byDay.size;
  const myUserId = me?.id ?? null;

  function goPrevMonth() {
    setMonth((prev) => addMonths(prev, -1));
  }

  function goNextMonth() {
    setMonth((prev) => addMonths(prev, 1));
  }

  function goToday() {
    const now = new Date();
    setMonth(now);
    setSelectedDay(localDayKey(now));
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
          me?.full_name ||
          me?.name ||
          me?.handle ||
          me?.email ||
          "Mi perfil",
        creator_profile_handle: created?.creator_profile_handle ?? me?.handle ?? null,
        participants_count: created?.participants_count ?? 1,
        created_by: created?.created_by ?? me?.id ?? null,
        is_joined: true,
        title: payload.title,
      };

      setLocalMeetups((prev) => [normalizedCreated, ...prev]);
      setShowCreateModal(false);
      toast?.success?.("Evento creado correctamente.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo crear el evento.");
      throw error;
    } finally {
      setSavingEvent(false);
    }
  }

  return (
    <>
      <section className="calendarMini" aria-label="Calendario de actividades">
        <div className="calendarMini__hero">
          <div className="calendarMini__heroCopy">
            <p className="app-kicker">{eyebrow}</p>
            <h3 className="calendarMini__title">{title}</h3>
            <p className="calendarMini__description">{description}</p>
          </div>

          <div className="calendarMini__stats">
            <div className="calendarMini__stat">
              <span className="calendarMini__statLabel">Eventos</span>
              <strong className="calendarMini__statValue">{allMeetups.length}</strong>
            </div>

            <div className="calendarMini__stat">
              <span className="calendarMini__statLabel">Días activos</span>
              <strong className="calendarMini__statValue">{activeDaysCount}</strong>
            </div>
          </div>
        </div>

        <div className="calendarMini__header">
          <div className="calendarMini__heading">
            <p className="app-kicker">Mes</p>
            <h4 className="calendarMini__monthLabel">{monthLabel(month)}</h4>
          </div>

          <div className="calendarMini__actions">
            <button
              type="button"
              className="calendarMini__iconBtn"
              onClick={goPrevMonth}
              aria-label="Mes anterior"
              title="Mes anterior"
            >
              ←
            </button>

            <button
              type="button"
              className="calendarMini__textBtn"
              onClick={goToday}
              aria-label="Ir a hoy"
              title="Ir a hoy"
            >
              Hoy
            </button>

            <button
              type="button"
              className="calendarMini__iconBtn"
              onClick={goNextMonth}
              aria-label="Mes siguiente"
              title="Mes siguiente"
            >
              →
            </button>
          </div>
        </div>

        <CalendarLegend />

        <div className="calendarMini__week" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="calendarMini__weekday">
              {weekday}
            </div>
          ))}
        </div>

        <div className="calendarMini__grid">
          {days.map((day) => {
            const inMonth = day.getMonth() === monthIndex;
            const key = localDayKey(day);
            const items = byDay.get(key) || [];
            const isSelected = selectedDay === key;
            const isToday = key === todayKey;

            return (
              <button
                key={`${key}-${inMonth ? "in" : "out"}`}
                type="button"
                className={[
                  "calendarMini__day",
                  !inMonth ? "calendarMini__day--muted" : "",
                  items.length > 0 ? "calendarMini__day--active" : "",
                  isSelected ? "calendarMini__day--selected" : "",
                  isToday ? "calendarMini__day--today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDay(key)}
                title={`${key} · ${daySummary(items)}`}
                aria-label={`Día ${key}${items.length ? `, ${items.length} actividades` : ""}`}
              >
                <span className="calendarMini__dayNumber">{day.getDate()}</span>

                <span className="calendarMini__dots" aria-hidden="true">
                  {items.slice(0, 3).map((meetup) => (
                    <span
                      key={meetup.id}
                      className={`calendarMini__dot calendarMini__dot--${dotKind(meetup, myUserId)}`}
                      title={`${timeLabel(meetup.starts_at)} · ${
                        meetup.meeting_point || meetup.title || "Quedada"
                      }`}
                    />
                  ))}

                  {items.length > 3 ? (
                    <span
                      className="calendarMini__dot calendarMini__dot--more"
                      title={`+${items.length - 3}`}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="calendarMini__detail">
          <div className="calendarMini__detailHead">
            <div>
              <p className="app-kicker">Detalle del día</p>
              <h4 className="calendarMini__detailTitle">
                {formatSelectedDay(selectedDay)}
              </h4>
              <p className="calendarMini__detailText">{daySummary(selectedItems)}</p>
            </div>

            {selectedDay && canCreate ? (
              <button
                type="button"
                className="calendarMini__textBtn calendarMini__textBtn--accent"
                onClick={() => setShowCreateModal(true)}
              >
                Crear evento
              </button>
            ) : null}
          </div>

          {!selectedDay ? (
            <div className="calendarMini__empty">
              Selecciona un día para ver el detalle.
            </div>
          ) : selectedItems.length === 0 ? (
            <div className="calendarMini__empty">
              No hay actividad ese día{canCreate ? ". Puedes crear una nueva." : "."}
            </div>
          ) : (
            <div className="calendarMini__list">
              {selectedItems.map((meetup) => (
                <article key={meetup.id} className="calendarMini__item">
                  <div className="calendarMini__itemTop">
                    <h5 className="calendarMini__itemTitle">
                      {meetup.meeting_point || meetup.title || "Quedada"}
                    </h5>
                    <span className="calendarMini__itemTime">
                      {timeLabel(meetup.starts_at)}
                    </span>
                  </div>

                  <div className="calendarMini__itemMeta">
                    <span>{ownerLabel(meetup)}</span>
                    {meetup.level_tag ? <span>{meetup.level_tag}</span> : null}
                    {meetup.pace_min || meetup.pace_max ? (
                      <span>
                        ritmo {meetup.pace_min ? `${meetup.pace_min}s/km` : "?"}–
                        {meetup.pace_max ? `${meetup.pace_max}s/km` : "?"}
                      </span>
                    ) : null}
                    <span>inscritos {meetup.participants_count ?? 0}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {canCreate ? (
        <CreateEventModal
          open={showCreateModal}
          dayKey={selectedDay}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          saving={savingEvent}
        />
      ) : null}
    </>
  );
}
