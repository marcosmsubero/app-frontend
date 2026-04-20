import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import {
  apiSearchProfiles,
  apiClubsList,
} from "../services/api";
import ExploreResultRow from "../components/ui/ExploreResultRow";
import ExploreFilterSheet from "../components/ui/ExploreFilterSheet";
import { timeLabel } from "../utils/dates";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import "../styles/explorar.css";

const IMMINENT_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 h
const WEEK_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 h

const TIME_RANGES = {
  any: [0, 23],
  morning: [6, 12],
  midday: [12, 16],
  afternoon: [16, 20],
  evening: [20, 24],
};

const DISTANCE_RANGES = {
  any: [0, 200],
  "5k": [0, 7],
  "10k": [7, 12],
  half: [12, 23],
  mara: [23, 45],
  ultra: [45, 200],
};

const TAB_META = [
  { value: "runners", label: "Corredores", placeholder: "Buscar corredores" },
  { value: "clubs", label: "Clubs", placeholder: "Buscar clubs" },
  { value: "events", label: "Eventos", placeholder: "Buscar eventos" },
];

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="11" y2="6" />
      <line x1="15" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="7" y2="12" />
      <line x1="11" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="13" y2="18" />
      <line x1="17" y1="18" x2="20" y2="18" />
      <circle cx="13" cy="6" r="2" fill="currentColor" />
      <circle cx="9" cy="12" r="2" fill="currentColor" />
      <circle cx="15" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMagnifier() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function eventTitle(event) {
  return event?.title || event?.meeting_point || "Evento";
}

function eventFallbackImage(event) {
  const type = String(event?.event_type || "").trim().toLowerCase();
  if (type === "carrera") return finishlineImage;
  if (type === "vibe") return partyImage;
  return shoesImage;
}

function eventImageSrc(event) {
  return (
    event?.image_url ||
    event?.poster_url ||
    event?.cover_url ||
    event?.photo_url ||
    event?.thumbnail_url ||
    event?.banner_url ||
    eventFallbackImage(event)
  );
}

function runnerSubtitle(p) {
  const location = p?.location?.trim();
  const handle = p?.handle ? `@${String(p.handle).replace(/^@/, "")}` : "";
  if (location && handle) return `${location} · ${handle}`;
  return location || handle || "";
}

function clubSubtitle(c) {
  const location = c?.location?.trim();
  const count = typeof c?.members_count === "number" ? c.members_count : null;
  const membersLabel = count != null ? `${count} miembro${count !== 1 ? "s" : ""}` : "";
  if (location && membersLabel) return `${location} · ${membersLabel}`;
  return location || membersLabel || "";
}

function eventSubtitle(e) {
  const parts = [];
  parts.push(timeLabel(e.starts_at));
  if (e.meeting_point) parts.push(e.meeting_point);
  if (e.distance_km) parts.push(`${e.distance_km} km`);
  if (e.elevation_m) parts.push(`${e.elevation_m} D+`);
  return parts.join(" · ");
}

function SkeletonRow() {
  return (
    <div className="exploreSkeleton">
      <div className="exploreSkeleton__avatar" />
      <div className="exploreSkeleton__body">
        <div className="exploreSkeleton__line exploreSkeleton__line--wide" />
        <div className="exploreSkeleton__line exploreSkeleton__line--narrow" />
      </div>
    </div>
  );
}

function EmptyState({ icon, children }) {
  return (
    <div className="exploreEmpty">
      <div className="exploreEmpty__icon">{icon}</div>
      <p className="exploreEmpty__text">{children}</p>
    </div>
  );
}

