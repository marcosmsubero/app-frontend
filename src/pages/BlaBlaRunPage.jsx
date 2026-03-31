import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function creatorLabel(event) {
  return event?.creator_profile_name || event?.group_name || "Perfil";
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

function EventCard({ event }) {
  return (
    <article className="app-card blablarunPage__eventCard">
      <div className="app-card__body blablarunPage__eventCardBody">
        <div className="blablarunPage__eventTop">
          <h4 className="blablarunPage__eventTitle">
            {event.meeting_point || event.title || "Evento"}
          </h4>

          <span className="app-chip app-chip--soft">{timeLabel(event.starts_at)}</span>
        </div>

        <div className="blablarunPage__eventMeta">
          <span>
            Creador: <CreatorLink event={event} />
          </span>

          {event.level_tag ? <span>• Nivel: {event.level_tag}</span> : null}

          {typeof event.participants_count === "number" ? (
            <span>• {event.participants_count} inscritos</span>
          ) : null}

          {typeof event.capacity === "number" && event.capacity > 0 ? (
            <span>• Aforo: {event.capacity}</span>
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

function DayModal({ open, dayKey, events, onClose }) {
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
    setModalOpen(true);
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
                Explora la actividad del mes y consulta el detalle de cada evento.
              </p>
            </div>

            <div className="blablarunPage__toolbar">
              <div className="blablarunPage__toolbarCopy">
                <h2 className="blablarunPage__monthTitle">{monthLabel(month)}</h2>
                <p className="blablarunPage__monthMeta">
                  {visibleDaysWithActivity} días con actividad visible
                </p>
              </div>

              <div className="blablarunPage__toolbarActions">
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
        open={modalOpen}
        dayKey={selectedDay}
        events={selectedEvents}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
