import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../styles/events-page.css";
import "../styles/profile.css";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import ImageViewer from "../components/ui/ImageViewer";
import BottomSheet from "../components/ui/BottomSheet";
import EventFilterSheet, {
  DEFAULT_FILTER_STATE,
  hasActiveFilters as computeHasActiveFilters,
} from "../components/ui/EventFilterSheet";
import haptic from "../utils/haptic";
import {
  apiBlockUser,
  apiClubMyMemberships,
  apiDeleteMyMeetup,
  apiDMCreateThread,
  apiFollowProfile,
  apiPublicProfile,
  apiPublicProfileByHandle,
  apiRecordProfileVisit,
  apiUnblockUser,
  apiUnfollowProfile,
  apiUpdateProfile,
} from "../services/api";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { uploadAvatarToSupabase } from "../services/storage";
import { AnalyticsEvents } from "../services/analytics";
import {
  addMonths,
  buildCurrentMonthDays,
  localDayKey,
  timeLabel,
} from "../utils/dates";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function initialsFromName(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

function formatHandle(handle) {
  if (!handle) return "@sin-usuario";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function formatLocation(location) {
  return location || "Ubicación no indicada";
}

function formatBio(bio) {
  return bio || "Todavía no hay biografía disponible.";
}

function splitMeetupsByTime(meetups = []) {
  const now = Date.now();
  const future = [];
  const past = [];

  for (const meetup of meetups) {
    const ts = new Date(meetup.starts_at).getTime();
    if (Number.isNaN(ts)) continue;

    if (
      ts >= now &&
      (meetup.status === "open" || meetup.status === "full" || !meetup.status)
    ) {
      future.push(meetup);
    } else {
      past.push(meetup);
    }
  }

  future.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  past.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

  return { future, past };
}

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

function isSameOrAfterToday(isoDate) {
  return new Date(isoDate).getTime() >= Date.now();
}

function eventTypeKey(event) {
  return String(event?.event_type || event?.type || "")
    .trim()
    .toLowerCase();
}

function eventImageSrc(event) {
  const uploadedImage =
    event?.image_url ||
    event?.poster_url ||
    event?.cover_url ||
    event?.photo_url ||
    event?.thumbnail_url ||
    event?.banner_url;

  if (uploadedImage) return uploadedImage;

  const type = eventTypeKey(event);

  if (type === "carrera") return finishlineImage;
  if (type === "vibe") return partyImage;
  return shoesImage;
}

function eventTitle(event) {
  return event?.title || event?.meeting_point || "Evento";
}

function IconEdit({ size = 16 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
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

function IconMapPin({ size = 14 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconVerified({ size = 13 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <path d="M9 12l2 2 4-4" />
      <path d="M12 3l2.2 1.4 2.6-.1 1 2.4 2 1.7-.8 2.5.8 2.5-2 1.7-1 2.4-2.6-.1L12 21l-2.2-1.4-2.6.1-1-2.4-2-1.7.8-2.5-.8-2.5 2-1.7 1-2.4 2.6.1L12 3z" />
    </svg>
  );
}

function DayEventCard({ event, canManage = false, onEdit, onDelete }) {
  const imageSrc = eventImageSrc(event);

  return (
    <Link to={`/evento/${event.id}`} className="dayEventCard" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div className="dayEventCard__imageWrap">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={eventTitle(event)}
            className="dayEventCard__image"
          />
        ) : (
          <div className="dayEventCard__imagePlaceholder">
            <span className="dayEventCard__placeholderTitle">
              {eventTitle(event)}
            </span>
          </div>
        )}
      </div>

      <div className="dayEventCard__body">
        <h3 className="dayEventCard__title">{eventTitle(event)}</h3>

        <p className="dayEventCard__meta">
          {timeLabel(event.starts_at)}
        </p>

        <p className="dayEventCard__meta">
          {event.meeting_point || "Sin ubicación"}
        </p>

        {typeof event?.participants_count === "number" ? (
          <p className="dayEventCard__meta">
            {event.participants_count} inscrito{event.participants_count !== 1 ? "s" : ""}
          </p>
        ) : null}

        {canManage ? (
          <div className="dayEventCard__actions" onClick={(e) => e.preventDefault()}>
            <button
              type="button"
              className="dayEventCard__iconBtn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(event); }}
              aria-label="Editar evento"
              title="Editar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
            </button>
            <button
              type="button"
              className="dayEventCard__iconBtn dayEventCard__iconBtn--danger"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(event); }}
              aria-label="Borrar evento"
              title="Borrar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function LinksBlock({ links = {} }) {
  const entries = Object.entries(links || {}).filter(([, value]) => !!value);

  if (entries.length === 0) return null;

  return (
    <section className="sectionBlock profileLinksSection">
      <h2 className="activitySection__title">Enlaces</h2>

      <div className="profileLinksList">
        {entries.map(([key, value]) => (
          <a
            key={key}
            href={value}
            target="_blank"
            rel="noreferrer"
            className="profileLinkItem"
          >
            <span className="profileLinkItem__label">{key}</span>
            <span className="profileLinkItem__value">{value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function MembersBlock({ members = [] }) {
  if (!members.length) return null;

  return (
    <section className="sectionBlock">
      <h2 className="activitySection__title">Miembros</h2>

      <div className="compactList">
        {members.map((member) => (
          <Link
            key={`${member.user_id}-${member.profile_id || member.handle || "member"}`}
            to={
              member.profile_id
                ? `/perfil/${member.profile_id}`
                : member.handle
                ? `/perfil/handle/${member.handle}`
                : "#"
            }
            className="compactListItem"
          >
            <div className="compactListItem__avatar">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name || member.handle || "Miembro"}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 14,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span>{initialsFromName(member.full_name || member.handle || "U")}</span>
              )}
            </div>

            <div className="compactListItem__copy">
              <h3 className="compactListItem__title">
                {member.full_name || member.handle || "Miembro"}
              </h3>
              <p className="compactListItem__text">{formatHandle(member.handle)}</p>
            </div>

            <div className="compactListItem__aside">{member.role}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ProfileFilterPopup replaced by the shared EventFilterSheet so both
   calendars use the same chip-preset filters and sheet presentation. */

function ProfileGridEventCard({ event, canManage, onEdit, onDelete }) {
  const imageSrc = eventImageSrc(event);
  const date = new Date(event.starts_at);
  const day = date.getDate();
  const monthStr = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();

  return (
    <div className="gridEventCard">
      <Link to={`/evento/${event.id}`} className="gridEventCard__imageWrap">
        <img src={imageSrc} alt={eventTitle(event)} className="gridEventCard__image" />
        <div className="gridEventCard__dateBadge">
          <span className="gridEventCard__dateDay">{day}</span>
          <span className="gridEventCard__dateMonth">{monthStr}</span>
        </div>
      </Link>
      <div className="gridEventCard__body">
        <Link to={`/evento/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <h3 className="gridEventCard__title">{eventTitle(event)}</h3>
          {(event.distance_km || event.elevation_m) ? (
            <p className="gridEventCard__tech">
              {event.distance_km ? `${event.distance_km} km` : ""}
              {event.distance_km && event.elevation_m ? " · " : ""}
              {event.elevation_m ? `${event.elevation_m} D+` : ""}
            </p>
          ) : null}
          <p className="gridEventCard__meta">{event.meeting_point || "Sin ubicación"}</p>
        </Link>
        {canManage ? (
          <div className="dayEventCard__actions" style={{ marginTop: 6 }}>
            <button type="button" className="dayEventCard__iconBtn" onClick={() => onEdit?.(event)} aria-label="Editar" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
            </button>
            <button type="button" className="dayEventCard__iconBtn dayEventCard__iconBtn--danger" onClick={() => onDelete?.(event)} aria-label="Borrar" title="Borrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProfileMapView({ events }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    const geoEvents = events.filter(
      (e) => Number.isFinite(Number(e.latitude)) && Number.isFinite(Number(e.longitude))
    );

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

      marker.on("popupopen", () => {
        const popupEl = marker.getPopup().getElement();
        if (popupEl) {
          popupEl.style.cursor = "pointer";
          popupEl.onclick = () => navigate(`/evento/${ev.id}`);
        }
      });

      markersRef.current.push(marker);
    }

    if (geoEvents.length > 0) {
      const bounds = L.latLngBounds(geoEvents.map((e) => [Number(e.latitude), Number(e.longitude)]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [events, navigate]);

  return <div ref={mapRef} className="discoverMapView" />;
}

function ProfileAgenda({
  meetups = [],
  myUserId,
  canCreate = false,
  showMapAndFilters = true,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ ...DEFAULT_FILTER_STATE });

  const hasActiveFilters = computeHasActiveFilters(activeFilters);

  const upcomingItems = useMemo(() => {
    return (meetups || []).filter((item) => {
      if (!item?.starts_at || !isSameOrAfterToday(item.starts_at)) return false;

      const hour = new Date(item.starts_at).getHours();
      if (hour < activeFilters.timeRange[0] || hour > activeFilters.timeRange[1]) return false;

      if (item.distance_km) {
        if (item.distance_km < activeFilters.kmRange[0] || item.distance_km > activeFilters.kmRange[1]) return false;
      }

      if (activeFilters.locationText.trim()) {
        const needle = activeFilters.locationText.trim().toLowerCase();
        if (!(item.meeting_point || "").toLowerCase().includes(needle)) return false;
      }

      return true;
    });
  }, [meetups, activeFilters]);

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

  function goPrevMonth() { setMonth((prev) => addMonths(prev, -1)); }
  function goNextMonth() { setMonth((prev) => addMonths(prev, 1)); }
  function handleOpenCreate() { onCreateEvent?.(selectedDay || todayKey); }

  return (
    <section className="sectionBlock discoverSection discoverSection--calendarOnly profileAgendaSection">
      {showMapAndFilters && (
        <EventFilterSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={activeFilters}
          onApply={setActiveFilters}
        />
      )}

      <div className="discoverCalendarHeader">
        {showMapAndFilters ? (
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
        ) : <span />}

        <div className="discoverViewToggle">
          <button type="button" className={`discoverViewBtn${viewMode === "calendar" ? " is-active" : ""}`} onClick={() => setViewMode("calendar")} aria-label="Calendario" title="Calendario">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
          </button>
          <button type="button" className={`discoverViewBtn${viewMode === "grid" ? " is-active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Cuadrícula" title="Cuadrícula">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
          </button>
          {showMapAndFilters && (
            <button type="button" className={`discoverViewBtn${viewMode === "map" ? " is-active" : ""}`} onClick={() => setViewMode("map")} aria-label="Mapa" title="Mapa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </button>
          )}
        </div>
      </div>

      {viewMode === "calendar" && (
        <div className="discoverMonthControls">
          <button type="button" className="discoverMonthBtn" onClick={goPrevMonth} aria-label="Mes anterior">←</button>
          <div className="discoverMonthLabel">{formatMonthYear(month)}</div>
          <button type="button" className="discoverMonthBtn" onClick={goNextMonth} aria-label="Mes siguiente">→</button>
        </div>
      )}

      {viewMode === "map" ? (
        <ProfileMapView events={upcomingItems} />
      ) : viewMode === "grid" ? (
        upcomingItems.length === 0 ? (
          <div className="discoverEmptyText">No hay eventos próximos</div>
        ) : (
          <div className="discoverGridView">
            {upcomingItems.map((event) => (
              <ProfileGridEventCard
                key={event.id}
                event={event}
                canManage={canCreate}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        )
      ) : (
        <>
          <div className="discoverCalendarCard discoverCalendarCard--premium">
            <div className="discoverWeekdays">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="discoverWeekdays__item">{weekday}</div>
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
                    onClick={() => setSelectedDay(key)}
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

          {selectedDay ? (
            <section className="discoverSelectedDay">
              <div className="discoverSelectedDay__head">
                <div>
                  <div className="discoverSelectedDay__title">{formatSelectedDay(selectedDay)}</div>
                </div>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="discoverEmptyState">
                  <p>No hay eventos programados para este día.</p>
                </div>
              ) : (
                <div className="discoverSelectedDay__events">
                  {selectedEvents.map((event) => (
                    <DayEventCard
                      key={event.id}
                      event={event}
                      canManage={canCreate}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function AvatarViewer({ src, alt, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="avatarViewer__overlay" onClick={onClose} role="dialog" aria-label="Ver imagen de perfil">
      <div className="avatarViewer__container" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="avatarViewer__image" />
        <button type="button" className="avatarViewer__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

/* Bottom sheet presented when the owner taps their own avatar. Offers
 * "Ver foto" (opens AvatarViewer) and "Cambiar foto" (triggers file input).
 * For public profiles we skip the sheet and go straight to the viewer. */
function AvatarActionSheet({ open, hasPhoto, onView, onChange, onClose }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Opciones de foto de perfil"
    >
      <div className="avatarSheet__actions">
        {hasPhoto ? (
          <button
            type="button"
            className="avatarSheet__item"
            onClick={onView}
          >
            Ver foto
          </button>
        ) : null}
        <button
          type="button"
          className="avatarSheet__item"
          onClick={onChange}
        >
          {hasPhoto ? "Cambiar foto" : "Subir foto"}
        </button>
      </div>
    </BottomSheet>
  );
}

export default function ProfilePage() {
  const { profileId, handle } = useParams();
  const isPublicProfile = Boolean(profileId || handle);
  const navigate = useNavigate();

  const { me, meReady, token, refreshMe, user } = useAuth();
  const { items: myMeetups = [], reload: reloadMyMeetups } = useMyMeetups();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const { isBlocked, refresh: refreshBlocks } = useBlockedIds();

  useEffect(() => {
    let cancelled = false;

    async function loadPublicProfile() {
      if (!isPublicProfile) {
        setPublicProfile(null);
        setPublicError("");
        setPublicLoading(false);
        return;
      }

      if (!token) return;

      setPublicLoading(true);
      setPublicError("");

      try {
        const data = profileId
          ? await apiPublicProfile(profileId, token)
          : await apiPublicProfileByHandle(handle, token);

        if (!cancelled) {
          setPublicProfile(data);
          setIsFollowing(Boolean(data?.is_following));
          if (data?.id) AnalyticsEvents.profileViewed?.(data.id);
          // Fire-and-forget visit tracking. Backend enforces premium gate
          // and opt-out settings, so we always call and ignore errors.
          const vieweeUserId = data?.owner_user_id || data?.source_user_id;
          if (vieweeUserId) {
            apiRecordProfileVisit(
              { vieweeUserId, source: handle ? "link" : "search" },
              token
            ).catch(() => {});
          }
        }
      } catch (error) {
        if (!cancelled) {
          setPublicProfile(null);
          setPublicError(error?.message || "No se pudo cargar el perfil.");
        }
      } finally {
        if (!cancelled) {
          setPublicLoading(false);
        }
      }
    }

    loadPublicProfile();

    return () => {
      cancelled = true;
    };
  }, [handle, isPublicProfile, profileId, token]);

  // Load clubs for own profile
  useEffect(() => {
    let cancelled = false;

    async function loadClubs() {
      // Only load clubs for own profile, not for public profiles
      if (isPublicProfile) {
        setClubs([]);
        return;
      }

      if (!token) return;

      setClubsLoading(true);
      try {
        const data = await apiClubMyMemberships(token);
        if (!cancelled) {
          setClubs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setClubs([]);
          console.error("Failed to load clubs:", error);
        }
      } finally {
        if (!cancelled) {
          setClubsLoading(false);
        }
      }
    }

    loadClubs();

    return () => {
      cancelled = true;
    };
  }, [isPublicProfile, token]);

  async function handleToggleFollow() {
    if (!publicProfile?.id || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiUnfollowProfile(publicProfile.id, token);
        haptic.tick();
        AnalyticsEvents.unfollowed?.(publicProfile.id);
        setIsFollowing(false);
        setPublicProfile((prev) =>
          prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) } : prev
        );
        toast?.success?.("Has dejado de seguir a este perfil.");
      } else {
        const result = await apiFollowProfile(publicProfile.id, token);
        haptic.tick();
        AnalyticsEvents.followed?.(publicProfile.id);
        setIsFollowing(true);
        setPublicProfile((prev) =>
          prev
            ? { ...prev, followers_count: result?.followers_count ?? (prev.followers_count || 0) + 1 }
            : prev
        );
        toast?.success?.("Ahora sigues a este perfil.");
      }
      // Refresh own profile so following_count updates instantly
      refreshMe(token).catch(() => {});
    } catch (err) {
      haptic.warn();
      toast?.error?.(err?.message || "No se pudo completar la acción.");
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleSendDM() {
    const ownerUserId = publicProfile?.owner_user_id;
    if (!ownerUserId || dmLoading) return;

    setDmLoading(true);
    try {
      const result = await apiDMCreateThread(ownerUserId, token);
      if (result?.id) {
        navigate(`/mensajes/${result.id}`);
      }
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo iniciar la conversación.");
    } finally {
      setDmLoading(false);
    }
  }

  async function handleBlockUser() {
    const ownerUserId = publicProfile?.owner_user_id;
    if (!ownerUserId || blockLoading) return;

    const confirmed = window.confirm(
      "¿Bloquear a este usuario? Dejará de ver tu perfil y no podrá contactarte. Tampoco verás su contenido."
    );
    if (!confirmed) return;

    setBlockLoading(true);
    setBlockMenuOpen(false);
    try {
      await apiBlockUser({ userId: ownerUserId }, token);
      haptic.confirm();
      await refreshBlocks();
      // If we were following, unfollow state locally.
      if (isFollowing) {
        setIsFollowing(false);
        setPublicProfile((prev) =>
          prev
            ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }
            : prev
        );
      }
      toast?.success?.("Usuario bloqueado.");
    } catch (err) {
      haptic.warn();
      toast?.error?.(err?.message || "No se pudo bloquear.");
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleUnblockUser() {
    const ownerUserId = publicProfile?.owner_user_id;
    if (!ownerUserId || blockLoading) return;

    setBlockLoading(true);
    setBlockMenuOpen(false);
    try {
      await apiUnblockUser(ownerUserId, token);
      await refreshBlocks();
      toast?.success?.("Usuario desbloqueado.");
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo desbloquear.");
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const ownerId = user?.id || me?.supabase_user_id || null;

    if (!ownerId) {
      toast?.error?.("No se pudo identificar al usuario.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const { publicUrl } = await uploadAvatarToSupabase(file, ownerId);
      await apiUpdateProfile({ avatar_url: publicUrl }, token);
      await refreshMe(token);
      toast?.success?.("Foto de perfil actualizada.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo actualizar la foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeleteEvent(event) {
    const eventName = eventTitle(event);
    const accepted = window.confirm(`¿Seguro que quieres borrar "${eventName}"?`);
    if (!accepted) return;

    try {
      await apiDeleteMyMeetup(event.id, token);
      await reloadMyMeetups();
      toast?.success?.("Evento eliminado.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo eliminar el evento.");
    }
  }

  function handleEditEvent(event) {
    navigate(
      `/crear-evento?edit=${encodeURIComponent(event.id)}&day=${encodeURIComponent(
        localDayKey(event.starts_at)
      )}`
    );
  }

  const mySplit = useMemo(() => splitMeetupsByTime(myMeetups), [myMeetups]);

  const profileData = isPublicProfile
    ? {
        display_name: publicProfile?.display_name || "Perfil",
        handle: publicProfile?.handle || "",
        bio: publicProfile?.bio || "",
        location: publicProfile?.location || "",
        location_verified: Boolean(publicProfile?.location_verified),
        avatar_url: publicProfile?.avatar_url || "",
        followers_count: Number(publicProfile?.followers_count ?? 0),
        following_count: Number(publicProfile?.following_count ?? 0),
        links: publicProfile?.links || {},
        profile_type: publicProfile?.profile_type || "individual",
        members: publicProfile?.members || [],
        future_meetups: publicProfile?.future_meetups || [],
        past_meetups: publicProfile?.past_meetups || [],
      }
    : {
        display_name: me?.display_name || me?.full_name || me?.handle || "Tu perfil",
        handle: me?.handle || "",
        bio: me?.bio || "",
        location: me?.location || "",
        location_verified: Boolean(me?.location_verified),
        avatar_url: me?.avatar_url || "",
        followers_count: Number(me?.followers_count ?? 0),
        following_count: Number(me?.following_count ?? 0),
        links: me?.links || {},
        profile_type: me?.profile_type || "individual",
        members: [],
        future_meetups: mySplit.future,
        past_meetups: mySplit.past,
      };

  const displayName = profileData.display_name;
  const avatarUrl = profileData.avatar_url;
  const agendaMeetups = isPublicProfile
    ? [...(profileData.future_meetups || []), ...(profileData.past_meetups || [])]
    : [...myMeetups];

  if (!meReady) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil</h3>
          <p className="stateCard__text">
            Estamos preparando la información del perfil.
          </p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicLoading) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">Cargando perfil público</h3>
          <p className="stateCard__text">Espera un momento.</p>
        </div>
      </section>
    );
  }

  if (isPublicProfile && publicError) {
    return (
      <section className="page profilePage">
        <div className="stateCard">
          <h3 className="stateCard__title">No se pudo cargar el perfil</h3>
          <p className="stateCard__text">{publicError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page page--eventsHome eventsPage profilePage">
      {viewingAvatar && avatarUrl ? (
        <ImageViewer
          src={avatarUrl}
          alt={displayName}
          onClose={() => setViewingAvatar(false)}
        />
      ) : null}

      <AvatarActionSheet
        open={avatarSheetOpen}
        hasPhoto={Boolean(avatarUrl)}
        onView={() => {
          setAvatarSheetOpen(false);
          setViewingAvatar(true);
        }}
        onChange={() => {
          setAvatarSheetOpen(false);
          fileInputRef.current?.click();
        }}
        onClose={() => setAvatarSheetOpen(false)}
      />

      <section className="sectionBlock profileHeroCard profileIdentityCard fade-in-up">
        {/* ── Centred hero top ── */}
        <div className="profileHeroTop">
          <div className="profileAvatarWrap">
            {(() => {
              const handleAvatarTap = () => {
                if (isPublicProfile) {
                  if (avatarUrl) setViewingAvatar(true);
                } else {
                  setAvatarSheetOpen(true);
                }
              };
              const commonProps = {
                onClick: handleAvatarTap,
                role: "button",
                tabIndex: 0,
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleAvatarTap();
                  }
                },
                "aria-label": isPublicProfile
                  ? "Ver foto de perfil"
                  : "Opciones de foto de perfil",
                style: { cursor: "pointer" },
              };
              return avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="profileHero__avatar"
                  {...commonProps}
                />
              ) : (
                <div
                  className="profileHero__avatar profileHero__avatar--fallback"
                  {...commonProps}
                >
                  {initialsFromName(displayName)}
                </div>
              );
            })()}
          </div>

          <div className="profileHeroCopy">
            {/* On the user's OWN profile the display name is rendered in
                the mobile-shell topbar — no need to repeat it in the hero
                card. Public profiles (viewing someone else) still show
                name + handle here. */}
            {isPublicProfile ? (
              <>
                <div className="profileHero__nameRow">
                  <h1 className="profileHero__name">{displayName}</h1>

                  {profileData.location_verified ? (
                    <span
                      className="profileVerifiedBadge"
                      title="Perfil verificado"
                      aria-label="Perfil verificado"
                    >
                      <IconVerified size={14} />
                    </span>
                  ) : null}
                </div>

                <span className="profileHero__handle">
                  {formatHandle(profileData.handle)}
                </span>
              </>
            ) : (
              // Keep the verified badge discoverable on own profile even
              // without the name row (small inline chip).
              profileData.location_verified ? (
                <span
                  className="profileVerifiedBadge profileHero__ownVerified"
                  title="Perfil verificado"
                  aria-label="Perfil verificado"
                >
                  <IconVerified size={14} />
                </span>
              ) : null
            )}

            {profileData.location ? (
              <span className="profileHero__location">
                <IconMapPin size={12} />
                {profileData.location}
              </span>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        {/* ── Bio ── */}
        {profileData.bio ? (
          <p className="profileHero__bio">{profileData.bio}</p>
        ) : !isPublicProfile ? (
          <p className="profileHero__bio profileHero__bio--empty">
            Añade una bio para que otros corredores te conozcan.
          </p>
        ) : null}

        {/* ── Stats row ── */}
        <div className="profileStatsRow">
          <Link to={isPublicProfile ? "#" : "/perfil/seguidores"} className="profileStatsRow__item pressable--subtle">
            <strong className="profileStatsRow__value counter-pop">
              {profileData.followers_count}
            </strong>
            <span className="profileStatsRow__label">Seguidores</span>
          </Link>

          <span className="profileStatsRow__divider" />

          <Link to={isPublicProfile ? "#" : "/perfil/seguidos"} className="profileStatsRow__item pressable--subtle">
            <strong className="profileStatsRow__value counter-pop">
              {profileData.following_count}
            </strong>
            <span className="profileStatsRow__label">Seguidos</span>
          </Link>

        </div>

        {/* ── Actions ── */}
        {isPublicProfile ? (
          publicProfile?.owner_user_id && isBlocked(publicProfile.owner_user_id) ? (
            <div className="profileActions profileActions--blocked">
              <p className="profileBlockedNotice">
                Has bloqueado a este usuario. No puede verte ni contactarte.
              </p>
              <button
                type="button"
                className="app-button app-button--secondary profileActions__btn"
                onClick={handleUnblockUser}
                disabled={blockLoading}
              >
                {blockLoading ? "…" : "Desbloquear"}
              </button>
            </div>
          ) : (
            <div className="profileActions">
              <button
                type="button"
                className={`app-button profileActions__btn ${
                  isFollowing ? "app-button--secondary" : "app-button--primary"
                }`}
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading
                  ? "…"
                  : isFollowing
                  ? "Siguiendo"
                  : "Seguir"}
              </button>

              {publicProfile?.owner_user_id ? (
                <button
                  type="button"
                  className="app-button app-button--secondary profileActions__btn"
                  onClick={handleSendDM}
                  disabled={dmLoading}
                >
                  {dmLoading ? "…" : "Mensaje"}
                </button>
              ) : null}

              {publicProfile?.owner_user_id ? (
                <div className="profileOverflow">
                  <button
                    type="button"
                    className="profileOverflow__trigger"
                    aria-label="Más opciones"
                    aria-expanded={blockMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setBlockMenuOpen((v) => !v)}
                  >
                    <span aria-hidden="true">⋯</span>
                  </button>
                  {blockMenuOpen ? (
                    <>
                      <div
                        className="profileOverflow__scrim"
                        onClick={() => setBlockMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <div className="profileOverflow__menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="profileOverflow__item profileOverflow__item--danger"
                          onClick={handleBlockUser}
                          disabled={blockLoading}
                        >
                          Bloquear usuario
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {!isPublicProfile && uploadingAvatar ? (
          <div className="profileUploadState">Subiendo foto…</div>
        ) : null}
      </section>

      {/* Clubs are accessed from the Explore tab */}

      <MembersBlock
        members={(profileData.members || []).filter((m) => {
          const uid = m?.user_id ?? m?.owner_user_id;
          if (uid == null) return true;
          return !isBlocked(uid);
        })}
      />

      <ProfileAgenda
        meetups={agendaMeetups}
        myUserId={me?.id || me?.supabase_user_id}
        canCreate={!isPublicProfile}
        showMapAndFilters={!isPublicProfile}
        onCreateEvent={(dayKey) => {
          navigate(`/crear-evento?day=${encodeURIComponent(dayKey)}`);
        }}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      <LinksBlock links={profileData.links} />
    </section>
  );
}