export default function ExplorarPage() {
  const { isAuthed, token } = useAuth();
  const { blockedIds } = useBlockedIds();

  const [tab, setTab] = useState("events");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedTime, setAppliedTime] = useState("any");
  const [appliedDistance, setAppliedDistance] = useState("any");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => window.clearTimeout(id);
  }, [query]);

  // The backend search endpoints take a single `q` parameter that matches
  // name / handle / location via LIKE. We surface two inputs (top query +
  // sheet location) but merge them: prefer the live query, fall back to
  // the applied location.
  const searchNeedle = (debouncedQuery || appliedLocation || "").trim();

  const [profiles, setProfiles] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (tab === "events") return;
    let cancelled = false;
    setLoadingList(true);

    const fetcher = tab === "runners" ? apiSearchProfiles : apiClubsList;
    fetcher(searchNeedle, token)
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res) ? res : res?.items || [];
        if (tab === "runners") setProfiles(rows);
        else setClubs(rows);
      })
      .catch(() => {
        if (!cancelled) {
          if (tab === "runners") setProfiles([]);
          else setClubs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, searchNeedle, token]);

  const { items: meetupItems } = useMeetupSearch({
    only_open: true,
    limit: 60,
    offset: 0,
  });

  const now = Date.now();

  const filteredEvents = useMemo(() => {
    const tRange = TIME_RANGES[appliedTime] || TIME_RANGES.any;
    const dRange = DISTANCE_RANGES[appliedDistance] || DISTANCE_RANGES.any;
    const needle = searchNeedle.toLowerCase();

    return (meetupItems || [])
      .filter((item) => {
        if (!item?.starts_at) return false;
        if (item.created_by != null && blockedIds.has(String(item.created_by))) {
          return false;
        }
        const t = new Date(item.starts_at).getTime();
        if (t < now || t - now > WEEK_WINDOW_MS) return false;

        const hour = new Date(item.starts_at).getHours();
        if (hour < tRange[0] || hour > tRange[1]) return false;

        if (item.distance_km != null) {
          if (item.distance_km < dRange[0] || item.distance_km > dRange[1]) return false;
        }

        if (needle) {
          const haystack =
            `${item.title || ""} ${item.meeting_point || ""}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
  }, [meetupItems, appliedTime, appliedDistance, searchNeedle, blockedIds, now]);

  const imminentItems = useMemo(
    () =>
      filteredEvents.filter((item) => {
        const t = new Date(item.starts_at).getTime();
        return t - now <= IMMINENT_WINDOW_MS;
      }),
    [filteredEvents, now],
  );

  const weekItems = useMemo(
    () =>
      filteredEvents.filter((item) => {
        const t = new Date(item.starts_at).getTime();
        return t - now > IMMINENT_WINDOW_MS;
      }),
    [filteredEvents, now],
  );

  // Badge on the filter button reflects the applied (not draft) filter
  // state and excludes the top-level query (visible as its own input).
  const appliedFilterCount =
    (appliedLocation ? 1 : 0) +
    (tab === "events" && appliedTime !== "any" ? 1 : 0) +
    (tab === "events" && appliedDistance !== "any" ? 1 : 0);

  const tabIndex = Math.max(
    0,
    TAB_META.findIndex((t) => t.value === tab),
  );
  const activeMeta = TAB_META[tabIndex];

  function handleApplyFilters(next) {
    setAppliedLocation(next.location || "");
    setAppliedTime(next.time || "any");
    setAppliedDistance(next.distance || "any");
    setFiltersOpen(false);
  }

  if (!isAuthed) {
    return (
      <section className="page explorarPage">
        <div className="explorarPage__loginCard">
          <h2>Inicia sesión para explorar</h2>
          <p>Descubre eventos, clubs y corredores compatibles contigo.</p>
          <Link to="/login" className="app-button app-button--primary">
            Iniciar sesión
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page explorarPage">
      <header
        className="exploreHeader"
        style={{ "--exploreTabs-index": tabIndex }}
      >
        <div className="exploreBar">
          <label className="exploreBar__search">
            <span className="exploreBar__searchIcon" aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              className="exploreBar__searchInput"
              placeholder={activeMeta.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={activeMeta.placeholder}
            />
            {query ? (
              <button
                type="button"
                className="exploreBar__searchClear"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            ) : null}
          </label>

          <button
            type="button"
            className="exploreBar__filterBtn"
            onClick={() => setFiltersOpen(true)}
            aria-label={
              appliedFilterCount > 0
                ? `Filtros activos: ${appliedFilterCount}`
                : "Filtros"
            }
          >
            <IconSliders />
            {appliedFilterCount > 0 ? (
              <span className="exploreBar__filterBadge">
                {appliedFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="exploreTabs" role="tablist" aria-label="Tipo de búsqueda">
          {TAB_META.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={t.value === tab}
              className={`exploreTabs__tab${t.value === tab ? " is-active" : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
          <span className="exploreTabs__indicator" aria-hidden="true" />
        </div>
      </header>

      <ExploreFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        tab={tab}
        appliedLocation={appliedLocation}
        appliedTime={appliedTime}
        appliedDistance={appliedDistance}
        onApply={handleApplyFilters}
      />

      <div className="exploreResults">
        {tab === "runners" ? (
          loadingList ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : profiles.length === 0 ? (
            <EmptyState icon={searchNeedle ? <IconMagnifier /> : <IconPin />}>
              {searchNeedle
                ? `Sin resultados para "${searchNeedle}".`
                : "Busca por ubicación o nombre."}
            </EmptyState>
          ) : (
            <div className="exploreList">
              {profiles.map((p) => (
                <ExploreResultRow
                  key={`p-${p.id}`}
                  to={p.handle ? `/perfil/handle/${p.handle}` : `/perfil/${p.id}`}
                  avatarUrl={p.avatar_url}
                  avatarFallback={initials(p.display_name || p.handle)}
                  title={p.display_name || p.handle}
                  subtitle={runnerSubtitle(p)}
                />
              ))}
            </div>
          )
        ) : tab === "clubs" ? (
          loadingList ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : clubs.length === 0 ? (
            <EmptyState icon={searchNeedle ? <IconMagnifier /> : <IconPin />}>
              {searchNeedle
                ? `Sin resultados para "${searchNeedle}".`
                : "Busca por ubicación o nombre."}
            </EmptyState>
          ) : (
            <div className="exploreList">
              {clubs.map((c) => (
                <ExploreResultRow
                  key={`c-${c.id}`}
                  to={`/clubs/${c.id}`}
                  avatarUrl={c.avatar_url}
                  avatarFallback={initials(c.display_name || c.name)}
                  title={c.display_name || c.name}
                  subtitle={clubSubtitle(c)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {imminentItems.length > 0 || weekItems.length > 0 ? null : (
              <EmptyState icon={<IconMagnifier />}>
                {searchNeedle || appliedFilterCount > 0
                  ? "Sin eventos con esos filtros."
                  : "No hay eventos próximos."}
              </EmptyState>
            )}

            {imminentItems.length > 0 ? (
              <>
                <div className="exploreSectionHeader">
                  <span className="exploreSectionHeader__title">Próximos imminentes</span>
                  <span className="exploreSectionHeader__hint">próximas 4 h</span>
                </div>
                <div className="exploreList">
                  {imminentItems.map((e) => (
                    <ExploreResultRow
                      key={`im-${e.id}`}
                      to={`/evento/${e.id}`}
                      avatarUrl={eventImageSrc(e)}
                      avatarFallback={initials(eventTitle(e))}
                      title={eventTitle(e)}
                      subtitle={eventSubtitle(e)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {weekItems.length > 0 ? (
              <>
                <div className="exploreSectionHeader">
                  <span className="exploreSectionHeader__title">Esta semana</span>
                  <span className="exploreSectionHeader__hint">próximas 48 h</span>
                </div>
                <div className="exploreList">
                  {weekItems.map((e) => (
                    <ExploreResultRow
                      key={`w-${e.id}`}
                      to={`/evento/${e.id}`}
                      avatarUrl={eventImageSrc(e)}
                      avatarFallback={initials(eventTitle(e))}
                      title={eventTitle(e)}
                      subtitle={eventSubtitle(e)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
