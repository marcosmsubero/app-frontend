import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiGetMeetup } from "../services/api";
import { getCurrentPosition, searchPlaces } from "../utils/location";
import "../styles/event-directions.css";

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 20, height: 20 }}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16, flexShrink: 0 }}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16, flexShrink: 0 }}
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function isValidCoord(value) {
  return Number.isFinite(Number(value));
}

export default function EventDirectionsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState([]);
  const [originOpen, setOriginOpen] = useState(false);
  const [originLoading, setOriginLoading] = useState(false);
  const [originCoords, setOriginCoords] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const eventMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const routingControlRef = useRef(null);
  const lookupSeq = useRef(0);

  const hasEventCoords = useMemo(
    () => isValidCoord(event?.latitude) && isValidCoord(event?.longitude),
    [event]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!eventId || !token) return;

      setLoading(true);
      setError("");

      try {
        const data = await apiGetMeetup(eventId, token);
        if (!cancelled) {
          setEvent(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "No se pudo cargar el evento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [eventId, token]);

  useEffect(() => {
    if (!hasEventCoords || mapInstanceRef.current) return;

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCss);
    }

    if (!document.querySelector('link[href*="leaflet-routing-machine.css"]')) {
      const routingCss = document.createElement("link");
      routingCss.rel = "stylesheet";
      routingCss.href =
        "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
      document.head.appendChild(routingCss);
    }

    function initMap() {
      if (!window.L || !mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      const lat = Number(event.latitude);
      const lng = Number(event.longitude);

      const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const eventIcon = L.divIcon({
        className: "eventDirectionsMarker eventDirectionsMarker--event",
        html: `
          <div class="eventDirectionsMarker__pin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      eventMarkerRef.current = L.marker([lat, lng], { icon: eventIcon })
        .addTo(map)
        .bindPopup(
          `<div class="eventDirectionsPopup"><strong>${event.title || event.meeting_point || "Evento"}</strong><br/>${event.meeting_point || ""}</div>`
        );

      eventMarkerRef.current.openPopup();
      mapInstanceRef.current = map;
    }

    function loadScriptsAndInit() {
      const ensureLeaflet = new Promise((resolve) => {
        if (window.L) return resolve();

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

      const ensureRouting = new Promise((resolve) => {
        if (window.L && window.L.Routing) return resolve();

        const script = document.createElement("script");
        script.src =
          "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

      Promise.all([ensureLeaflet, ensureRouting]).then(initMap);
    }

    loadScriptsAndInit();

    return () => {
      if (routingControlRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      eventMarkerRef.current = null;
      originMarkerRef.current = null;
    };
  }, [event, hasEventCoords]);

  useEffect(() => {
    const query = originQuery.trim();

    if (query.length < 3) {
      setOriginResults([]);
      setOriginLoading(false);
      return;
    }

    const currentSeq = ++lookupSeq.current;
    setOriginLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        if (currentSeq !== lookupSeq.current) return;
        setOriginResults(results);
        setOriginOpen(true);
      } catch {
        if (currentSeq !== lookupSeq.current) return;
        setOriginResults([]);
      } finally {
        if (currentSeq === lookupSeq.current) {
          setOriginLoading(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [originQuery]);

  function clearRoute() {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current);
      originMarkerRef.current = null;
    }
  }

  function drawRoute(fromLat, fromLng) {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !window.L.Routing || !hasEventCoords) return;

    clearRoute();

    const L = window.L;
    const toLat = Number(event.latitude);
    const toLng = Number(event.longitude);

    const originIcon = L.divIcon({
      className: "eventDirectionsMarker eventDirectionsMarker--origin",
      html: `
        <div class="eventDirectionsMarker__pin eventDirectionsMarker__pin--origin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="8"></circle>
            <circle cx="12" cy="12" r="2.5"></circle>
          </svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    originMarkerRef.current = L.marker([fromLat, fromLng], { icon: originIcon }).addTo(map);

    routingControlRef.current = L.Routing.control({
      waypoints: [L.latLng(fromLat, fromLng), L.latLng(toLat, toLng)],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      show: true,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      draggableWaypoints: false,
      lineOptions: {
        styles: [{ weight: 5, opacity: 0.9 }],
      },
      createMarker: () => null,
      collapsible: true,
    }).addTo(map);
  }

  async function handleUseMyLocation() {
    try {
      const pos = await getCurrentPosition();
      setOriginCoords(pos);
      setOriginQuery("Mi ubicación actual");
      setOriginOpen(false);
      drawRoute(pos.latitude, pos.longitude);
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo obtener tu ubicación.");
    }
  }

  function handleSelectOrigin(place) {
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    setOriginQuery(place.fullLabel || place.label || "");
    setOriginCoords({ latitude, longitude });
    setOriginResults([]);
    setOriginOpen(false);
    drawRoute(latitude, longitude);
  }

  if (loading) {
    return (
      <section className="page eventDirectionsPage">
        <div className="eventDirectionsState">
          <div className="app-loader-screen__spinner" />
          <p>Cargando ubicación…</p>
        </div>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="page eventDirectionsPage">
        <div className="eventDirectionsState eventDirectionsState--error">
          <h2>No se pudo abrir el mapa</h2>
          <p>{error || "El evento no existe o no tiene datos suficientes."}</p>
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </section>
    );
  }

  if (!hasEventCoords) {
    return (
      <section className="page eventDirectionsPage">
        <div className="eventDirectionsNav">
          <button
            type="button"
            className="eventDirectionsBackBtn"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            <BackIcon />
          </button>
          <h1 className="eventDirectionsNav__title">Cómo llegar</h1>
        </div>

        <div className="eventDirectionsState eventDirectionsState--error">
          <h2>Este evento no tiene coordenadas</h2>
          <p>No se puede mostrar el mapa porque el evento no tiene una ubicación precisa.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page eventDirectionsPage">
      <div className="eventDirectionsNav">
        <button
          type="button"
          className="eventDirectionsBackBtn"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </button>
        <h1 className="eventDirectionsNav__title">Cómo llegar</h1>
      </div>

      <div className="eventDirectionsCard">
        <div className="eventDirectionsEvent">
          <div className="eventDirectionsEvent__badge">
            <MapPinIcon />
            Evento
          </div>
          <h2 className="eventDirectionsEvent__title">
            {event.title || event.meeting_point || "Evento"}
          </h2>
          <p className="eventDirectionsEvent__location">
            {event.meeting_point || "Ubicación del evento"}
          </p>
        </div>

        <div className="eventDirectionsSearch">
          <label className="eventDirectionsSearch__label" htmlFor="origin-input">
            Tu punto de salida
          </label>

          <div className="eventDirectionsSearch__row">
            <input
              id="origin-input"
              type="text"
              className="eventDirectionsSearch__input"
              placeholder="Escribe tu dirección..."
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                setOriginCoords(null);
              }}
              onFocus={() => {
                if (originResults.length > 0) setOriginOpen(true);
              }}
            />

            <button
              type="button"
              className="eventDirectionsSearch__geoBtn"
              onClick={handleUseMyLocation}
            >
              <NavigationIcon />
              Mi ubicación
            </button>
          </div>

          {originLoading ? (
            <div className="eventDirectionsSearch__hint">Buscando direcciones…</div>
          ) : null}

          {originOpen && originResults.length > 0 ? (
            <div className="eventDirectionsSearch__results">
              {originResults.map((place, index) => (
                <button
                  key={`${place.fullLabel}-${index}`}
                  type="button"
                  className="eventDirectionsSearch__result"
                  onClick={() => handleSelectOrigin(place)}
                >
                  <strong>{place.label}</strong>
                  {place.fullLabel ? <span>{place.fullLabel}</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          {originCoords ? (
            <div className="eventDirectionsSearch__ready">
              Ruta calculada hasta el evento.
            </div>
          ) : (
            <div className="eventDirectionsSearch__hint">
              Selecciona una dirección o usa tu ubicación actual para ver la ruta.
            </div>
          )}
        </div>
      </div>

      <div ref={mapRef} className="eventDirectionsMap" />
    </section>
  );
}
