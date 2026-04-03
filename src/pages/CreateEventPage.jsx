import { useMemo, useRef, useState } from "react";
import "../styles/blablarun.css";
import "../styles/create-event.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiCreateMyMeetup } from "../services/api";
import { localDayKey } from "../utils/dates";

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
    0
  );

  return date.toISOString();
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDayLabel(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
  const formatted = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${formatted}`;
}

const EVENT_TYPES = [
  { value: "entrenamiento", label: "Entrenamiento" },
  { value: "carrera", label: "Carrera" },
  { value: "quedada", label: "Quedada" },
  { value: "vibe", label: "Vibe" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Público" },
  { value: "private", label: "Privado" },
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const selectedDay = useMemo(() => {
    const raw = searchParams.get("day");
    return raw || localDayKey(new Date());
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [form, setForm] = useState({
    event_type: "entrenamiento",
    meeting_point: "",
    time: "19:00",
    visibility: "public",
    notes: "",
    external_links: [""],
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLink(index, value) {
    setForm((prev) => {
      const nextLinks = [...prev.external_links];
      nextLinks[index] = value;
      return { ...prev, external_links: nextLinks };
    });
  }

  function addLinkField() {
    setForm((prev) => ({
      ...prev,
      external_links: [...prev.external_links, ""],
    }));
  }

  function removeLinkField(index) {
    setForm((prev) => {
      const nextLinks = prev.external_links.filter((_, i) => i !== index);
      return {
        ...prev,
        external_links: nextLinks.length ? nextLinks : [""],
      };
    });
  }

  function handlePosterChange(event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setPosterFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPosterPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.meeting_point.trim()) {
      toast?.error?.("Añade un punto de encuentro.");
      return;
    }

    setSaving(true);

    try {
      const cleanLinks = form.external_links
        .map((item) => item.trim())
        .filter(Boolean);

      const notesParts = [];
      if (form.notes.trim()) notesParts.push(form.notes.trim());
      if (cleanLinks.length) {
        notesParts.push("");
        notesParts.push("Enlaces:");
        cleanLinks.forEach((link) => notesParts.push(link));
      }
      if (posterFile?.name) {
        notesParts.push("");
        notesParts.push(`Imagen adjunta: ${posterFile.name}`);
      }

      await apiCreateMyMeetup(
        {
          starts_at: buildStartsAt(selectedDay, form.time),
          title: form.meeting_point.trim(),
          meeting_point: form.meeting_point.trim(),
          notes: notesParts.join("\n"),
          visibility: form.visibility,
          event_type: form.event_type,
          capacity: numberOrNull(null),
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
      <section className="sectionBlock createEventHero">
        <div className="createEventHero__eyebrow">Nuevo evento</div>
        <h1 className="createEventHero__title">Nuevo evento</h1>
        <p className="createEventHero__subtitle">
          Crea una propuesta clara para entrenar, correr o compartir plan con tu comunidad.
        </p>
        <div className="createEventHero__date">{formatDayLabel(selectedDay)}</div>
      </section>

      <section className="sectionBlock createEventFormCard">
        <form className="createEventForm" onSubmit={handleSubmit}>
          <div className="createEventForm__group">
            <label className="app-label" htmlFor="create-event-type">
              Tipo de evento
            </label>
            <select
              id="create-event-type"
              className="app-select createEventForm__control"
              value={form.event_type}
              onChange={(event) => updateField("event_type", event.target.value)}
              disabled={saving}
            >
              {EVENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="createEventForm__group">
            <label className="app-label" htmlFor="create-event-meeting-point">
              Punto de encuentro
            </label>
            <input
              id="create-event-meeting-point"
              className="app-input createEventForm__control"
              value={form.meeting_point}
              onChange={(event) => updateField("meeting_point", event.target.value)}
              placeholder="Ej. Salida desde el paseo marítimo"
              disabled={saving}
            />
          </div>

          <div className="createEventForm__grid">
            <div className="createEventForm__group">
              <label className="app-label" htmlFor="create-event-time">
                Hora
              </label>
              <input
                id="create-event-time"
                className="app-input createEventForm__control"
                type="time"
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                disabled={saving}
              />
            </div>

            <div className="createEventForm__group">
              <label className="app-label" htmlFor="create-event-visibility">
                Visibilidad
              </label>
              <select
                id="create-event-visibility"
                className="app-select createEventForm__control"
                value={form.visibility}
                onChange={(event) => updateField("visibility", event.target.value)}
                disabled={saving}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="createEventForm__group">
            <label className="app-label" htmlFor="create-event-notes">
              Notas
            </label>
            <textarea
              id="create-event-notes"
              className="app-textarea createEventForm__control createEventForm__textarea"
              rows={5}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Describe el plan, recorrido, ambiente o cualquier detalle útil."
              disabled={saving}
            />
          </div>

          <div className="createEventForm__group">
            <div className="createEventForm__groupHead">
              <label className="app-label">Imagen opcional</label>
              <button
                type="button"
                className="createEventSecondaryBtn"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                Subir foto
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePosterChange}
              style={{ display: "none" }}
            />

            <div className="createEventUploadBox">
              {posterPreview ? (
                <div className="createEventUploadPreview">
                  <img src={posterPreview} alt="Vista previa" className="createEventUploadPreview__image" />
                  <div className="createEventUploadPreview__meta">
                    <span className="createEventUploadPreview__name">
                      {posterFile?.name || "Imagen seleccionada"}
                    </span>
                    <button
                      type="button"
                      className="createEventInlineRemove"
                      onClick={() => {
                        setPosterFile(null);
                        setPosterPreview("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="createEventUploadEmpty">
                  Sube opcionalmente el cartel de una carrera o una imagen del evento.
                </div>
              )}
            </div>
          </div>

          <div className="createEventForm__group">
            <div className="createEventForm__groupHead">
              <label className="app-label">Enlaces</label>
              <button
                type="button"
                className="createEventSecondaryBtn"
                onClick={addLinkField}
                disabled={saving}
              >
                Añadir enlace
              </button>
            </div>

            <div className="createEventLinksList">
              {form.external_links.map((link, index) => (
                <div key={index} className="createEventLinkRow">
                  <input
                    className="app-input createEventForm__control"
                    value={link}
                    onChange={(event) => updateLink(index, event.target.value)}
                    placeholder="https://..."
                    disabled={saving}
                  />

                  {form.external_links.length > 1 ? (
                    <button
                      type="button"
                      className="createEventInlineRemove"
                      onClick={() => removeLinkField(index)}
                      disabled={saving}
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="createEventActions">
            <button
              type="submit"
              className="app-button app-button--primary createEventSubmitBtn"
              disabled={saving}
            >
              {saving ? "Creando..." : "Crear evento"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
