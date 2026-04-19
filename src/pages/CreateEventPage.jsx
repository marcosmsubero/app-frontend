import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/events-page.css";
import "../styles/create-event.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  apiCreateMyMeetup,
  apiGetMeetup,
  apiUpdateMyMeetup,
} from "../services/api";
import { AnalyticsEvents } from "../services/analytics";
import { uploadEventImageToSupabase } from "../services/storage";
import { localDayKey } from "../utils/dates";
import {
  buildEventLocationPayload,
  buildManualEventLocationMeta,
  buildPlaceSelectionMeta,
  buildStoredEventLocationMeta,
  searchPlaces,
} from "../utils/location";

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

function isPastDay(dayKey) {
  const today = localDayKey(new Date());
  return dayKey < today;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 16.5v1.5A2 2 0 0 1 18 20H6a2 2 0 0 1-2-2v-1.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
    </svg>
  );
}

/* iOS-style scroll wheel picker */
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/* Distance: 0..100 km in 1 km steps. Elevation: 0..2500 m in 50 m steps.
   Stored + displayed as strings so the wheel can show a blank "—" option
   at index 0 for "not specified". */
const DISTANCE_OPTIONS = ["", ...Array.from({ length: 100 }, (_, i) => String(i + 1))];
const ELEVATION_OPTIONS = ["", ...Array.from({ length: 51 }, (_, i) => String(i * 50))];

