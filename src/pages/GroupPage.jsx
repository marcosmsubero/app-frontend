import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import MeetupCard from "../components/MeetupCard";

function toLocalDatetimeValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

export default function GroupPage() {
  const { groupId } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();

  const gid = useMemo(() => Number(groupId), [groupId]);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [allMeetups, setAllMeetups] = useState([]);
  const [err, setErr] = useState("");

  const [busyCreate, setBusyCreate] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [busyJoin, setBusyJoin] = useState(false);

  // ✅ Form controlado (permite escribir siempre)
  const [startsAt, setStartsAt] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [capacity, setCapacity] = useState("");

  async function loadAll() {
    if (!token || !gid) return;
    setErr("");
    setLoading(true);

    try {
      const g = await api(`/groups/${gid}`, { token });
      setGroup(g);

      let all = [];
      try {
        const resAll = await api(`/groups/${gid}/meetups`, { token });
        all = Array.isArray(resAll) ? resAll : resAll?.items || [];
      } catch {
        all = [];
      }
      setAllMeetups(all);

      // Tu backend no necesita scope=upcoming (y puede que ni exista)
      // así que lo calculamos de forma segura desde "all"
      const now = Date.now();
      const up = all
        .filter((m) => {
          const t = new Date(m.starts_at).getTime();
          if (!Number.isFinite(t)) return false;
          const status = m.status || "open";
          return t >= now && status !== "cancelled" && status !== "done";
        })
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

      setUpcoming(up);
    } catch (e) {
      setErr(e?.message || "Error cargando el grupo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, gid]);

  async function handleDeleteGroup() {
    if (!token || !gid) return;
    const ok = confirm("¿Eliminar este grupo? Esta acción no se puede deshacer.");
    if (!ok) return;

    setBusyDelete(true);
    setErr("");

    try {
      await api(`/groups/${gid}`, { method: "DELETE", token });
      nav("/groups");
    } catch (e) {
      setErr(e?.message || "No se pudo eliminar el grupo");
    } finally {
      setBusyDelete(false);
    }
  }

  async function handleCreateMeetup(e) {
    e.preventDefault();
    if (!token || !gid) return;

    if (!startsAt) return alert("Selecciona fecha y hora");
    if (!meetingPoint.trim()) return alert("Indica punto de encuentro");

    const startsISO = new Date(startsAt).toISOString();

    const payload = {
      starts_at: startsISO,
      meeting_point: meetingPoint.trim(),
      notes: notes.trim() ? notes.trim() : null,
      capacity: capacity === "" ? null : Number(capacity),
    };

    setBusyCreate(true);
    setErr("");

    try {
      await api(`/groups/${gid}/meetups`, { method: "POST", token, body: payload });

      // ✅ reset solo tras éxito (no borra mientras escribes)
      setStartsAt("");
      setMeetingPoint("");
      setNotes("");
      setCapacity("");

      await loadAll();
    } catch (e2) {
      setErr(e2?.message || "No se pudo crear la quedada");
    } finally {
      setBusyCreate(false);
    }
  }

  // ✅ NUEVO: unirse / salir de quedada (opcional, no automático)
  async function handleJoinMeetup(meetupId) {
    if (!token || !meetupId) return;
    setBusyJoin(true);
    setErr("");
    try {
      await api(`/meetups/${meetupId}/join`, { method: "POST", token });
      await loadAll();
    } catch (e) {
      setErr(e?.message || "No se pudo unir a la quedada");
    } finally {
      setBusyJoin(false);
    }
  }

  async function handleLeaveMeetup(meetupId) {
    if (!token || !meetupId) return;
    setBusyJoin(true);
    setErr("");
    try {
      await api(`/meetups/${meetupId}/leave`, { method: "POST", token });
      await loadAll();
    } catch (e) {
      setErr(e?.message || "No se pudo salir de la quedada");
    } finally {
      setBusyJoin(false);
    }
  }

  if (loading) {
    return (
      <div className="stack" style={{ padding: 16 }}>
        <p className="muted">Cargando grupo…</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="m0">{group?.name || `Grupo #${gid}`}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Gestiona quedadas y miembros desde aquí.
          </p>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button onClick={() => nav(-1)}>← Volver</button>
          <button title="Eliminar grupo" onClick={handleDeleteGroup} disabled={busyDelete}>
            🗑️ Eliminar grupo
          </button>
        </div>
      </div>

      {err ? (
        <div className="card" style={{ border: "1px solid #f99" }}>
          <p className="muted" style={{ margin: 0 }}>{err}</p>
        </div>
      ) : null}

      <div className="card">
        <h3 className="m0">Crear quedada</h3>

        <form onSubmit={handleCreateMeetup} className="stack" style={{ gap: 10, marginTop: 10 }}>
          <label className="small-muted">Fecha y hora</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            min={toLocalDatetimeValue(new Date())}
          />

          <label className="small-muted">Punto de encuentro</label>
          <input
            value={meetingPoint}
            onChange={(e) => setMeetingPoint(e.target.value)}
            placeholder="Ej. Plaza del Pilar"
          />

          <label className="small-muted">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles, qué llevar, etc."
            rows={4}
          />

          <label className="small-muted">Aforo (opcional)</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
            placeholder="Ej. 10"
          />

          <button type="submit" disabled={busyCreate}>
            {busyCreate ? "Creando…" : "Crear quedada"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="m0">Próximas quedadas</h3>
        <div style={{ marginTop: 10 }}>
          {upcoming.length === 0 ? (
            <p className="muted">No hay próximas quedadas</p>
          ) : (
            <div className="stack">
              {upcoming.map((m) => (
                <MeetupCard
                  key={`up-${m.id}`}
                  meetup={m}
                  isAuthed={!!token}
                  onJoin={() => handleJoinMeetup(m.id)}
                  onLeave={() => handleLeaveMeetup(m.id)}
                />
              ))}
              {busyJoin ? <p className="muted">Actualizando…</p> : null}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="m0">Todas las quedadas</h3>
        <div style={{ marginTop: 10 }}>
          {allMeetups.length === 0 ? (
            <p className="muted">No hay quedadas aún</p>
          ) : (
            <div className="stack">
              {allMeetups.map((m) => (
                <MeetupCard
                  key={m.id}
                  meetup={m}
                  isAuthed={!!token}
                  onJoin={() => handleJoinMeetup(m.id)}
                  onLeave={() => handleLeaveMeetup(m.id)}
                />
              ))}
              {busyJoin ? <p className="muted">Actualizando…</p> : null}
            </div>
          )}
        </div>
      </div>

      {/* Mantengo tu listado simple por si lo usabas para depurar */}
      <div className="card" style={{ opacity: 0.85 }}>
        <h3 className="m0">Debug (texto)</h3>
        <div style={{ marginTop: 10 }}>
          {allMeetups.length === 0 ? (
            <p className="muted">—</p>
          ) : (
            <ul>
              {allMeetups.map((m) => (
                <li key={`dbg-${m.id}`}>
                  <b>{fmtDateTime(m.starts_at)}</b> · 📍 {m.meeting_point}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}