import { useMemo, useState } from "react";
import { buildMonthGrid, localDayKey, monthLabel, timeLabel, addMonths } from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function groupByDay(meetups = []) {
  const map = new Map();

  for (const m of meetups) {
    const k = localDayKey(m.starts_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(m);
  }

  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    map.set(k, arr);
  }

  return map;
}

function dotKind(m, myUserId) {
  if (m.created_by === myUserId) return "own";
  if (m.is_joined) return "joined";
  return "other";
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
    <section className="pc-card" aria-label="Calendario de actividades">
      <div className="pc-head">
        <div className="pc-headCopy">
          <div className="pc-title">Calendario</div>
          <div className="pc-sub">{monthLabel(month)}</div>
        </div>

        <div className="pc-actions">
          <button
            className="pc-icon"
            type="button"
            onClick={goPrevMonth}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <button
            className="pc-icon"
            type="button"
            onClick={goNextMonth}
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            →
          </button>
          <button
            className="pc-icon pc-icon--text"
            type="button"
            onClick={goToday}
            title="Ir a hoy"
            aria-label="Ir a hoy"
          >
            Hoy
          </button>
          <button
            className="pc-icon pc-plus"
            type="button"
            onClick={onAdd}
            title="Añadir actividad"
            aria-label="Añadir actividad"
          >
            +
          </button>
        </div>
      </div>

      <div className="pc-week" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pc-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="pc-grid">
        {days.map((d) => {
          const inMonth = d.getMonth() === monthIndex;
          const key = localDayKey(d);
          const items = byDay.get(key) || [];
          const isSelected = selectedDay === key;
          const isToday = key === todayKey;

          return (
            <button
              key={`${key}-${inMonth ? "in" : "out"}`}
              type="button"
              className={`pc-day ${inMonth ? "" : "dim"} ${isSelected ? "sel" : ""} ${isToday ? "today" : ""}`}
              onClick={() => setSelectedDay(key)}
              title={key}
              aria-label={`Día ${key}${items.length ? `, ${items.length} actividades` : ""}`}
            >
              <div className="pc-daynum">{d.getDate()}</div>

              <div className="pc-dots" aria-hidden="true">
                {items.slice(0, 3).map((m) => (
                  <span
                    key={m.id}
                    className={`pc-dot ${dotKind(m, me?.id)}`}
                    title={`${timeLabel(m.starts_at)} · ${m.meeting_point || "Quedada"}`}
                  />
                ))}
                {items.length > 3 ? (
                  <span className="pc-dot more" title={`+${items.length - 3}`} />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pc-detail">
        <div className="pc-detail-head">
          <div>
            <div className="pc-detail-kicker">Agenda</div>
            <div className="pc-detail-title">{selectedDay ? `Día ${selectedDay}` : "Selecciona un día"}</div>
          </div>

          {selectedDay ? (
            <button className="pc-link" type="button" onClick={() => setSelectedDay(null)}>
              Limpiar
            </button>
          ) : null}
        </div>

        {!selectedDay ? (
          <div className="pc-empty">Selecciona un día para ver el detalle.</div>
        ) : selectedItems.length === 0 ? (
          <div className="pc-empty">No hay actividades ese día.</div>
        ) : (
          <div className="pc-list">
            {selectedItems.map((m) => (
              <div key={m.id} className="pc-item">
                <div className="pc-item-top">
                  <div className="pc-item-title">{m.meeting_point || "Quedada"}</div>
                  <div className="pc-item-time">{timeLabel(m.starts_at)}</div>
                </div>

                <div className="pc-item-meta">
                  {m.group_name ? <span>👥 {m.group_name}</span> : null}
                  {m.level_tag ? <span>· {m.level_tag}</span> : null}
                  {m.pace_min || m.pace_max ? (
                    <span>
                      · ritmo {m.pace_min ? `${m.pace_min}s/km` : "?"}–{m.pace_max ? `${m.pace_max}s/km` : "?"}
                    </span>
                  ) : null}
                  <span>· inscritos {m.participants_count ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}