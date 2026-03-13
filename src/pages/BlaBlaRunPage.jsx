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

function ModeCard({ active, title, text, onClick }) {
  return (
    <button
      type="button"
      className={`explorePage__modeCard${active ? " explorePage__modeCard--active" : ""}`}
      onClick={onClick}
    >
      <strong className="explorePage__modeTitle">{title}</strong>
      <span className="explorePage__modeText">{text}</span>
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
    <section className="explorePage">
      <div className="explorePage__hero app-section">
        <div className="explorePage__heroCopy">
          <span className="app-kicker">Explorar</span>
          <h1 className="explorePage__title">Encuentra actividad deportiva cerca de ti</h1>
          <p className="explorePage__subtitle">
            Descubre quedadas, entrenamientos y planes compartidos con una experiencia más limpia y directa.
          </p>
        </div>

        <div className="explorePage__heroActions">
          <Link to="/" className="app-button app-button--secondary">
            Volver
          </Link>

          {!isAuthed ? (
            <Link to="/login" className="app-button app-button--primary">
              Iniciar sesión
            </Link>
          ) : null}
        </div>
      </div>

      <div className="explorePage__layout">
        <div className="explorePage__main">
          <section className="explorePage__panel app-section">
            <div className="explorePage__panelHead">
              <div>
                <p className="app-kicker">Modo</p>
                <h2 className="app-title">Cómo quieres explorar</h2>
                <p className="app-subtitle">
                  Cambia entre búsqueda de entrenamiento y búsqueda de viaje.
                </p>
              </div>

            </div>

            <div className="explorePage__modeGrid">
              <ModeCard
                active={mode === "train"}
                title="Entrenar"
                text="Buscar compañeros para salir a entrenar."
                onClick={() => switchMode("train")}
              />
              <ModeCard
                active={mode === "travel"}
                title="Viajar"
                text="Compartir trayectos y planes para carreras."
                onClick={() => switchMode("travel")}
              />
            </div>
          </section>

          <section className="explorePage__panel app-section">
            <div className="explorePage__panelHead">
              <div>
                <p className="app-kicker">Filtros</p>
                <h2 className="app-title">
                  {mode === "train" ? "Entrenamiento" : "Viaje"}
                </h2>
                <p className="app-subtitle">
                  Ajusta búsqueda, nivel y ritmo para afinar resultados.
                </p>
              </div>

              <span className="app-badge">
                {loading ? "Buscando…" : `${items.length} resultados`}
              </span>
            </div>

            <div className="explorePage__filters">
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
                  placeholder="05:30"
                  value={paceMinValue}
                  onChange={(e) => updateFilter("pace_min", paceToSeconds(e.target.value))}
                />
              </div>

              <div className="app-field">
                <label className="app-label" htmlFor="meetup-pace-max">
                  Ritmo máximo
                </label>
                <input
                  id="meetup-pace-max"
                  className="app-input"
                  placeholder="04:30"
                  value={paceMaxValue}
                  onChange={(e) => updateFilter("pace_max", paceToSeconds(e.target.value))}
                />
              </div>
            </div>

            <label className="explorePage__checkbox" htmlFor="only-open-meetups">
              <input
                id="only-open-meetups"
                type="checkbox"
                checked={!!filters.only_open}
                onChange={(e) => updateFilter("only_open", e.target.checked)}
              />
              <span>Mostrar solo quedadas abiertas</span>
            </label>

            <div className="explorePage__actions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => run({ offset: 0 })}
              >
                Buscar
              </button>

              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => run(DEFAULT_FILTERS)}
              >
                Limpiar
              </button>
            </div>

            {error ? <div className="explorePage__error">{error}</div> : null}
          </section>

          <section className="explorePage__results">
            {items.length === 0 && !loading ? (
              <div className="app-empty">
                No hay resultados con esos filtros.
              </div>
            ) : null}

            {items.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                isAuthed={isAuthed}
                onJoin={token ? () => handleJoin(meetup) : null}
                onLeave={token ? () => handleLeave(meetup) : null}
              />
            ))}
          </section>
        </div>

        <aside className="explorePage__aside">
          <section className="explorePage__asideCard app-section">
            <div className="explorePage__panelHead">
              <div>
                <p className="app-kicker">Cómo funciona</p>
                <h2 className="app-title">Explorar sin ruido</h2>
                <p className="app-subtitle">
                  Filtra, compara y únete a una quedada en pocos pasos.
                </p>
              </div>
            </div>

            <div className="explorePage__asideList">
              <div className="explorePage__asideItem">
                <span className="app-badge app-badge--primary">1</span>
                <p>Filtra por intención, nivel y ritmo.</p>
              </div>

              <div className="explorePage__asideItem">
                <span className="app-badge app-badge--success">2</span>
                <p>Revisa cupos, estado y detalle de la actividad.</p>
              </div>

              <div className="explorePage__asideItem">
                <span className="app-badge app-badge--warning">3</span>
                <p>Únete y continúa la coordinación desde el grupo.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
