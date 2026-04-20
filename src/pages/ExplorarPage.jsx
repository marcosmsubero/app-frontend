import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { useMeetupSearch } from "../hooks/useMeetupSearch";
import {
  apiSearchProfiles,
  apiClubsList,
} from "../services/api";
import Avatar from "../components/ui/Avatar";
import AvatarStack from "../components/ui/AvatarStack";
import UrgencyBadge from "../components/ui/UrgencyBadge";
import { timeLabel } from "../utils/dates";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import "../styles/explorar.css";

/* ─────────────────────────────────────────────────────────────────────────
 * ExplorarPage — Matcheo-first discovery.
 *
 * Layout (see spec: Sección 1 — Estructura de Explorar):
 *   1. Sticky universal search (runners · eventos · clubs)
 *   2. "Voy a correr" CTA card — entry point for quick event creation
 *   3. Próximos imminentes (events within next 4h)
 *   4. Esta semana (events within next 48h)
 *
 * Predictive layer ("Compatibles en tu zona") and mutual-compatibility
 * filtering land in Plan 2 + Plan 3 + v1.1. This scaffold wires the UX
 * shell so the rest can be bolted on without restructuring.
 * ───────────────────────────────────────────────────────────────────── */

const IMMINENT_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours
const WEEK_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
      <path d="M12 2l1.8 5.7L19.5 9.5l-5.7 1.8L12 17l-1.8-5.7L4.5 9.5l5.7-1.8L12 2z" />
    </svg>
  );
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

function eventTitle(event) {
  return event?.title || event?.meeting_point || "Evento";
}

function spotsInfo(event) {
  const count = event?.participants_count ?? 0;
  const cap = event?.max_participants || event?.capacity || 0;
  if (!cap) return { label: `${count} inscrito${count !== 1 ? "s" : ""}`, variant: "open" };
  const left = Math.max(0, cap - count);
  if (left === 0) return { label: "Completo", variant: "hot" };
  if (left <= 3) return { label: `${left} libre${left !== 1 ? "s" : ""}`, variant: "hot" };
  if (left <= 6) return { label: `${left} libres`, variant: "warm" };
  return { label: `${count}/${cap}`, variant: "open" };
}

function RadarEventCard({ event }) {
  const imageSrc = eventImageSrc(event);
  const participants = event?.participants || [];
  const spots = typeof event?.participants_count === "number" ? spotsInfo(event) : null;
  return (
    <Link to={`/evento/${event.id}`} className="radarEventCard">
      <div className="radarEventCard__imageWrap">
        <img src={imageSrc} alt={eventTitle(event)} className="radarEventCard__image" />
      </div>
      <div className="radarEventCard__body">
        <h3 className="radarEventCard__title">{eventTitle(event)}</h3>
        <p className="radarEventCard__meta">
          {timeLabel(event.starts_at)} · {event.meeting_point || "Sin ubicación"}
        </p>
        {(event.distance_km || event.elevation_m) ? (
          <p className="radarEventCard__tech">
            {event.distance_km ? `${event.distance_km} km` : ""}
            {event.distance_km && event.elevation_m ? " · " : ""}
            {event.elevation_m ? `${event.elevation_m} D+` : ""}
          </p>
        ) : null}
        <div className="radarEventCard__social">
          {participants.length > 0 ? (
            <AvatarStack users={participants} max={3} size={20} />
          ) : null}
          {spots ? <UrgencyBadge variant={spots.variant}>{spots.label}</UrgencyBadge> : null}
        </div>
      </div>
    </Link>
  );
}

function CreateEventCTA() {
  return (
    <Link to="/crear-evento" className="radarCreateCta">
      <div className="radarCreateCta__icon">
        <IconSparkle />
      </div>
      <div className="radarCreateCta__body">
        <div className="radarCreateCta__title">Voy a correr</div>
        <div className="radarCreateCta__subtitle">
          Crea un evento rápido y que la gente cercana se apunte.
        </div>
      </div>
      <div className="radarCreateCta__arrow" aria-hidden="true">›</div>
    </Link>
  );
}

function ProfileSearchRow({ profile }) {
  const to =
    profile?.handle ? `/perfil/handle/${profile.handle}` : `/perfil/${profile.id}`;
  return (
    <Link to={to} className="exploreSearchRow">
      <Avatar
        url={profile.avatar_url}
        fallbackSeed={profile.display_name || profile.handle}
        size={40}
      />
      <div className="exploreSearchRow__body">
        <div className="exploreSearchRow__title">{profile.display_name}</div>
        {profile.handle ? (
          <div className="exploreSearchRow__subtitle">@{profile.handle}</div>
        ) : null}
      </div>
    </Link>
  );
}

function ClubSearchRow({ club }) {
  return (
    <Link to={`/clubs/${club.id}`} className="exploreSearchRow">
      <div className="exploreSearchRow__avatar exploreSearchRow__avatar--fallback">
        {(club.name || "?")[0].toUpperCase()}
      </div>
      <div className="exploreSearchRow__body">
        <div className="exploreSearchRow__title">{club.name}</div>
        {club.location ? (
          <div className="exploreSearchRow__subtitle">{club.location}</div>
        ) : null}
      </div>
    </Link>
  );
}

