import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  timeLabel,
} from "../utils/dates";
import "../styles/blablarun.css";

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

function DayEventCard({ event }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const notesText = String(event?.notes || "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  const imageSrc = eventImageSrc(event);

  return (
    <article className={`discoverEventFlipCard${isFlipped ? " is-flipped" : ""}`}>
      <div className="discoverEventFlipCard__inner">
        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--front">
          <div className="discoverEventFlipCard__mediaWrap">
            <button
              type="button"
              className={`discoverEventFlipCard__mediaButton${
                !imageSrc ? " discoverEventFlipCard__mediaButton--placeholder" : ""
              }`}
              onClick={() => setIsFlipped(true)}
              aria-label={`Ver detalles de ${event.meeting_point || "evento"}`}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={event.meeting_point || "Evento"}
                  className="discoverEventFlipCard__image"
                />
              ) : (
                <span className="discoverEventFlipCard__placeholderTitle">
                  {event.meeting_point || "Evento"}
                </span>
              )}
            </button>
          </div>

          <div className="discoverEventFlipCard__frontBody">
            <h3 className="discoverEventFlipCard__title">
              {event.meeting_point || "Evento"}
            </h3>
          </div>
        </div>

        <div className="discoverEventFlipCard__face discoverEventFlipCard__face--back">
          <div className="discoverEventFlipCard__backHead">
            <h3 className="discoverEventFlipCard__title discoverEventFlipCard__title--back">
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

export default function BlaBlaRunPage() {
  const { items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(localDayKey(new Date()));

  const upcomingItems = useMemo(
    () =>
      (items || []).filter(
        (item) => item?.starts_at && isSameOrAfterToday(item.starts_at)
      ),
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
    <section className="page page--eventsHome blablaRunPage">
      <section className="sectionBlock discoverSection discoverSection--calendarOnly">
        <div className="discoverCalendarHeader">
          <div className="discoverCalendarHeader__copy">
            <h1 className="discoverCalendarHeader__title">Calendario de Eventos</h1>
          </div>

          <div className="discoverMonthControls">
            <button type="button" className="discoverMonthBtn" onClick={goPrevMonth}>
              ←
            </button>

            <div className="discoverMonthLabel">{formatMonthYear(month)}</div>

            <button type="button" className="discoverMonthBtn" onClick={goNextMonth}>
              →
            </button>
          </div>
        </div>

        {error ? (
          <div className="discoverCalendarCard discoverCalendarCard--loading">
            <p className="discoverLoading">Error cargando datos</p>
          </div>
        ) : loading ? (
          <div className="discoverCalendarCard discoverCalendarCard--loading">
            <p className="discoverLoading">Cargando calendario…</p>
          </div>
        ) : (
          <>
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
                      onClick={() => handleSelectDay(key)}
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

            <section className="discoverSelectedDay">
              <div className="discoverSelectedDay__head">
                <div>
                  <div className="discoverSelectedDay__title">
                    {formatSelectedDay(selectedDay)}
                  </div>
                </div>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="discoverEmptyText">No hay eventos este día</div>
              ) : (
                <div
                  className={`discoverEventList discoverEventList--day${
                    selectedEvents.length > 1 ? " discoverEventList--dayGrid" : ""
                  }`}
                >
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
