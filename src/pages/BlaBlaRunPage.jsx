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
  const m = paceStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  return Number(m[1]) * 60 + Number(m[2]);
}

function secondsToPace(sec) {
  if (!sec) return "";
  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, "0");
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

export default function BlaBlaRunPage() {

  const { token } = useAuth();
  const toast = useToast();
  const { joinMeetup, leaveMeetup } = useMeetups(token, toast);

  const [mode,setMode] = useState("train");

  const {filters,items,loading,error,run} =
    useMeetupSearch(DEFAULT_FILTERS);

  const refreshTimer = useRef(null);

  useEffect(()=>{
    const unsub = on("meetup_changed",()=>{
      if(refreshTimer.current) clearTimeout(refreshTimer.current)

      refreshTimer.current = setTimeout(()=>{
        run()
      },250)
    })

    return ()=>unsub?.()
  },[run])

  function switchMode(next){
    setMode(next)
    run(DEFAULT_FILTERS)
  }

  async function handleJoin(m){
    await joinMeetup(m.id)
    await run()
  }

  async function handleLeave(m){
    await leaveMeetup(m.id)
    await run()
  }

  return(
    <div className="page">

      <div className="stack explore-shell">

        <div className="row explore-head">

          <div className="stack">
            <h2 className="m0">Explorar</h2>
            <p className="muted m0">
              Encuentra quedadas deportivas cerca de ti.
            </p>
          </div>

          <Link className="link-btn" to="/">
            ← Inicio
          </Link>

        </div>

        <section className="card stack">

          <div>
            <span className="badge">BlaBlaRun</span>
            <h3 className="m0" style={{marginTop:10}}>
              ¿Qué quieres hacer?
            </h3>
          </div>

          <div className="explore-mode-grid">

            <button
              className={`explore-mode-card ${mode==="train"?"active":""}`}
              onClick={()=>switchMode("train")}
            >
              <div className="explore-mode-icon">🏃</div>
              <div className="explore-mode-title">Entrenar</div>
              <div className="small-muted">
                Busca compañeros para entrenar
              </div>
            </button>

            <button
              className={`explore-mode-card ${mode==="travel"?"active":""}`}
              onClick={()=>switchMode("travel")}
            >
              <div className="explore-mode-icon">🚗</div>
              <div className="explore-mode-title">Viajar</div>
              <div className="small-muted">
                Comparte viaje para carreras
              </div>
            </button>

          </div>

        </section>

        <section className="card stack">

          <div className="row" style={{justifyContent:"space-between"}}>
            <h3 className="m0">
              {mode==="train"
                ? "Filtros entrenamiento"
                : "Filtros viaje"}
            </h3>

            <div className="explore-pill">
              {loading ? "Buscando…" : `${items.length} resultados`}
            </div>
          </div>

          <div className="explore-grid explore-grid--trainTop">

            <label className="explore-field">
              <span className="explore-label">Buscar</span>

              <input
                className="input-wide"
                value={filters.q}
                placeholder="Lugar o entrenamiento"
                onChange={e=>run({q:e.target.value,offset:0})}
              />
            </label>

            <label className="explore-field">
              <span className="explore-label">Nivel</span>

              <select
                value={filters.level}
                onChange={e=>run({level:e.target.value})}
              >
                <option value="">Todos</option>
                <option value="suave">Suave</option>
                <option value="medio">Medio</option>
                <option value="rapido">Rápido</option>
              </select>
            </label>

            <label className="explore-toggle">

              <input
                type="checkbox"
                checked={filters.only_open}
                onChange={e=>run({only_open:e.target.checked})}
              />

              <span className="explore-toggleText">
                <strong>Solo abiertas</strong>
                <small>Mostrar solo quedadas activas</small>
              </span>

            </label>

          </div>

          <div className="explore-actions">

            <button
              className="btn-primary"
              onClick={()=>run({offset:0})}
            >
              Buscar
            </button>

            <button
              className="btn-danger"
              onClick={()=>run(DEFAULT_FILTERS)}
            >
              Limpiar
            </button>

          </div>

          {error && <p className="muted">{error}</p>}

        </section>

        <section className="stack">

          {items.map(m=>(

            <div key={m.id} className="stack">

              {m.group_name && (
                <div className="explore-groupChip">
                  Grupo: <b>{m.group_name}</b>
                </div>
              )}

              <MeetupCard
                meetup={m}
                isAuthed={!!token}
                onJoin={token?()=>handleJoin(m):null}
                onLeave={token?()=>handleLeave(m):null}
              />

            </div>

          ))}

        </section>

      </div>

    </div>
  )
}