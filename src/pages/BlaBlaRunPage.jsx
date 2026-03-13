import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import MeetupCard from "../components/MeetupCard";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useMeetups } from "../hooks/useMeetups";
import { on } from "../utils/events";

function paceToSeconds(paceStr) {
  if (!paceStr) return "";
  const match = String(paceStr).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  return Number(match[1]) * 60 + Number(match[2]);
}

function secondsToPace(sec) {
  if (sec === "" || sec === null || sec === undefined) return "";
  const value = Number(sec);
  if (!Number.isFinite(value) || value <= 0) return "";
  const mm = Math.floor(value / 60);
  const ss = String(value % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const DEFAULT_FILTERS = {
  q: "",
  level: "",
  from: "",
  to: "",
  pace_min: "",
  pace_max: "",
  only_open: true,
  limit: 30,
  offset: 0,
};

function ModeCard({ active, icon, title, text, onClick }) {
  return (
    <button
      type="button"
      className={`mode-card${active ? " mode-card--active" : ""}`}
      onClick={onClick}
    >
      <div className="mode-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="mode-card__title">{title}</div>
      <div className="mode-card__text">{text}</div>
    </button>
  );
}

export default function BlaBlaRunPage() {
  const { token, isAuthed } = useAuth();
  const toast = useToast();
  const { joinMeetup, leaveMeetup } = useMeetups(token, toast);

  const [mode, setMode] = useState("train");

  const { filters, items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);

  const refreshTimer = useRef(null);

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

  function switchMode(next) {
    setMode(next);
    run(DEFAULT_FILTERS);
  }

  async function handleJoin(meetup) {
    await joinMeetup(meetup.id);
    await run();
  }

  async function handleLeave(meetup) {
    await leaveMeetup(meetup.id);
    await run();
  }

  function updateFilter(key, value) {
    run({ [key]: value, offset: 0 });
  }

  const paceMinValue = secondsToPace(filters.pace_min);
  const paceMaxValue = secondsToPace(filters.pace_max);

  return (
    <section className="page">
      <div className="page__hero glass-banner">
        <div className="glass-banner__body">
          <div className="page__header">
            <span className="page__eyebrow">Explorar</span>
            <h1 className="page__title">Encuentra quedadas deportivas cerca de ti</h1>
            <p className="page__subtitle">
              Descubre entrenamientos, planes compartidos y actividad abierta en tu zona.
            </p>
          </div>

          <div className="split-actions">
            <Link to="/" className="app-btn app-btn--secondary">
              Volver a inicio
            </Link>
            {!isAuthed ? (
              <Link to="/login" className="app-btn app-btn--primary">
                Iniciar sesión para explorar
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="page__columns">
        <div className="app-stack app-stack--lg">
          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">Modo de exploración</div>
                  <div className="app-section-header__subtitle">
                    Cambia entre búsqueda de entrenamiento y búsqueda de viaje.
                  </div>
                </div>
                <div className="app-badge app-badge--primary">BlaBlaRun</div>
              </div>
            </div>

            <div className="app-card__body">
              <div className="mode-card-grid">
                <ModeCard
                  active={mode === "train"}
                  icon="🏃"
                  title="Entrenar"
                  text="Busca compañeros para salir a entrenar."
                  onClick={() => switchMode("train")}
                />
                <ModeCard
                  active={mode === "travel"}
                  icon="🚗"
                  title="Viajar"
                  text="Comparte trayectos y planes para carreras."
                  onClick={() => switchMode("travel")}
                />
              </div>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">
                    {mode === "train" ? "Filtros de entrenamiento" : "Filtros de viaje"}
                  </div>
                  <div className="app-section-header__subtitle">
                    Ajusta búsqueda, nivel, estado y ritmo para afinar resultados.
                  </div>
                </div>
                <div className="app-badge app-badge--neutral">
                  {loading ? "Buscando…" : `${items.length} resultados`}
                </div>
              </div>
            </div>

            <div className="app-card__body app-stack">
              <div className="form-grid form-grid--2">
                <div className="app-field">
                  <label className="app-label" htmlFor="meetup-search">
                    Buscar
                  </label>
                  <input
                    id="meetup-search"
                    className="app-input"
                    value={filters.q}
                    placeholder="Lugar, grupo o punto de encuentro"
                    onChange={(e) => updateFilter("q", e.target.value)}
                  />
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="meetup-level">
                    Nivel
                  </label>
                  <select
                    id="meetup-level"
                    className="app-select"
                    value={filters.level}
                    onChange={(e) => updateFilter("level", e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="suave">Suave</option>
                    <option value="medio">Medio</option>
                    <option value="rapido">Rápido</option>
                  </select>
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="meetup-pace-min">
                    Ritmo mínimo
                  </label>
                  <input
                    id="meetup-pace-min"
                    className="app-input"
                    placeholder="Ej. 05:30"
                    value={paceMinValue}
                    onChange={(e) => updateFilter("pace_min", paceToSeconds(e.target.value))}
                  />
                  <div className="app-field__hint">Formato recomendado: mm:ss</div>
                </div>

                <div className="app-field">
                  <label className="app-label" htmlFor="meetup-pace-max">
                    Ritmo máximo
                  </label>
                  <input
                    id="meetup-pace-max"
                    className="app-input"
                    placeholder="Ej. 04:30"
                    value={paceMaxValue}
                    onChange={(e) => updateFilter("pace_max", paceToSeconds(e.target.value))}
                  />
                  <div className="app-field__hint">Formato recomendado: mm:ss</div>
                </div>
              </div>

              <label className="app-checkbox" htmlFor="only-open-meetups">
                <input
                  id="only-open-meetups"
                  type="checkbox"
                  checked={!!filters.only_open}
                  onChange={(e) => updateFilter("only_open", e.target.checked)}
                />
                <span>Mostrar solo quedadas abiertas</span>
              </label>

              <div className="split-actions">
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  onClick={() => run({ offset: 0 })}
                >
                  Buscar
                </button>

                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() => run(DEFAULT_FILTERS)}
                >
                  Limpiar filtros
                </button>
              </div>

              {error ? (
                <div className="app-badge app-badge--danger">{error}</div>
              ) : null}
            </div>
          </div>

          <div className="app-stack">
            {items.length === 0 && !loading ? (
              <div className="app-empty-state">
                <div className="app-empty-state__title">No hay resultados por ahora</div>
                <div className="app-empty-state__text">
                  Ajusta los filtros o prueba con otra búsqueda para descubrir nuevas quedadas.
                </div>
              </div>
            ) : null}

            {items.map((meetup) => (
              <div key={meetup.id} className="app-stack app-stack--sm">
                {meetup.group_name ? (
                  <div className="group-chip-row">
                    <span className="app-chip app-chip--active">{meetup.group_name}</span>
                  </div>
                ) : null}

                <MeetupCard
                  meetup={meetup}
                  isAuthed={isAuthed}
                  onJoin={token ? () => handleJoin(meetup) : null}
                  onLeave={token ? () => handleLeave(meetup) : null}
                />
              </div>
            ))}
          </div>
        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Cómo funciona</div>
              <p className="app-text-soft">
                Explorar te permite localizar quedadas activas, ver cupos, conocer el ritmo
                esperado y unirte en segundos.
              </p>

              <div className="app-list">
                <div className="app-list-item">
                  <div className="app-badge app-badge--primary">1</div>
                  <div>
                    <strong>Filtra por intención</strong>
                    <div className="app-text-soft">
                      Entrenamiento o viaje compartido según el tipo de plan.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--success">2</div>
                  <div>
                    <strong>Revisa disponibilidad</strong>
                    <div className="app-text-soft">
                      Comprueba estado, aforo y participantes antes de unirte.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--warning">3</div>
                  <div>
                    <strong>Únete y coordina</strong>
                    <div className="app-text-soft">
                      Accede a mensajes y a la agenda para no perder el plan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
