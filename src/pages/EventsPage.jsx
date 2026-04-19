1import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import {
  addMonths,
  buildCurrentMonthDays,
  localDayKey,
  timeLabel,
} from "../utils/dates";
import { searchPlaces } from "../utils/location";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import AvatarStack from "../components/ui/AvatarStack";
import UrgencyBadge from "../components/ui/UrgencyBadge";
import EventFilterSheet, {
  DEFAULT_FILTER_STATE,
  hasActiveFilters as computeHasActiveFilters,
} from "../components/ui/EventFilterSheet";
import "../styles/events-page.css";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const DEFAULT_FILTERS = {
  only_open: true,
  limit: 60,
  offset: 0,
};

function groupByDay(meetups = []) {
  const map = new Map();

  for (const meetup of meetups) {
    if (!meetup?.starts_at) continue;
    const key = localDayKey(meetup.starts_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(meetup);
  }

  for (const [key, items] of map.entries()) {
    items.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    map.set(key, items);
  }

  return map;
}

function eventTitle(event) {
  return event?.title || event?.meeting_point || "Evento";
}

function formatMonthYear(date) {
  return date.toLocaleDateString("es-ES", { month: "long" });
}

function formatSelectedDay(dayKey) {
  if (!dayKey) return "";

  const date = new Date(`${dayKey}T12:00:00`);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
  const formatted = date.toLocaleDateString("es-ES");

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${formatted}`;
}

function IconPlus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16 }}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function isSameOrAfterToday(isoDate) {
  return new Date(isoDate).getTime() >= Date.now();
}

function eventImageSrc(event) {
  const uploaded =
    event?.image_url ||
    event?.poster_url ||
    event?.cover_url ||
    event?.photo_url ||
    event?.thumbnail_url ||
    event?.banner_url;

  if (uploaded) return uploaded;

  const type = String(event?.event_type || "").trim().toLowerCase();
  if (type === "carrera") return finishlineImage;
  if (type === "vibe") return partyImage;
  return shoesImage;
}

/* FilterPopup moved to ../components/ui/EventFilterSheet.jsx and is
   shared between the Events and Profile calendars. */

function spotsInfo(event) {
  const count = event?.participants_count ?? 0;
  const cap = event?.max_participants || event?.capacity || 0;
  if (!cap) return { label: `${count} inscrito${count !== 1 ? "s" : ""}`, variant: "open" };
  const left = Math.max(0, cap - count);
  if (left === 0) return { label: "Completo", variant: "hot" };
  if (left <= 3) return { label: `${left} plaza${left !== 1 ? "s" : ""} libre${left !== 1 ? "s" : ""}`, variant: "hot" };
  if (left <= 6) return { label: `${left} plazas libres`, variant: "warm" };
  return { label: `${count}/${cap} inscritos`, variant: "open" };
}

function DayEventCard({ event }) {
  const imageSrc = eventImageSrc(event);
  const participants = event?.participants || [];
  const spots = typeof event?.participants_count === "number" ? spotsInfo(event) : null;

  return (
    <Link to={`/evento/${event.id}`} className="dayEventCard">
      <div className="dayEventCard__imageWrap">
        <img
          src={imageSrc}
          alt={eventTitle(event)}
          className="dayEventCard__image"
        />
      </div>

      <div className="dayEventCard__body">
        <h3 className="dayEventCard__title">{eventTitle(event)}</h3>

        <p className="dayEventCard__meta">
          {timeLabel(event.starts_at)}
        </p>

        <p className="dayEventCard__meta">
          {event.meeting_point || "Sin ubicación"}
        </p>

        {(event.distance_km || event.elevation_m || event.training_type) ? (
          <p className="dayEventCard__meta dayEventCard__techLine">
            {event.training_type === "series"
              ? "Series"
              : event.training_type === "carrera_continua"
              ? "Carrera continua"
              : ""}
            {event.training_type && (event.distance_km || event.elevation_m) ? " · " : ""}
            {event.distance_km ? `${event.distance_km} km` : ""}
            {event.distance_km && event.elevation_m ? " · " : ""}
            {event.elevation_m ? `${event.elevation_m} D+` : ""}
          </p>
        ) : null}

        {/* Social proof row */}
        <div className="dayEventCard__social">
          {participants.length > 0 ? (
            <AvatarStack users={participants} max={3} size={22} />
          ) : null}

          {spots ? (
            <UrgencyBadge variant={spots.variant}>{spots.label}</UrgencyBadge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function GridEventCard({ event }) {
  const imageSrc = eventImageSrc(event);
  const date = new Date(event.starts_at);
  const day = date.getDate();
  const monthStr = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();
  const participants = event?.participants || [];
  const spots = typeof event?.participants_count === "number" ? spotsInfo(event) : null;

  return (
    <Link to={`/evento/${event.id}`} className="gridEventCard">
      <div className="gridEventCard__imageWrap">
        <img src={imageSrc} alt={eventTitle(event)} className="gridEventCard__image" />
        <div className="gridEventCard__dateBadge">
          <span className="gridEventCard__dateDay">{day}</span>
          <span className="gridEventCard__dateMonth">{monthStr}</span>
        </div>
      </div>
      <div className="gridEventCard__body">
        <h3 className="gridEventCard__title">{eventTitle(event)}</h3>
        {(event.distance_km || event.elevation_m || event.training_type) ? (
          <p className="gridEventCard__tech">
            {event.training_type === "series" ? "Series"
              : event.training_type === "carrera_continua" ? "Carrera continua" : ""}
            {event.training_type && (event.distance_km || event.elevation_m) ? " · " : ""}
            {event.distance_km ? `${event.distance_km} km` : ""}
            {event.distance_km && event.elevation_m ? " · " : ""}
            {event.elevation_m ? `${event.elevation_m} D+` : ""}
          </p>
        ) : null}
        <p className="gridEventCard__meta">{event.meeting_point || "Sin ubicación"}</p>

        {/* Social proof */}
        {(participants.length > 0 || spots) ? (
          <div className="gridEventCard__social">
            {participants.length > 0 ? (
              <AvatarStack users={participants} max={3} size={20} />
            ) : null}
            {spots ? (
              <UrgencyBadge variant={spots.variant}>{spots.label}</UrgencyBadge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function MapView({ events, onSelectEvent }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Load Leaflet once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // CSS — only inject once
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function initMap() {
      if (!window.L || !mapRef.current || mapInstanceRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: false }).setView([40.4168, -3.7038], 6);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync markers when events change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    // Remove old markers
    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    const geoEvents = events.filter(
      (e) => Number.isFinite(Number(e.latitude)) && Number.isFinite(Number(e.longitude))
    );

    // Custom green marker icon
    const greenIcon = L.divIcon({
      className: "mapMarker--custom",
      html: `<div style="width:28px;height:28px;background:var(--primary,#6ee7a0);border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#0a1628' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0Z'/><circle cx='12' cy='10' r='3'/></svg></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    });

    for (const ev of geoEvents) {
      const title = ev.title || ev.meeting_point || "Evento";
      const loc = ev.meeting_point || "";
      const tech = [
        ev.distance_km ? `${ev.distance_km} km` : "",
        ev.elevation_m ? `${ev.elevation_m} D+` : "",
      ].filter(Boolean).join(" · ");

      const popup = `<div style="min-width:140px"><strong style="font-size:13px">${title}</strong>${loc ? `<br/><span style="font-size:11px;opacity:0.7">${loc}</span>` : ""}${tech ? `<br/><span style="font-size:11px;color:#6ee7a0">${tech}</span>` : ""}</div>`;

      const marker = L.marker([Number(ev.latitude), Number(ev.longitude)], { icon: greenIcon })
        .addTo(map)
        .bindPopup(popup);

      // Navigate on click
      marker.on("click", () => {
        marker.openPopup();
      });
      marker.on("popupopen", () => {
        const popupEl = marker.getPopup().getElement();
        if (popupEl) {
          popupEl.style.cursor = "pointer";
          popupEl.onclick = () => onSelectEvent?.(ev);
        }
      });

      markersRef.current.push(marker);
    }

    if (geoEvents.length > 0) {
      const bounds = L.latLngBounds(geoEvents.map((e) => [Number(e.latitude), Number(e.longitude)]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [events, onSelectEvent]);

  return <div ref={mapRef} className="discoverMapView" />;
}

export default function EventsPage() {
  const { items, loading, error, run } = useMeetupSearch(DEFAULT_FILTERS);
  const navigate = useNavigate();
  const { me } = useAuth();
  const myUserId = me?.id || me?.supabase_user_id;
  const { blockedIds } = useBlockedIds();

  const [month, setMonth] = useState(() => new Date());
  /* Intentionally starts null: the event-info panel should only appear
     when the user deliberately taps a day. Auto-selecting "today" on
     mount puts the viewport focus on that panel before the user has
     asked for it — a mild violation of "no action, no reaction". */
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "grid" | "map"
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ ...DEFAULT_FILTER_STATE });

  const hasActiveFilters = computeHasActiveFilters(activeFilters);

  function handleApplyFilters(newFilters) {
    setActiveFilters(newFilters);
    if (newFilters.locationText.trim()) {
      run({ location: newFilters.locationText.trim() });
    } else {
      run({ location: undefined });
    }
  }

  const upcomingItems = useMemo(
    () =>
      (items || []).filter((item) => {
        if (!item?.starts_at || !isSameOrAfterToday(item.starts_at)) return false;

        // Blocked-user filter (bi-directional).
        if (item.created_by != null && blockedIds.has(String(item.created_by))) {
          return false;
        }

        // Time filter
        const hour = new Date(item.starts_at).getHours();
        if (hour < activeFilters.timeRange[0] || hour > activeFilters.timeRange[1]) return false;

        // Km filter
        if (item.distance_km) {
          if (item.distance_km < activeFilters.kmRange[0] || item.distance_km > activeFilters.kmRange[1]) return false;
        }

        return true;
      }),
    [items, activeFilters, blockedIds]
  );

  const byDay = useMemo(() => groupByDay(upcomingItems), [upcomingItems]);
  const { days, startOffset } = useMemo(
    () => buildCurrentMonthDays(month),
    [month]
  );
  const todayKey = localDayKey(new Date());

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return byDay.get(selectedDay) || [];
  }, [byDay, selectedDay]);

  function goPrevMonth() {
    setMonth((prev) => addMonths(prev, -1));
  }

  function goNextMonth() {
    setMonth((prev) => addMonths(prev, 1));
  }

  function handleSelectDay(dayKey) {
    setSelectedDay(dayKey);
  }

  return (
    <section className="page page--eventsHome eventsPage">
      <EventFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={activeFilters}
        onApply={handleApplyFilters}
      />

      <section className="sectionBlock discoverSection discoverSection--calendarOnly">
        <div className="discoverCalendarHeader discoverCalendarHeader--noTitle">
          <div className="discoverViewToggle">
            <button
              type="button"
              className={`discoverFilterBtn${hasActiveFilters ? " has-filters" : ""}`}
              onClick={() => setFilterOpen(true)}
              aria-label="Filtros"
              title="Filtros"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                <circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>
              </svg>
              {hasActiveFilters && <span className="discoverFilterBtn__dot" />}
            </button>
          </div>

          <div className="discoverViewToggle">
            <button type="button" className={`discoverViewBtn${viewMode === "calendar" ? " is-active" : ""}`} onClick={() => setViewMode("calendar")} aria-label="Calendario" title="Calendario">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            </button>
            <button type="button" className={`discoverViewBtn${viewMode === "grid" ? " is-active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Cuadrícula" title="Cuadrícula">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
            </button>
            <button type="button" className={`discoverViewBtn${viewMode === "map" ? " is-active" : ""}`} onClick={() => setViewMode("map")} aria-label="Mapa" title="Mapa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </button>
          </div>
        </div>

        {viewMode === "calendar" && (
          <div className="discoverMonthControls discoverMonthControls--withCreate">
            <button type="button" className="discoverMonthBtn" onClick={goPrevMonth} aria-label="Mes anterior">
              ←
            </button>
            <div className="discoverMonthLabel">{formatMonthYear(month)}</div>
            <button type="button" className="discoverMonthBtn" onClick={goNextMonth} aria-label="Mes siguiente">
              →
            </button>
          </div>
        )}

        {error ? (
          <div className="discoverCalendarCard discoverCalendarCard--loading">
            <p className="discoverLoading">{error}</p>
          </div>
        ) : loading ? (
          <div className="discoverCalendarCard discoverCalendarCard--loading">
            <p className="discoverLoading">Cargando calendario…</p>
          </div>
        ) : viewMode === "map" ? (
          <MapView events={upcomingItems} onSelectEvent={(ev) => navigate(`/evento/${ev.id}`)} />
        ) : viewMode === "grid" ? (
          upcomingItems.length === 0 ? (
            <div className="discoverEmptyText">No hay eventos próximos</div>
          ) : (
            <div className="discoverGridView">
              {upcomingItems.map((event) => (
                <GridEventCard key={event.id} event={event} />
              ))}
            </div>
          )
        ) : (
          <>
            <div className="discoverCalendarCard discoverCalendarCard--premium">
              <div className="discoverWeekdays">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="discoverWeekdays__item">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="discoverCalendarGrid discoverCalendarGrid--compact">
                {days.map((day, idx) => {
                  const key = localDayKey(day);
                  const dayItems = byDay.get(key) || [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;
                  const hasOwn = dayItems.some((ev) => ev.created_by && String(ev.created_by) === String(myUserId));
                  const hasOthers = dayItems.some((ev) => !ev.created_by || String(ev.created_by) !== String(myUserId));

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectDay(key)}
                      style={idx === 0 ? { gridColumnStart: startOffset + 1 } : undefined}
                      className={`discoverDayCell discoverDayCell--compact${
                        dayItems.length > 0 ? " has-events" : ""
                      }${isToday ? " is-today" : ""}${
                        isSelected ? " is-selected" : ""
                      }${hasOwn ? " has-own-events" : ""}${
                        hasOthers && !hasOwn ? " has-other-events" : ""
                      }`}
                    >
                      <span className="discoverDayCell__date">{day.getDate()}</span>
                      {hasOwn && hasOthers ? (
                        <span className="discoverDayCell__markerDual">
                          <span className="discoverDayCell__dot discoverDayCell__dot--own" />
                          <span className="discoverDayCell__dot discoverDayCell__dot--other" />
                        </span>
                      ) : (
                        <span className="discoverDayCell__marker" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <section className="discoverSelectedDay">
                <div className="discoverSelectedDay__head">
                  <div>
                    <div className="discoverSelectedDay__title">
                      {formatSelectedDay(selectedDay)}
                    </div>
                  </div>
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="discoverEmptyText">No hay eventos este día</div>
                ) : (
                  <div
                    className={`discoverEventList discoverEventList--day${
                      selectedEvents.length > 1 ? " discoverEventList--dayGrid" : ""
                    }`}
                  >
                    {selectedEvents.map((event) => (
                      <DayEventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </section>
  );
}
