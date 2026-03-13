import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  localDayKey,
  monthLabel,
  timeLabel,
  addMonths,
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

export default function MeetupCalendar({
  meetups = [],
  me,
  onAdd = () => {},
}) {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => localDayKey(today));

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const byDay = useMemo(() => groupByDay(meetups), [meetups]);

  const monthIndex = month.getMonth();
  const todayKey = localDayKey(today);
  const selectedItems = selectedDay ? byDay.get(selectedDay) || [] : [];

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

  return (
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

          <button
            type="button"
            className="calendarMini__addBtn"
            onClick={onAdd}
            aria-label="Añadir actividad"
            title="Añadir actividad"
          >
            +
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
              onClick={() => setSelectedDay(key)}
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
              className="calendarMini__clearBtn"
              onClick={() => setSelectedDay(null)}
            >
              Limpiar
            </button>
          ) : null}
        </div>

        {!selectedDay ? (
          <div className="calendarMini__empty">
            Selecciona un día para ver el detalle.
          </div>
        ) : selectedItems.length === 0 ? (
          <div className="calendarMini__empty">No hay actividades ese día.</div>
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
  );
}
