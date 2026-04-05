import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/blablarun.css";
import "../styles/create-event.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  apiCreateMyMeetup,
  apiGetMeetup,
  apiUpdateMyMeetup,
} from "../services/api";
import { uploadEventImageToSupabase } from "../services/storage";
import { localDayKey } from "../utils/dates";
import { searchPlaces } from "../utils/location";

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

function eventDisplayTitle(event = {}, fallback = "") {
  return event?.title || event?.meeting_point || fallback || "Evento";
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
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const placeLookupSeq = useRef(0);

  const editId = useMemo(() => {
    const raw = searchParams.get("edit");
    return raw ? Number(raw) : null;
  }, [searchParams]);

  const [selectedDay, setSelectedDay] = useState(() => {
    const raw = searchParams.get("day");
    return raw || localDayKey(new Date());
  });

  const [saving, setSaving] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [placeResults, setPlaceResults] = useState([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [selectedPlaceMeta, setSelectedPlaceMeta] = useState(null);
  const [form, setForm] = useState({
    title: "",
    event_type: "entrenamiento",
    meeting_point: "",
    time: "19:00",
    visibility: "public",
    notes: "",
    external_links: [],
    latitude: null,
    longitude: null,
    location_source: null,
    image_url: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadEventForEdit() {
      if (!editId || !token) return;

      setLoadingEvent(true);

      try {
        const meetup = await apiGetMeetup(editId, token);
        if (cancelled) return;

        const startsAt = meetup?.starts_at ? new Date(meetup.starts_at) : null;
        const dayKey = startsAt ? localDayKey(startsAt) : selectedDay;
        const hh = startsAt ? String(startsAt.getHours()).padStart(2, "0") : "19";
        const mm = startsAt ? String(startsAt.getMinutes()).padStart(2, "0") : "00";

        setSelectedDay(dayKey);
        setPosterPreview(String(meetup?.image_url || meetup?.poster_url || ""));
        setSelectedPlaceMeta(
          meetup?.latitude && meetup?.longitude
            ? {
                latitude: Number(meetup.latitude),
                longitude: Number(meetup.longitude),
                label: meetup?.meeting_point || meetup?.title || "",
              }
            : null
        );
        setForm((prev) => ({
          ...prev,
          title: eventDisplayTitle(meetup, ""),
          event_type: meetup?.event_type || "entrenamiento",
          meeting_point: meetup?.meeting_point || "",
          time: `${hh}:${mm}`,
          visibility: meetup?.visibility || "public",
          notes: meetup?.notes || "",
          external_links: Array.isArray(meetup?.external_links) ? meetup.external_links : [],
          latitude:
            meetup?.latitude === null || meetup?.latitude === undefined
              ? null
              : Number(meetup.latitude),
          longitude:
            meetup?.longitude === null || meetup?.longitude === undefined
              ? null
              : Number(meetup.longitude),
          location_source: meetup?.location_source || null,
          image_url: meetup?.image_url || meetup?.poster_url || "",
        }));
      } catch (error) {
        if (!cancelled) {
          toast?.error?.(error?.message || "No se pudo cargar el evento para editar.");
        }
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    }

    loadEventForEdit();

    return () => {
      cancelled = true;
    };
  }, [editId, selectedDay, toast, token]);

  useEffect(() => {
    const query = form.meeting_point.trim();
    if (query.length < 3) {
      setPlaceResults([]);
      setPlaceLoading(false);
      return;
    }

    const currentSeq = ++placeLookupSeq.current;
    setPlaceLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        if (currentSeq !== placeLookupSeq.current) return;
        setPlaceResults(results);
        setPlaceOpen(true);
      } catch {
        if (currentSeq !== placeLookupSeq.current) return;
        setPlaceResults([]);
      } finally {
        if (currentSeq === placeLookupSeq.current) {
          setPlaceLoading(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.meeting_point]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleMeetingPointChange(value) {
    setSelectedPlaceMeta(null);
    setForm((prev) => ({
      ...prev,
      meeting_point: value,
      latitude: null,
      longitude: null,
      location_source: null,
    }));
  }

  function selectPlace(place) {
    setSelectedPlaceMeta(place);
    setPlaceOpen(false);
    setPlaceResults([]);
    setForm((prev) => ({
      ...prev,
      title: prev.title || place.label,
      meeting_point: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      location_source: "search",
    }));
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
      const nextPreview = String(reader.result || "");
      setPosterPreview(nextPreview);
      setForm((prev) => ({ ...prev, image_url: nextPreview }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanMeetingPoint = form.meeting_point.trim();
    const cleanTitle = form.title.trim() || cleanMeetingPoint;

    if (!cleanMeetingPoint) {
      toast?.error?.("Escribe y selecciona un lugar para el evento.");
      return;
    }

    setSaving(true);

    try {
      const cleanLinks = form.external_links
        .map((item) => ({
          title: String(item?.title || "").trim(),
          url: String(item?.url || "").trim(),
        }))
        .filter((item) => item.title || item.url);

      let imageUrl = form.image_url || "";

      if (posterFile) {
        const ownerId = user?.id || null;
        if (!ownerId) {
          throw new Error("No se pudo identificar al usuario para subir la imagen.");
        }

        const { publicUrl } = await uploadEventImageToSupabase(
          posterFile,
          ownerId,
          editId || selectedDay || "draft"
        );
        imageUrl = publicUrl;
      }

      const payload = {
        starts_at: buildStartsAt(selectedDay, form.time),
        title: cleanTitle,
        meeting_point: cleanMeetingPoint,
        notes: form.notes.trim() || null,
        visibility: form.visibility,
        event_type: form.event_type,
        external_links: cleanLinks,
        image_url: imageUrl || null,
        latitude:
          form.latitude === null || form.latitude === undefined
            ? null
            : Number(form.latitude),
        longitude:
          form.longitude === null || form.longitude === undefined
            ? null
            : Number(form.longitude),
        location_source: form.location_source || null,
      };

      if (editId) {
        await apiUpdateMyMeetup(editId, payload, token);
        toast?.success?.("Evento actualizado correctamente.");
      } else {
        await apiCreateMyMeetup(payload, token);
        toast?.success?.("Evento creado correctamente.");
      }

      navigate("/perfil");
    } catch (error) {
      toast?.error?.(error?.message || `No se pudo ${editId ? "actualizar" : "crear"} el evento.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page page--eventsHome blablaRunPage createEventPage">
      <section className="sectionBlock createEventHero">
        <h1 className="createEventHero__title">
          {editId ? "Editar evento" : "Nuevo evento"}
        </h1>
        <div className="createEventHero__date">{formatDayLabel(selectedDay)}</div>
      </section>

      <section className="sectionBlock createEventFormCard">
        {loadingEvent ? (
          <div className="createEventLoadingState">Cargando evento…</div>
        ) : (
          <form className="createEventForm" onSubmit={handleSubmit}>
            <div className="createEventSection">
              <div className="createEventSection__title">Información principal</div>

              <div className="createEventForm__group">
                <label className="app-label" htmlFor="create-event-title">
                  Nombre del evento
                </label>
                <input
                  id="create-event-title"
                  className="app-input createEventForm__control"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Ej. Running Sunset Club"
                  disabled={saving}
                />
              </div>

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

              <div className="createEventForm__group createEventLocationGroup">
                <label className="app-label" htmlFor="create-event-meeting-point">
                  Lugar del evento
                </label>

                <div className="createEventAutocomplete">
                  <input
                    id="create-event-meeting-point"
                    className="app-input createEventForm__control"
                    value={form.meeting_point}
                    onChange={(event) => handleMeetingPointChange(event.target.value)}
                    placeholder="Escribe una calle, zona o dirección"
                    disabled={saving}
                    autoComplete="off"
                    onFocus={() => setPlaceOpen(Boolean(placeResults.length))}
                    onBlur={() => {
                      window.setTimeout(() => setPlaceOpen(false), 140);
                    }}
                  />

                  {placeOpen && (placeLoading || placeResults.length > 0) ? (
                    <div className="createEventAutocomplete__menu">
                      {placeLoading ? (
                        <div className="createEventAutocomplete__status">Buscando dirección…</div>
                      ) : (
                        placeResults.map((place) => (
                          <button
                            key={`${place.label}-${place.latitude}-${place.longitude}`}
                            type="button"
                            className="createEventAutocomplete__item"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectPlace(place)}
                          >
                            {place.label}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="createEventForm__hint">
                  Escribe la ubicación y selecciona una de las direcciones sugeridas.
                </p>

                {selectedPlaceMeta ? (
                  <div className="createEventSelectedPlace">
                    Dirección confirmada: {selectedPlaceMeta.label}
                  </div>
                ) : null}
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
                    <span>{posterPreview ? "Cambiar imagen" : "Subir imagen"}</span>
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
                          {posterFile?.name || "Imagen del evento"}
                        </span>
                        <button
                          type="button"
                          className="createEventInlineRemove"
                          onClick={() => {
                            setPosterFile(null);
                            setPosterPreview("");
                            setForm((prev) => ({ ...prev, image_url: "" }));
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
                {saving ? (editId ? "Guardando..." : "Creando...") : editId ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
