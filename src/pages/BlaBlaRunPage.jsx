import { useMemo, useState } from "react";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  monthLabel,
  timeLabel,
} from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const DEFAULT_FILTERS = {
  q: "",
  level: "",
  from: "",
  to: "",
  pace_min: "",
  pace_max: "",
  only_open: true,
  limit: 100,
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

function DayModal({ open, dayKey, events, onClose }) {
  if (!open) return null;

  return (
    <div
      className="ui-modalBackdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blablarun-day-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(640px, 100%)" }}
      >
        <div style={{ padding: 22, display: "grid", gap: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              <p className="page__eyebrow" style={{ margin: 0 }}>
                BlaBlaRun
              </p>
              <h2 id="blablarun-day-title" style={{ margin: "4px 0 0" }}>
                {formatDayTitle(dayKey)}
              </h2>
              <p style={{ margin: "8px 0 0", color: "var(--app-text-muted)" }}>
                {daySummary(events)}
              </p>
            </div>

            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>

          {events.length === 0 ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No hay eventos este día</strong>
                <p>Cuando exista actividad para esta fecha, aparecerá aquí.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {events.map((event) => (
                <article
                  key={event.id}
                  className="app-card"
                  style={{ background: "rgba(255,255,255,0.62)" }}
                >
                  <div className="app-card__body" style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <h4 style={{ margin: 0 }}>
                        {event.meeting_point || event.title || "Evento"}
                      </h4>
                      <span className="app-chip app-chip--soft">
                        {timeLabel(event.starts_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        color: "var(--app-text-muted)",
                        fontSize: "var(--font-sm)",
                      }}
                    >
                      {event.group_name ? <span>{event.group_name}</span> : null}
                      {event.level_tag ? <span>• {event.level_tag}</span> : null}
                      {typeof event.participants_count === "number" ? (
                        <span>• {event.participants_count} inscritos</span>
                      ) : null}
                    </div>

                    {event.notes ? (
                      <p style={{ margin: 0, color: "var(--app-text-muted)" }}>
                        {event.notes}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlaBlaRunPage() {
  const { items, loading, error } = useMeetupSearch(DEFAULT_FILTERS);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthIndex = month.getMonth();
  const todayKey = localDayKey(new Date());

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(selectedDay) || [];
  }, [byDay, selectedDay]);

  const visibleDaysWithActivity = useMemo(() => {
    return [...byDay.keys()].length;
  }, [byDay]);

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
    setModalOpen(true);
  }

  return (
    <>
      <section className="page">
        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 18 }}>
            <div className="page__header" style={{ marginBottom: 0 }}>
              <span className="page__eyebrow">BlaBlaRun</span>
              <h1 className="page__title">Calendario de eventos</h1>
              <p className="page__subtitle">
                Explora la actividad del mes y consulta los eventos de cualquier día.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <h2 style={{ margin: 0 }}>{monthLabel(month)}</h2>
                <p style={{ margin: 0, color: "var(--app-text-muted)" }}>
                  {visibleDaysWithActivity} días con actividad visible
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
                  {WEEKDAYS.map((weekday) => (
                    <div
                      key={weekday}
                      style={{
                        textAlign: "center",
                        fontSize: "var(--font-sm)",
                        color: "var(--app-text-muted)",
                        fontWeight: 700,
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
                            ? "1px solid rgba(15,23,42,0.24)"
                            : "1px solid rgba(148,163,184,0.18)",
                          background: "rgba(255,255,255,0.62)",
                          padding: 10,
                          textAlign: "left",
                          display: "grid",
                          alignContent: "space-between",
                          opacity: inMonth ? 1 : 0.48,
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--app-text)",
                          }}
                        >
                          {day.getDate()}
                        </span>

                        <div style={{ display: "grid", gap: 6 }}>
                          <span
                            style={{
                              display: "flex",
                              gap: 5,
                              flexWrap: "wrap",
                              minHeight: 10,
                            }}
                          >
                            {dayItems.slice(0, 3).map((event) => (
                              <span
                                key={event.id}
                                title={event.meeting_point || "Evento"}
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "var(--app-text-muted)",
                                  display: "inline-block",
                                }}
                              />
                            ))}
                          </span>

                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--app-text-muted)",
                              lineHeight: 1.2,
                            }}
                          >
                            {dayItems.length ? `${dayItems.length} evento${dayItems.length > 1 ? "s" : ""}` : ""}
                          </span>
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
        open={modalOpen}
        dayKey={selectedDay}
        events={selectedEvents}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