export default function ExplorarPage() {
  const { isAuthed, token } = useAuth();
  const { blockedIds } = useBlockedIds();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => window.clearTimeout(id);
  }, [query]);

  // Meetups stream — used for the radar sections.
  const { items } = useMeetupSearch({ only_open: true, limit: 60, offset: 0 });

  // Search — clubs + people + events.
  const [profiles, setProfiles] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setProfiles([]);
      setClubs([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    Promise.all([
      apiSearchProfiles(debouncedQuery, token).catch(() => []),
      apiClubsList(debouncedQuery, token).catch(() => []),
    ]).then(([p, c]) => {
      if (cancelled) return;
      setProfiles(Array.isArray(p) ? p : p?.items || []);
      setClubs(Array.isArray(c) ? c : c?.items || []);
      setSearching(false);
    });
    return () => {
      cancelled = true;
      setSearching(false);
    };
  }, [debouncedQuery, token]);

  const now = Date.now();

  const upcomingItems = useMemo(() => {
    return (items || [])
      .filter((item) => {
        if (!item?.starts_at) return false;
        if (item.created_by != null && blockedIds.has(String(item.created_by))) {
          return false;
        }
        const t = new Date(item.starts_at).getTime();
        return t >= now && t - now <= WEEK_WINDOW_MS;
      })
      .sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
  }, [items, blockedIds, now]);

  const imminentItems = useMemo(
    () =>
      upcomingItems.filter((item) => {
        const t = new Date(item.starts_at).getTime();
        return t - now <= IMMINENT_WINDOW_MS;
      }),
    [upcomingItems, now],
  );

  const weekItems = useMemo(
    () =>
      upcomingItems.filter((item) => {
        const t = new Date(item.starts_at).getTime();
        return t - now > IMMINENT_WINDOW_MS;
      }),
    [upcomingItems, now],
  );

  const showingSearch = Boolean(debouncedQuery);

  // Search-mode filter over upcoming events by title/meeting_point.
  const eventMatches = useMemo(() => {
    if (!showingSearch) return [];
    const needle = debouncedQuery.toLowerCase();
    return upcomingItems
      .filter(
        (e) =>
          (e.title || "").toLowerCase().includes(needle) ||
          (e.meeting_point || "").toLowerCase().includes(needle),
      )
      .slice(0, 10);
  }, [showingSearch, upcomingItems, debouncedQuery]);

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
      {/* Sticky universal search */}
      <div className="explorarPage__searchBar">
        <span className="explorarPage__searchIcon" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          className="explorarPage__searchInput"
          placeholder="Buscar corredores, clubs o eventos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar corredores, clubs o eventos"
        />
        {query ? (
          <button
            type="button"
            className="explorarPage__searchClear"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        ) : null}
      </div>

      {showingSearch ? (
        <>
          <section className="explorarPage__section">
            <h2 className="explorarPage__sectionTitle">Corredores</h2>
            {searching ? (
              <div className="explorarPage__emptyText">Buscando…</div>
            ) : profiles.length === 0 ? (
              <div className="explorarPage__emptyText">
                Ningún corredor coincide con "{debouncedQuery}".
              </div>
            ) : (
              <div className="explorarPage__list">
                {profiles.slice(0, 10).map((p) => (
                  <ProfileSearchRow key={`p-${p.id}`} profile={p} />
                ))}
              </div>
            )}
          </section>

          <section className="explorarPage__section">
            <h2 className="explorarPage__sectionTitle">Clubs</h2>
            {searching ? null : clubs.length === 0 ? (
              <div className="explorarPage__emptyText">
                Ningún club coincide con "{debouncedQuery}".
              </div>
            ) : (
              <div className="explorarPage__list">
                {clubs.slice(0, 10).map((c) => (
                  <ClubSearchRow key={`c-${c.id}`} club={c} />
                ))}
              </div>
            )}
          </section>

          <section className="explorarPage__section">
            <h2 className="explorarPage__sectionTitle">Eventos próximos</h2>
            {eventMatches.length === 0 ? (
              <div className="explorarPage__emptyText">
                Ningún evento próximo coincide con "{debouncedQuery}".
              </div>
            ) : (
              <div className="explorarPage__radarList">
                {eventMatches.map((e) => (
                  <RadarEventCard key={`e-${e.id}`} event={e} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* CTA — the first card of the radar */}
          <CreateEventCTA />

          {/* Próximos imminentes (4h) */}
          <section className="explorarPage__section">
            <div className="explorarPage__sectionHead">
              <h2 className="explorarPage__sectionTitle">Próximos imminentes</h2>
              <span className="explorarPage__sectionHint">próximas 4 h</span>
            </div>
            {imminentItems.length === 0 ? (
              <div className="explorarPage__emptyText">
                Nada en las próximas 4 h. Atrévete a publicar un evento rápido
                con el botón de arriba.
              </div>
            ) : (
              <div className="explorarPage__radarList">
                {imminentItems.map((e) => (
                  <RadarEventCard key={`im-${e.id}`} event={e} />
                ))}
              </div>
            )}
          </section>

          {/* Esta semana (48h) */}
          <section className="explorarPage__section">
            <div className="explorarPage__sectionHead">
              <h2 className="explorarPage__sectionTitle">Esta semana</h2>
              <span className="explorarPage__sectionHint">próximas 48 h</span>
            </div>
            {weekItems.length === 0 ? (
              <div className="explorarPage__emptyText">
                No hay eventos próximos en tu pool actual.
              </div>
            ) : (
              <div className="explorarPage__radarList">
                {weekItems.map((e) => (
                  <RadarEventCard key={`w-${e.id}`} event={e} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
