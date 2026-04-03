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

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16.5v1.5A2 2 0 0 1 18 20H6a2 2 0 0 1-2-2v-1.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
    </svg>
  );
}

function MapsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
        fill="#EA4335"
      />
      <circle cx="12" cy="9" r="3" fill="#4285F4" />
    </svg>
  );
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;

  const date = new Date(2026, 0, 1, hours, Number(minutes));
  const label = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { value, label };
});

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
    external_links: [],
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addLinkField() {
    setForm((prev) => ({
      ...prev,
      external_links: [...prev.external_links, { title: "", url: "" }],
    }));
  }

  function updateLink(index, field, value) {
    setForm((prev) => {
      const nextLinks = [...prev.external_links];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return { ...prev, external_links: nextLinks };
    });
  }

  function removeLinkField(index) {
    setForm((prev) => ({
      ...prev,
      external_links: prev.external_links.filter((_, i) => i !== index),
    }));
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

  function handleMapsSearch() {
    const query = form.meeting_point.trim();
    const url = query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : "https://www.google.com/maps";

    window.open(url, "_blank", "noopener,noreferrer");
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
        .map((item) => ({
          title: item.title.trim(),
          url: item.url.trim(),
        }))
        .filter((item) => item.title || item.url);

      const notesParts = [];
      if (form.notes.trim()) notesParts.push(form.notes.trim());

      if (cleanLinks.length) {
        notesParts.push("");
        notesParts.push("Enlaces:");
        cleanLinks.forEach((item) => {
          if (item.title && item.url) {
            notesParts.push(`${item.title}: ${item.url}`);
          } else if (item.title) {
            notesParts.push(item.title);
          } else if (item.url) {
            notesParts.push(item.url);
          }
        });
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
        <h1 className="createEventHero__title">Nuevo evento</h1>
        <div className="createEventHero__date">{formatDayLabel(selectedDay)}</div>
      </section>

      <section className="sectionBlock createEventFormCard">
        <form className="createEventForm" onSubmit={handleSubmit}>
          <div className="createEventSection">
            <div className="createEventSection__title">Información principal</div>

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

              <div className="createEventPlaceRow">
                <input
                  id="create-event-meeting-point"
                  className="app-input createEventForm__control"
                  value={form.meeting_point}
                  onChange={(event) => updateField("meeting_point", event.target.value)}
                  placeholder="Ej. Salida desde el paseo marítimo"
                  disabled={saving}
                />

                <button
                  type="button"
                  className="createEventIconBtn"
                  onClick={handleMapsSearch}
                  disabled={saving}
                  aria-label="Abrir Google Maps"
                  title="Abrir Google Maps"
                >
                  <MapsIcon />
                </button>
              </div>
            </div>

            <div className="createEventForm__grid">
              <div className="createEventForm__group">
                <label className="app-label">Hora</label>

                <div
                  className="createEventTimeScroller"
                  role="listbox"
                  aria-label="Seleccionar hora"
                >
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`createEventTimeChip${form.time === option.value ? " is-active" : ""}`}
                      onClick={() => updateField("time", option.value)}
                      disabled={saving}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
          </div>

          <div className="createEventSection">
            <div className="createEventSection__title">Contenido adicional</div>

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
                <label className="app-label">Imagen</label>
                <button
                  type="button"
                  className="createEventActionBtn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <UploadIcon />
                  <span>Subir imagen</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                style={{ display: "none" }}
              />

              {posterPreview ? (
                <div className="createEventUploadBox">
                  <div className="createEventUploadPreview">
                    <img
                      src={posterPreview}
                      alt="Vista previa"
                      className="createEventUploadPreview__image"
                    />
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
                </div>
              ) : null}
            </div>

            <div className="createEventForm__group">
              <div className="createEventForm__groupHead">
                <label className="app-label">Enlaces</label>
                <button
                  type="button"
                  className="createEventActionBtn"
                  onClick={addLinkField}
                  disabled={saving}
                >
                  <LinkIcon />
                  <span>Añadir enlace</span>
                </button>
              </div>

              {form.external_links.length > 0 ? (
                <>
                  <div className="createEventLinksEditor">
                    {form.external_links.map((link, index) => (
                      <div key={index} className="createEventLinksEditor__row">
                        <input
                          className="app-input createEventForm__control"
                          value={link.title}
                          onChange={(event) => updateLink(index, "title", event.target.value)}
                          placeholder="Título del enlace"
                          disabled={saving}
                        />

                        <input
                          className="app-input createEventForm__control"
                          value={link.url}
                          onChange={(event) => updateLink(index, "url", event.target.value)}
                          placeholder="https://..."
                          disabled={saving}
                        />

                        <button
                          type="button"
                          className="createEventInlineRemove"
                          onClick={() => removeLinkField(index)}
                          disabled={saving}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="createEventLinksSummary">
                    {form.external_links
                      .filter((item) => item.title.trim() || item.url.trim())
                      .map((item, index) => (
                        <div
                          key={`${item.title}-${item.url}-${index}`}
                          className="createEventLinksSummary__item"
                        >
                          <span className="createEventLinksSummary__title">
                            {item.title.trim() || "Enlace"}:
                          </span>
                          <span className="createEventLinksSummary__url">
                            {item.url.trim() || "Sin URL"}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              ) : null}
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
