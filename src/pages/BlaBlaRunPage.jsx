import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import MeetupCard from "../components/MeetupCard";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMeetups } from "../hooks/useMeetups";
import { on } from "../utils/events";
import {
  addMonths,
  buildMonthGrid,
  localDayKey,
  monthLabel,
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

function formatDayTitle(dayKey) {
  if (!dayKey) return "Selecciona un día";

  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function smallMetric(value, label) {
  return (
    <div
      className="app-card"
      style={{
        minHeight: 92,
        background: "rgba(255,255,255,0.62)",
      }}
    >
      <div
        className="app-card__body"
        style={{
          display: "grid",
          gap: 4,
          alignContent: "center",
        }}
      >
        <strong style={{ fontSize: "1.8rem", lineHeight: 1 }}>{value}</strong>
        <span style={{ color: "var(--app-text-muted)" }}>{label}</span>
      </div>
    </div>
  );
}

export default function BlaBlaRunPage() {
  const { token, isAuthed, me } = useAuth();
  const toast = useToast();
  const { joinMeetup, leaveMeetup } = useMeetups(token, toast);

  const { filters, items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);

  const refreshTimer = useRef(null);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => localDayKey(new Date()));

  useEffect(() => {
    const unsub = on("meetup_changed", () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        run();
      }, 250);
    });

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      unsub?.();
    };
  }, [run]);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthIndex = month.getMonth();
  const todayKey = localDayKey(new Date());
  const selectedItems = selectedDay ? byDay.get(selectedDay) || [] : [];

  const joinedCount = useMemo(
    () => items.filter((item) => item?.is_joined).length,
    [items]
  );

  const upcomingCount = useMemo(() => items.length, [items]);

  const visibleDaysWithActivity = useMemo(() => {
    return [...byDay.keys()].length;
  }, [byDay]);

  useEffect(() => {
    if (selectedDay) return;

    const firstWithActivity = items[0]?.starts_at ? localDayKey(items[0].starts_at) : todayKey;
    setSelectedDay(firstWithActivity);
  }, [items, selectedDay, todayKey]);

  function updateFilter(key, value) {
    run({ [key]: value, offset: 0 });
  }

  function resetFilters() {
    run(DEFAULT_FILTERS);
  }

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

  async function handleJoin(meetup) {
    await joinMeetup(meetup.id);
    await run();
  }

  async function handleLeave(meetup) {
    await leaveMeetup(meetup.id);
    await run();
  }

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 18 }}>
          <div className="page__header" style={{ marginBottom: 0 }}>
            <span className="page__eyebrow">BlaBlaRun</span>
            <h1 className="page__title">Agenda runner</h1>
            <p className="page__subtitle">
              Consulta entrenamientos, quedadas y actividad próxima en formato calendario.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {smallMetric(upcomingCount, "actividades visibles")}
            {smallMetric(visibleDaysWithActivity, "días con actividad")}
            {smallMetric(joinedCount, "actividades a las que te has unido")}
          </div>

          {!isAuthed ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>Necesitas iniciar sesión</strong>
                <p>Accede para consultar la agenda y apuntarte a actividades.</p>
                <Link to="/login" className="app-button app-button--primary">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(180px, 0.8fr) auto auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label" htmlFor="blablarun-search">
                Buscar actividad
              </label>
              <input
                id="blablarun-search"
                className="app-input"
                value={filters.q}
                placeholder="Lugar, grupo o punto de encuentro"
                onChange={(e) => updateFilter("q", e.target.value)}
                disabled={!isAuthed}
              />
            </div>

            <div className="app-field" style={{ marginBottom: 0 }}>
              <label className="app-label" htmlFor="blablarun-level">
                Nivel
              </label>
              <select
                id="blablarun-level"
                className="app-select"
                value={filters.level}
                onChange={(e) => updateFilter("level", e.target.value)}
                disabled={!isAuthed}
              >
                <option value="">Todos</option>
                <option value="suave">Suave</option>
                <option value="medio">Medio</option>
                <option value="rapido">Rápido</option>
              </select>
            </div>

            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={resetFilters}
              disabled={!isAuthed}
            >
              Limpiar
            </button>

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                fontWeight: 600,
                whiteSpace: "nowrap",
                height: 44,
              }}
            >
              <input
                type="checkbox"
                checked={!!filters.only_open}
                onChange={(e) => updateFilter("only_open", e.target.checked)}
                disabled={!isAuthed}
              />
              Solo abiertas
            </label>
          </div>

          {error ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No se pudo cargar la agenda</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <span className="page__eyebrow">Calendario</span>
                <h2 style={{ margin: "4px 0 0" }}>{monthLabel(month)}</h2>
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
                const isSelected = selectedDay === key;
                const isToday = key === todayKey;

                return (
                  <button
                    key={`${key}-${inMonth ? "in" : "out"}`}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    title={`${key} · ${daySummary(dayItems)}`}
                    style={{
                      minHeight: 72,
                      borderRadius: 18,
                      border: isSelected
                        ? "1px solid rgba(15,23,42,0.24)"
                        : "1px solid rgba(148,163,184,0.18)",
                      background: isSelected
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.58)",
                      padding: 10,
                      textAlign: "left",
                      display: "grid",
                      alignContent: "space-between",
                      opacity: inMonth ? 1 : 0.48,
                      boxShadow: isToday ? "0 0 0 1px rgba(15,23,42,0.10) inset" : "none",
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

                    <span
                      style={{
                        display: "flex",
                        gap: 5,
                        flexWrap: "wrap",
                        minHeight: 10,
                      }}
                    >
                      {dayItems.slice(0, 3).map((meetup) => (
                        <span
                          key={meetup.id}
                          title={meetup.meeting_point || "Actividad"}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              dotKind(meetup, me?.id) === "own"
                                ? "var(--app-success)"
                                : dotKind(meetup, me?.id) === "joined"
                                ? "var(--app-warning)"
                                : "var(--app-text-muted)",
                            display: "inline-block",
                          }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 16 }}>
            <div>
              <span className="page__eyebrow">Detalle del día</span>
              <h2 style={{ margin: "4px 0 0" }}>{formatDayTitle(selectedDay)}</h2>
              <p style={{ margin: "6px 0 0", color: "var(--app-text-muted)" }}>
                {daySummary(selectedItems)}
              </p>
            </div>

            {loading ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Cargando agenda</strong>
                  <p>Estamos buscando actividad disponible.</p>
                </div>
              </div>
            ) : selectedItems.length === 0 ? (
              <div className="app-empty">
                <div className="notificationsSimple__emptyBody">
                  <strong>Sin actividad en este día</strong>
                  <p>No hay entrenamientos o quedadas que coincidan con tus filtros.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {selectedItems.map((meetup) => (
                  <MeetupCard
                    key={meetup.id}
                    meetup={meetup}
                    isAuthed={isAuthed}
                    onJoin={token ? () => handleJoin(meetup) : null}
                    onLeave={token ? () => handleLeave(meetup) : null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
