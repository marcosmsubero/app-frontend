import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import { EmptyState } from "../components/ui";
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

function formatEventDateLabel(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DayEventCard({ event }) {
  const notesText = String(event?.notes || "").replace(/^\[[^\]]+\]\s*/, "").trim();

  return (
    <article className="discoverEventCard discoverEventCard--agenda">
      <div className="discoverEventCard__top">
        <div className="discoverEventCard__date">
          <span className="discoverEventCard__time">{formatEventDateLabel(event.starts_at)}</span>
        </div>

        <button
          type="button"
          className="discoverEventCard__fav"
          aria-label="Guardar en favoritos"
        >
          ♥
        </button>
      </div>

      <div className="discoverEventCard__body">
        <div className="discoverEventCard__main">
          <h3 className="discoverEventCard__title">
            {event.meeting_point || "Evento"}
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
          <span className="discoverEventCard__hostInline">
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
    </article>
  );
}

export default function BlaBlaRunPage() {
  const { items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(localDayKey(new Date()));

  const upcomingItems = useMemo(
    () => (items || []).filter((item) => item?.starts_at && isSameOrAfterToday(item.starts_at)),
    [items]
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

  function handleSelectDay(dayKey) {
    setSelectedDay(dayKey);
  }

  return (
    <section className="page page--eventsHome">
      <section className="sectionBlock discoverSection discoverSection--calendarOnly">
        <div className="discoverCalendarHeader">
          <div className="discoverCalendarHeader__copy">
            <div className="discoverCalendarHeader__eyebrow">Agenda</div>
            <h1 className="discoverCalendarHeader__title">Calendario de Eventos</h1>
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

            <div className="discoverMonthLabel">{monthLabel(month)}</div>

            <button
              type="button"
              className="discoverMonthBtn"
              onClick={goNextMonth}
              aria-label="Mes siguiente"
            >
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
          <>
            <div className="discoverCalendarCard discoverCalendarCard--premium">
              <div className="discoverWeekdays" aria-hidden="true">
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
                      key={`${key}-${inMonth ? "in" : "out"}`}
                      type="button"
                      onClick={() => handleSelectDay(key)}
                      className={`discoverDayCell discoverDayCell--compact${
                        !inMonth ? " is-outside" : ""
                      }${dayItems.length > 0 ? " has-events" : ""}${
                        isToday ? " is-today" : ""
                      }${isSelected ? " is-selected" : ""}`}
                      title={`${key} · ${daySummary(dayItems)}`}
                    >
                      <span className="discoverDayCell__date">{day.getDate()}</span>
                      <span className="discoverDayCell__marker" />
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="discoverSelectedDay">
              <div className="discoverSelectedDay__head">
                <div>
                  <div className="discoverSelectedDay__title">{formatDayTitle(selectedDay)}</div>
                  <div className="discoverSelectedDay__subtitle">
                    {daySummary(selectedEvents)}
                  </div>
                </div>
              </div>

              {selectedEvents.length === 0 ? (
                <EmptyState
                  icon="○"
                  title="No hay eventos este día"
                  description="Selecciona otro día para ver su actividad."
                />
              ) : (
                <div className="discoverEventList discoverEventList--day">
                  {selectedEvents.map((event) => (
                    <DayEventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </section>
  );
}