function MapPicker({ latitude, longitude, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (!mapOpen || !mapRef.current || mapInstanceRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!window.L || !mapRef.current) return;
      const L = window.L;
      const initLat = latitude || 40.4168;
      const initLng = longitude || -3.7038;
      const initZoom = latitude ? 14 : 6;
      const map = L.map(mapRef.current).setView([initLat, initLng], initZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      if (latitude && longitude) {
        markerRef.current = L.marker([latitude, longitude]).addTo(map);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        onChange(lat, lng);
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapOpen]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    if (latitude && longitude && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], 14);
    } else if (latitude && longitude && !markerRef.current) {
      markerRef.current = window.L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
      mapInstanceRef.current.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude]);

  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <div className="createEventMapPicker">
      <button
        type="button"
        className="createEventMapPicker__toggle"
        onClick={() => setMapOpen(!mapOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        {mapOpen ? "Ocultar mapa" : "Marcar en el mapa"}
      </button>

      {hasCoords ? (
        <div className="createEventMapPicker__coords">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </div>
      ) : null}

      {mapOpen ? (
        <div ref={mapRef} className="createEventMapPicker__map" />
      ) : null}
    </div>
  );
}

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
    const candidate = raw || localDayKey(new Date());
    return isPastDay(candidate) ? localDayKey(new Date()) : candidate;
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
    meeting_point: "",
    hour: "19",
    minute: "00",
    requires_approval: false,
    description: "",
    external_links: [],
    latitude: null,
    longitude: null,
    location_source: null,
    image_url: "",
    distance_km: "",
    elevation_m: "",
    training_type: "",
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
        const rawMin = startsAt ? startsAt.getMinutes() : 0;
        const mm = String(Math.round(rawMin / 5) * 5).padStart(2, "0");
        const existingPlaceMeta = buildStoredEventLocationMeta(meetup);

        setSelectedDay(dayKey);
        setPosterFile(null);
        setPosterPreview(String(meetup?.image_url || meetup?.poster_url || ""));
        setSelectedPlaceMeta(existingPlaceMeta.label ? existingPlaceMeta : null);

        setForm((prev) => ({
          ...prev,
          title: eventDisplayTitle(meetup, ""),
          meeting_point: existingPlaceMeta.label || meetup?.meeting_point || "",
          hour: hh,
          minute: mm === "60" ? "00" : mm,
          requires_approval: Boolean(meetup?.requires_approval),
          description: meetup?.notes || meetup?.description || "",
          external_links: meetup?.external_links && typeof meetup.external_links === "object" && !Array.isArray(meetup.external_links)
            ? Object.entries(meetup.external_links).map(([title, url]) => ({ title, url }))
            : Array.isArray(meetup?.external_links)
            ? meetup.external_links
            : [],
          latitude: existingPlaceMeta.latitude,
          longitude: existingPlaceMeta.longitude,
          location_source: existingPlaceMeta.source || null,
          image_url: meetup?.image_url || meetup?.poster_url || "",
          distance_km: meetup?.distance_km ? String(meetup.distance_km) : "",
          elevation_m: meetup?.elevation_m ? String(meetup.elevation_m) : "",
          training_type: meetup?.training_type || "",
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

    return () => { cancelled = true; };
  }, [editId, selectedDay, toast, token]);

  useEffect(() => {
    const query = form.meeting_point.trim();

    if (selectedPlaceMeta?.label && query === selectedPlaceMeta.label) {
      setPlaceResults([]);
      setPlaceLoading(false);
      return;
    }

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

    return () => { window.clearTimeout(timer); };
  }, [form.meeting_point, selectedPlaceMeta]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleMeetingPointChange(value) {
    const manualMeta = buildManualEventLocationMeta(value);
    setSelectedPlaceMeta(null);
    setForm((prev) => ({
      ...prev,
      meeting_point: value,
      latitude: null,
      longitude: null,
      location_source: manualMeta.label ? manualMeta.source : null,
    }));
  }

  function selectPlace(place) {
    const normalizedPlace = buildPlaceSelectionMeta(place);

    setSelectedPlaceMeta(normalizedPlace);
    setPlaceOpen(false);
    setPlaceResults([]);

    setForm((prev) => ({
      ...prev,
      title: prev.title || normalizedPlace.label,
      meeting_point: normalizedPlace.label,
      latitude: normalizedPlace.latitude,
      longitude: normalizedPlace.longitude,
      location_source: normalizedPlace.source,
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

  function handleDayChange(e) {
    const value = e.target.value;
    if (isPastDay(value)) {
      toast?.error?.("No se pueden crear eventos en el pasado.");
      return;
    }
    setSelectedDay(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanMeetingPoint = form.meeting_point.trim();
    const cleanTitle = form.title.trim() || cleanMeetingPoint;

    if (!cleanMeetingPoint) {
      toast?.error?.("Escribe una ubicación para el evento.");
      return;
    }

    const timeValue = `${form.hour}:${form.minute}`;
    const startsAtIso = buildStartsAt(selectedDay, timeValue);

    if (!editId && new Date(startsAtIso).getTime() < Date.now()) {
      toast?.error?.("No se pueden crear eventos en el pasado.");
      return;
    }

    setSaving(true);

    try {
      const cleanLinksDict = {};
      for (const item of form.external_links) {
        const title = String(item?.title || "").trim();
        const url = String(item?.url || "").trim();
        if (title && url && (url.startsWith("http://") || url.startsWith("https://"))) {
          cleanLinksDict[title] = url;
        }
      }

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

      const locationPayload = buildEventLocationPayload({
        meetingPoint: cleanMeetingPoint,
        selectedPlaceMeta,
      });

      const distKm = form.distance_km !== "" ? Number(form.distance_km) : null;
      const eleM = form.elevation_m !== "" ? Number(form.elevation_m) : null;

      const payload = {
        starts_at: startsAtIso,
        title: cleanTitle,
        notes: form.description.trim() || null,
        visibility: "public",
        requires_approval: form.requires_approval,
        event_type: "quedada",
        external_links: Object.keys(cleanLinksDict).length > 0 ? cleanLinksDict : null,
        image_url: imageUrl || null,
        distance_km: distKm && distKm > 0 ? distKm : null,
        elevation_m: eleM && eleM > 0 ? eleM : null,
        training_type: form.training_type || null,
        ...locationPayload,
      };

      if (editId) {
        await apiUpdateMyMeetup(editId, payload, token);
        toast?.success?.("Evento actualizado correctamente.");
      } else {
        const created = await apiCreateMyMeetup(payload, token);
        AnalyticsEvents.eventCreated?.(created?.id);
        toast?.success?.("Evento creado correctamente.");
      }

      navigate("/perfil");
    } catch (error) {
      toast?.error?.(
        error?.message || `No se pudo ${editId ? "actualizar" : "crear"} el evento.`
      );
    } finally {
      setSaving(false);
    }
  }

  const todayKey = localDayKey(new Date());

  return (
    <section className="page page--eventsHome eventsPage createEventPage">
      <section className="sectionBlock createEventFormCard">
        {loadingEvent ? (
          <div className="createEventLoadingState">Cargando evento…</div>
        ) : (
          <form className="createEventForm" onSubmit={handleSubmit}>
            <div className="createEventSection">
              {/* Event name — floating label pattern: the label lives
                  inside the input and shrinks up on focus/fill. */}
              <div className="createEventForm__group">
                <div className="floatingField">
                  <input
                    id="create-event-title"
                    className="floatingField__input"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder=" "
                    disabled={saving}
                  />
                  <label className="floatingField__label" htmlFor="create-event-title">
                    Nombre del evento
                  </label>
                </div>
              </div>

              {/* Location with autocomplete */}
              <div className="createEventForm__group createEventLocationGroup">
                <div className="createEventAutocomplete floatingField">
                  <input
                    id="create-event-meeting-point"
                    className="floatingField__input"
                    value={form.meeting_point}
                    onChange={(e) => handleMeetingPointChange(e.target.value)}
                    placeholder=" "
                    disabled={saving}
                    autoComplete="off"
                    onFocus={() => setPlaceOpen(Boolean(placeResults.length))}
                    onBlur={() => { window.setTimeout(() => setPlaceOpen(false), 140); }}
                  />
                  <label className="floatingField__label" htmlFor="create-event-meeting-point">
                    Lugar del evento
                  </label>

                  {placeOpen && (placeLoading || placeResults.length > 0) ? (
                    <div className="createEventAutocomplete__menu">
                      {placeLoading ? (
                        <div className="createEventAutocomplete__status">
                          Buscando dirección…
                        </div>
                      ) : (
                        placeResults.map((place) => (
                          <button
                            key={`${place.label}-${place.latitude}-${place.longitude}`}
                            type="button"
                            className="createEventAutocomplete__item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectPlace(place)}
                          >
                            {place.community ? `${place.label} · ${place.community}` : place.label}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                {selectedPlaceMeta ? (
                  <div className="createEventSelectedPlace">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,flexShrink:0,color:"var(--primary)"}}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {selectedPlaceMeta.label}
                    {selectedPlaceMeta.community ? ` · ${selectedPlaceMeta.community}` : ""}
                  </div>
                ) : null}

                <MapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => {
                    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                />
              </div>

              {/* Date + time — native pickers always render their own
                  placeholder chrome, so we keep the label floated at all
                  times via --always-floated. */}
              <div className="createEventForm__group createEventForm__grid">
                <div className="floatingField floatingField--always-floated">
                  <input
                    id="create-event-date"
                    type="date"
                    className="floatingField__input"
                    value={selectedDay}
                    min={todayKey}
                    onChange={handleDayChange}
                    disabled={saving}
                  />
                  <label className="floatingField__label" htmlFor="create-event-date">
                    Fecha
                  </label>
                </div>

                <div className="floatingField floatingField--always-floated">
                  <input
                    id="create-event-time"
                    type="time"
                    className="floatingField__input"
                    value={`${form.hour}:${form.minute}`}
                    onChange={(e) => {
                      const [h, m] = (e.target.value || "19:00").split(":");
                      updateField("hour", h || "19");
                      updateField("minute", m || "00");
                    }}
                    disabled={saving}
                  />
                  <label className="floatingField__label" htmlFor="create-event-time">
                    Hora
                  </label>
                </div>
              </div>

              {/* Approval toggle */}
              <div className="createEventForm__group">
                <div className="createEventToggleRow">
                  <div className="createEventToggleRow__copy">
                    <span className="app-label">Requiere aprobación</span>
                    <span className="createEventToggleRow__hint">
                      Los participantes necesitarán tu aprobación para unirse
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`createEventToggle${form.requires_approval ? " is-on" : ""}`}
                    onClick={() => updateField("requires_approval", !form.requires_approval)}
                    disabled={saving}
                    role="switch"
                    aria-checked={form.requires_approval}
                  >
                    <span className="createEventToggle__thumb" />
                  </button>
                </div>
              </div>
            </div>

            <div className="createEventSection">
              {/* Training type: carrera continua vs. series */}
              <div className="createEventForm__group">
                <label className="app-label">Tipo de entrenamiento</label>
                <div className="trainingTypeRow">
                  {[
                    { id: "carrera_continua", label: "Carrera continua" },
                    { id: "series", label: "Series" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`trainingTypeRow__chip${
                        form.training_type === opt.id ? " is-active" : ""
                      }`}
                      onClick={() =>
                        updateField(
                          "training_type",
                          form.training_type === opt.id ? "" : opt.id
                        )
                      }
                      disabled={saving}
                      aria-pressed={form.training_type === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance + elevation — native <select> opens the OS
                  wheel picker on iOS (same UI as <input type="time">)
                  and a native dropdown on Android. Avoids the touch-
                  gesture conflict that existed when a custom wheel lived
                  inside a BottomSheet. */}
              <div className="createEventForm__group createEventForm__grid">
                <div className="floatingField floatingField--always-floated floatingField--select">
                  <select
                    id="create-event-distance"
                    className="floatingField__input"
                    value={form.distance_km}
                    onChange={(e) => updateField("distance_km", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">—</option>
                    {DISTANCE_OPTIONS.slice(1).map((v) => (
                      <option key={v} value={v}>{v} km</option>
                    ))}
                  </select>
                  <label className="floatingField__label" htmlFor="create-event-distance">
                    Distancia
                  </label>
                </div>

                <div className="floatingField floatingField--always-floated floatingField--select">
                  <select
                    id="create-event-elevation"
                    className="floatingField__input"
                    value={form.elevation_m}
                    onChange={(e) => updateField("elevation_m", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">—</option>
                    {ELEVATION_OPTIONS.slice(1).map((v) => (
                      <option key={v} value={v}>{v} m</option>
                    ))}
                  </select>
                  <label className="floatingField__label" htmlFor="create-event-elevation">
                    Desnivel +
                  </label>
                </div>
              </div>
            </div>

            <div className="createEventSection">
              {/* Description (was Notes) */}
              <div className="createEventForm__group">
                <div className="floatingField floatingField--textarea">
                  <textarea
                    id="create-event-description"
                    className="floatingField__textarea"
                    rows={5}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder=" "
                    disabled={saving}
                  />
                  <label className="floatingField__label" htmlFor="create-event-description">
                    Descripción
                  </label>
                </div>
              </div>

              {/* Image upload */}
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
                    <span>{posterPreview ? "Cambiar" : "Subir"}</span>
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

              {/* External links */}
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
                    <span>Añadir</span>
                  </button>
                </div>

                {form.external_links.length > 0 ? (
                  <div className="createEventLinksEditor">
                    {form.external_links.map((link, index) => (
                      <div key={index} className="createEventLinksEditor__row">
                        <div className="floatingField">
                          <input
                            id={`create-event-link-title-${index}`}
                            className="floatingField__input"
                            value={link.title}
                            onChange={(e) => updateLink(index, "title", e.target.value)}
                            placeholder=" "
                            disabled={saving}
                          />
                          <label className="floatingField__label" htmlFor={`create-event-link-title-${index}`}>
                            Título
                          </label>
                        </div>
                        <div className="floatingField">
                          <input
                            id={`create-event-link-url-${index}`}
                            className="floatingField__input"
                            value={link.url}
                            onChange={(e) => updateLink(index, "url", e.target.value)}
                            placeholder=" "
                            disabled={saving}
                            inputMode="url"
                            autoComplete="off"
                            autoCapitalize="off"
                          />
                          <label className="floatingField__label" htmlFor={`create-event-link-url-${index}`}>
                            URL
                          </label>
                        </div>
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
                ) : null}
              </div>
            </div>

            <div className="createEventActions">
              <button
                type="submit"
                className="app-button app-button--primary createEventSubmitBtn"
                disabled={saving}
              >
                {saving
                  ? editId ? "Guardando..." : "Creando..."
                  : editId ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
