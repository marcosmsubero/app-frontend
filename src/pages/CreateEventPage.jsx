import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/blablarun.css";
import "../styles/create-event.css";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiCreateMyMeetup } from "../services/api";
import { localDayKey } from "../utils/dates";

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildStartsAt(dayKey, timeValue) {
  const [year, month, day] = String(dayKey).split("-").map(Number);
  const [hours, minutes] = String(timeValue || "19:00").split(":").map(Number);

  const date = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );

  return date.toISOString();
}

function formatDayLabel(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const selectedDay = useMemo(() => {
    const raw = searchParams.get("day");
    if (!raw) return localDayKey(new Date());
    return raw;
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    event_type: "entrenamiento",
    time: "19:00",
    meeting_point: "",
    notes: "",
    level_tag: "",
    pace_min: "",
    pace_max: "",
    capacity: "",
    visibility: "public",
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.meeting_point.trim()) {
      toast?.error?.("Añade un punto de encuentro.");
      return;
    }

    setSaving(true);

    try {
      const notesParts = [];
      if (form.event_type) notesParts.push(`Tipo: ${form.event_type}`);
      if (form.notes.trim()) notesParts.push(form.notes.trim());

      await apiCreateMyMeetup(
        {
          starts_at: buildStartsAt(selectedDay, form.time),
          title: form.meeting_point.trim(),
          meeting_point: form.meeting_point.trim(),
          notes: notesParts.join("\n"),
          level_tag: form.level_tag || null,
          pace_min: numberOrNull(form.pace_min),
          pace_max: numberOrNull(form.pace_max),
          capacity: numberOrNull(form.capacity),
          visibility: form.visibility,
        },
        token
      );

      toast?.success?.("Evento creado correctamente.");
      navigate("/perfil");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo crear el evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page page--eventsHome blablaRunPage createEventPage">
      <div className="createEventPage__topbar">
        <Link to="/perfil" className="createEventPage__back">
          ← Volver
        </Link>
      </div>

      <section className="sectionBlock activityHero createEventHero">
        <div className="activityHero__copy">
          <p className="activityHero__eyebrow">Nuevo evento</p>
          <h1 className="activityHero__title">Crear actividad</h1>
          <p className="activityHero__subtitle">
            Programa una nueva quedada para el {formatDayLabel(selectedDay)}.
          </p>
        </div>
      </section>

      <section className="sectionBlock activitySection createEventFormCard">
        <form className="createEventForm" onSubmit={handleSubmit}>
          <div className="createEventForm__grid createEventForm__grid--2">
            <div className="app-field">
              <label className="app-label" htmlFor="create-event-type">
                Tipo
              </label>
              <select
                id="create-event-type"
                className="app-select"
                value={form.event_type}
                onChange={(event) => updateField("event_type", event.target.value)}
                disabled={saving}
              >
                <option value="entrenamiento">Entrenamiento</option>
                <option value="rodaje">Rodaje</option>
                <option value="serie">Series</option>
                <option value="tirada_larga">Tirada larga</option>
                <option value="carrera">Carrera</option>
                <option value="social">Social</option>
              </select>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-event-time">
                Hora
              </label>
              <input
                id="create-event-time"
                className="app-input"
                type="time"
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="create-event-location">
              Punto de encuentro
            </label>
            <input
              id="create-event-location"
              className="app-input"
              value={form.meeting_point}
              onChange={(event) => updateField("meeting_point", event.target.value)}
              placeholder="Ej. Parque de las Llamas, pista, salida de carrera..."
              disabled={saving}
            />
          </div>

          <div className="createEventForm__grid createEventForm__grid--2">
            <div className="app-field">
              <label className="app-label" htmlFor="create-event-level">
                Nivel
              </label>
              <select
                id="create-event-level"
                className="app-select"
                value={form.level_tag}
                onChange={(event) => updateField("level_tag", event.target.value)}
                disabled={saving}
              >
                <option value="">Sin especificar</option>
                <option value="suave">Suave</option>
                <option value="medio">Medio</option>
                <option value="rapido">Rápido</option>
              </select>
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-event-capacity">
                Aforo
              </label>
              <input
                id="create-event-capacity"
                className="app-input"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(event) => updateField("capacity", event.target.value)}
                placeholder="10"
                disabled={saving}
              />
            </div>
          </div>

          <div className="createEventForm__grid createEventForm__grid--2">
            <div className="app-field">
              <label className="app-label" htmlFor="create-event-pace-min">
                Ritmo mín. (seg/km)
              </label>
              <input
                id="create-event-pace-min"
                className="app-input"
                type="number"
                min="1"
                value={form.pace_min}
                onChange={(event) => updateField("pace_min", event.target.value)}
                placeholder="300"
                disabled={saving}
              />
            </div>

            <div className="app-field">
              <label className="app-label" htmlFor="create-event-pace-max">
                Ritmo máx. (seg/km)
              </label>
              <input
                id="create-event-pace-max"
                className="app-input"
                type="number"
                min="1"
                value={form.pace_max}
                onChange={(event) => updateField("pace_max", event.target.value)}
                placeholder="360"
                disabled={saving}
              />
            </div>
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="create-event-visibility">
              Visibilidad
            </label>
            <select
              id="create-event-visibility"
              className="app-select"
              value={form.visibility}
              onChange={(event) => updateField("visibility", event.target.value)}
              disabled={saving}
            >
              <option value="public">Público</option>
              <option value="private">Privado</option>
            </select>
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="create-event-notes">
              Notas
            </label>
            <textarea
              id="create-event-notes"
              className="app-textarea"
              rows={5}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Añade detalles del plan, ritmo, recorrido o cualquier indicación."
              disabled={saving}
            />
          </div>

          <div className="createEventForm__actions">
            <Link to="/perfil" className="app-button app-button--secondary">
              Cancelar
            </Link>

            <button
              type="submit"
              className="app-button app-button--primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear evento"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
