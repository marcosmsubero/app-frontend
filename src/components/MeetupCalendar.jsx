import { useEffect, useMemo, useState } from "react";
import { apiCreateMeetup } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useGroups } from "../hooks/useGroups";
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
  const date = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
  return date.toISOString();
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function CreateEventModal({
  open,
  dayKey,
  joinedGroups,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    group_id: "",
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
    const firstGroupId = joinedGroups[0]?.id ? String(joinedGroups[0].id) : "";
    setForm({
      group_id: firstGroupId,
      event_type: "entrenamiento",
      time: defaultTimeForDay(dayKey),
      meeting_point: "",
      notes: "",
      level_tag: "",
      pace_min: "",
      pace_max: "",
      capacity: "",
    });
  }, [dayKey, joinedGroups, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const hasGroups = joinedGroups.length > 0;
  const disabled = saving || !hasGroups;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.group_id || !form.meeting_point.trim()) return;

    const notesParts = [];
    if (form.event_type) notesParts.push(`Tipo: ${form.event_type}`);
    if (form.notes.trim()) notesParts.push(form.notes.trim());

    await onSubmit?.({
      group_id: Number(form.group_id),
      starts_at: buildStartsAt(dayKey, form.time),
      meeting_point: form.meeting_point.trim(),
      notes: notesParts.join("\n"),
      level_tag: form.level_tag || null,
      pace_min: numberOrNull(form.pace_min),
      pace_max: numberOrNull(form.pace_max),
      capacity: numberOrNull(form.capacity),
      title: form.event_type,
    });
  }

  return (
    <div className="ui-modalBackdrop" role="presentation" onClick={() => onClose?.()}>
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-create-event-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 100%)" }}
      >
        <div style={{ padding: 20, display: "grid", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <p className="app-kicker" style={{ margin: 0 }}>
                Calendario
              </p>
              <h3 id="calendar-create-event-title" style={{ margin: "4px 0 0" }}>
                Crear evento para {dayKey}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Cerrar"
              title="Cerrar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid var(--app-border)",
                background: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <ModalCloseIcon />
            </button>
          </div>

          {!hasGroups ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No tienes grupos disponibles</strong>
                <p>Únete a un grupo antes de crear eventos desde el calendario.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="ui-stack">
              <div className="app-field">
                <label className="app-label" htmlFor="calendar-group">
                  Grupo
                </label>
                <select
                  id="calendar-group"
                  className="app-select"
                  value={form.group_id}
                  onChange={(e) => updateField("group_id", e.target.value)}
                  disabled={disabled}
                >
                  {joinedGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ui-row" style={{ alignItems: "flex-start" }}>
                <div className="app-field" style={{ flex: 1 }}>
                  <label className="app-label" htmlFor="calendar-event-type">
                    Tipo
                  </label>
                  <select
                    id="calendar-event-type"
                    className="app-select"
                    value={form.event_type}
                    onChange={(e) => updateField("event_type", e.target.value)}
                    disabled={disabled}
                  >
                    <option value="entrenamiento">Entrenamiento</option>
                    <option value="quedada">Quedada</option>
                    <option value="carrera">Carrera</option>
                  </select>
                </div>

                <div className="app-field" style={{ width: 140 }}>
                  <label className="app-label" htmlFor="calendar-time">
                    Hora
                  </label>
                  <input
                    id="calendar-time"
                    className="app-input"
                    type="time"
                    value={form.time}
                    onChange={(e) => updateField("time", e.target.value)}
                    disabled={disabled}
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
                  placeholder="Ej. Parque, pista, salida de carrera..."
                  disabled={disabled}
                />
              </div>

              <div className="ui-row" style={{ alignItems: "flex-start" }}>
                <div className="app-field" style={{ flex: 1 }}>
                  <label className="app-label" htmlFor="calendar-level">
                    Nivel
                  </label>
                  <select
                    id="calendar-level"
                    className="app-select"
                    value={form.level_tag}
                    onChange={(e) => updateField("level_tag", e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">Sin especificar</option>
                    <option value="suave">Suave</option>
                    <option value="medio">Medio</option>
                    <option value="rapido">Rápido</option>
                  </select>
                </div>

                <div className="app-field" style={{ width: 120 }}>
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
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="ui-row" style={{ alignItems: "flex-start" }}>
                <div className="app-field" style={{ flex: 1 }}>
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
                    disabled={disabled}
                  />
                </div>

                <div className="app-field" style={{ flex: 1 }}>
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
                    disabled={disabled}
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
                  disabled={disabled}
                />
                <small className="app-help">
                  El tipo se añade dentro de las notas porque el backend actual no tiene
                  un campo específico para ello.
                </small>
              </div>

              <div className="ui-row ui-row--end">
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
                  disabled={disabled || !form.meeting_point.trim()}
                >
                  {saving ? "Guardando…" : "Crear evento"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetupCalendar({ meetups = [], me }) {
  const toast = useToast();
  const { token } = useAuth();
  const { groups, loadGroups } = useGroups(token, toast);

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => localDayKey(today));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [localMeetups, setLocalMeetups] = useState([]);

  useEffect(() => {
    if (!token) return;
    loadGroups();
  }, [loadGroups, token]);

  const allMeetups = useMemo(() => {
    return [...(Array.isArray(meetups) ? meetups : []), ...localMeetups];
  }, [localMeetups, meetups]);

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const byDay = useMemo(() => groupByDay(allMeetups), [allMeetups]);

  const monthIndex = month.getMonth();
  const todayKey = localDayKey(today);
  const selectedItems = selectedDay ? byDay.get(selectedDay) || [] : [];
  const joinedGroups = (Array.isArray(groups) ? groups : []).filter((group) => !!group?.my_role);

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
      const created = await apiCreateMeetup(payload.group_id, payload, token);
      const selectedGroup = joinedGroups.find((group) => Number(group.id) === Number(payload.group_id));

      const normalizedCreated = {
        id: created?.id ?? `tmp-${Date.now()}`,
        starts_at: payload.starts_at,
        meeting_point: payload.meeting_point,
        notes: payload.notes,
        level_tag: payload.level_tag,
        pace_min: payload.pace_min,
        pace_max: payload.pace_max,
        capacity: payload.capacity,
        group_id: payload.group_id,
        group_name: selectedGroup?.name || created?.group_name || "",
        participants_count: created?.participants_count ?? 1,
        created_by: me?.id ?? null,
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
        <div className="calendarMini__header">
          <div className="calendarMini__heading">
            <p className="app-kicker">Calendario</p>
            <h3 className="calendarMini__title">{monthLabel(month)}</h3>
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
                  isSelected ? "calendarMini__day--selected" : "",
                  isToday ? "calendarMini__day--today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  setSelectedDay(key);
                  setShowCreateModal(true);
                }}
                title={`${key} · ${daySummary(items)}`}
                aria-label={`Día ${key}${items.length ? `, ${items.length} actividades` : ""}`}
              >
                <span className="calendarMini__dayNumber">{day.getDate()}</span>

                <span className="calendarMini__dots" aria-hidden="true">
                  {items.slice(0, 3).map((meetup) => (
                    <span
                      key={meetup.id}
                      className={`calendarMini__dot calendarMini__dot--${dotKind(meetup, me?.id)}`}
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
              <p className="app-kicker">Agenda</p>
              <h4 className="calendarMini__detailTitle">
                {selectedDay ? selectedDay : "Selecciona un día"}
              </h4>
            </div>

            {selectedDay ? (
              <button
                type="button"
                className="calendarMini__textBtn"
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
              No hay actividades ese día. Puedes crear una nueva.
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
                    {meetup.group_name ? <span>{meetup.group_name}</span> : null}
                    {meetup.level_tag ? <span>{meetup.level_tag}</span> : null}
                    {meetup.pace_min || meetup.pace_max ? (
                      <span>
                        ritmo {meetup.pace_min ? `${meetup.pace_min}s/km` : "?"}–{meetup.pace_max ? `${meetup.pace_max}s/km` : "?"}
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

      <CreateEventModal
        open={showCreateModal}
        dayKey={selectedDay}
        joinedGroups={joinedGroups}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        saving={savingEvent}
      />
    </>
  );
}
