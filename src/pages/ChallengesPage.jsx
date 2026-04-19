import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n/index.jsx";
import {
  apiMyStats,
  apiClubsList,
  apiClubJoin,
  apiSearchProfiles,
  apiMyMeetups,
} from "../services/api";
import { AnalyticsEvents } from "../services/analytics";
import Avatar from "../components/ui/Avatar";
import "../styles/challenges.css";
import "../styles/clubs.css";

/* ─────────────────────────────────────────────────────────────────────────────
 * ExplorePage (formerly ChallengesPage)
 *
 * Product stabilization pass:
 *   - Removed the "retos" (challenges) concept entirely. Achievements now
 *     replace it: milestones derived from stats and event activity.
 *   - Added combined search across clubs + individual profiles.
 *   - Dropped the repeated "Explorar" section header (bottom-nav + context
 *     already label the destination).
 * ────────────────────────────────────────────────────────────────────────── */

function IconMedal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="15" r="6" />
      <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.12" />
      <path d="M12 2 8 8l4 1 4-1-4-6z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <rect width="14" height="11" x="5" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* Milestones are client-side derived from stats + hosted events. Each one
 * becomes an achievement card in the Medallero section. */
function buildAchievements({ stats, hosted }) {
  const attended = stats?.total_events_attended ?? 0;
  const distance = stats?.total_distance_km ?? 0;
  const hostedCount = hosted?.length ?? 0;
  const biggestEvent = hosted?.reduce(
    (max, m) => Math.max(max, m?.participants_count ?? 0),
    0
  ) ?? 0;

  const list = [
    {
      id: "first-event",
      title: "Primer evento",
      text: "Crea tu primer evento.",
      target: 1,
      progress: hostedCount,
    },
    {
      id: "host-5",
      title: "Cinco quedadas",
      text: "Organiza 5 eventos.",
      target: 5,
      progress: hostedCount,
    },
    {
      id: "host-20",
      title: "Veinte quedadas",
      text: "Organiza 20 eventos.",
      target: 20,
      progress: hostedCount,
    },
    {
      id: "big-10",
      title: "Grupo de 10",
      text: "Un evento con 10 asistentes.",
      target: 10,
      progress: biggestEvent,
    },
    {
      id: "big-50",
      title: "Grupo de 50",
      text: "Un evento con 50 asistentes.",
      target: 50,
      progress: biggestEvent,
    },
    {
      id: "big-100",
      title: "Grupo de 100",
      text: "Un evento con 100 asistentes.",
      target: 100,
      progress: biggestEvent,
    },
    {
      id: "attend-10",
      title: "Participación x10",
      text: "Asiste a 10 eventos.",
      target: 10,
      progress: attended,
    },
    {
      id: "distance-100",
      title: "100 km recorridos",
      text: "Suma 100 km en eventos.",
      target: 100,
      progress: Math.floor(distance),
    },
  ];

  return list.map((m) => ({
    ...m,
    unlocked: (m.progress || 0) >= m.target,
    pct: Math.max(0, Math.min(100, ((m.progress || 0) / m.target) * 100)),
  }));
}

function AchievementCard({ item }) {
  const unlocked = !!item.unlocked;
  return (
    <article className={`achievementCard${unlocked ? " is-unlocked" : ""}`}>
      <div className="achievementCard__icon" aria-hidden="true">
        {unlocked ? <IconMedal /> : <IconLock />}
      </div>
      <div className="achievementCard__body">
        <h3 className="achievementCard__title">{item.title}</h3>
        <p className="achievementCard__text">{item.text}</p>
        <div
          className="achievementCard__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={item.target}
          aria-valuenow={Math.min(item.progress, item.target)}
        >
          <span
            className="achievementCard__progressBar"
            style={{ width: `${item.pct}%` }}
          />
        </div>
        <div className="achievementCard__meta">
          {Math.min(item.progress, item.target)} / {item.target}
        </div>
      </div>
    </article>
  );
}

function useDebounced(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ClubRow({ club, onJoin, busy }) {
  return (
    <Link to={`/clubs/${club.id}`} className="searchRow">
      <Avatar src={club.logo_url} name={club.name} size="md" />
      <div className="searchRow__body">
        <div className="searchRow__title">{club.name}</div>
        {club.location ? (
          <div className="searchRow__subtitle">{club.location}</div>
        ) : null}
      </div>
      {!club.is_member ? (
        <button
          type="button"
          className="feedCard__action feedCard__action--primary searchRow__action"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onJoin(club.id);
          }}
        >
          {busy ? "…" : "Unirse"}
        </button>
      ) : null}
    </Link>
  );
}

function ProfileRow({ profile }) {
  const to = profile.handle
    ? `/perfil/handle/${encodeURIComponent(profile.handle)}`
    : `/perfil/${profile.id}`;
  return (
    <Link to={to} className="searchRow">
      <Avatar
        src={profile.avatar_url}
        name={profile.display_name}
        size="md"
      />
      <div className="searchRow__body">
        <div className="searchRow__title">{profile.display_name}</div>
        <div className="searchRow__subtitle">
          {profile.handle ? `@${profile.handle}` : null}
          {profile.location ? ` · ${profile.location}` : null}
        </div>
      </div>
    </Link>
  );
}

export default function ChallengesPage() {
  const { token, me } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

  const [stats, setStats] = useState(null);
  const [hosted, setHosted] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [clubs, setClubs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [searching, setSearching] = useState(false);
  const [clubBusyId, setClubBusyId] = useState(null);

  const searchReqId = useRef(0);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!token) return;
      setLoadingStats(true);
      try {
        const [s, myEvents] = await Promise.all([
          apiMyStats(token).catch(() => null),
          apiMyMeetups(token, { role: "host" }).catch(() => []),
        ]);
        if (!alive) return;
        setStats(s || null);
        setHosted(Array.isArray(myEvents) ? myEvents : []);
      } finally {
        if (alive) setLoadingStats(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const req = ++searchReqId.current;
    setSearching(true);
    Promise.all([
      apiClubsList(debouncedQuery, token).catch(() => []),
      debouncedQuery.trim()
        ? apiSearchProfiles(debouncedQuery, token).catch(() => [])
        : Promise.resolve([]),
    ]).then(([clubsList, profilesList]) => {
      if (req !== searchReqId.current) return;
      setClubs(Array.isArray(clubsList) ? clubsList : []);
      // Hide the current user from profile results to avoid "follow self" weirdness.
      const myProfileIds = new Set(
        (me?.profiles || []).map((p) => p.id).filter(Boolean)
      );
      setProfiles(
        (Array.isArray(profilesList) ? profilesList : []).filter(
          (p) => !myProfileIds.has(p.id)
        )
      );
      setSearching(false);
    });
  }, [debouncedQuery, token, me]);

  async function handleJoinClub(clubId) {
    setClubBusyId(clubId);
    try {
      await apiClubJoin(clubId, token);
      AnalyticsEvents.clubJoined?.(clubId);
      toast?.success?.(t("clubs.joined") || "Te has unido");
      const clubsList = await apiClubsList(debouncedQuery, token).catch(() => []);
      setClubs(Array.isArray(clubsList) ? clubsList : []);
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setClubBusyId(null);
    }
  }

  const achievements = useMemo(
    () => buildAchievements({ stats, hosted }),
    [stats, hosted]
  );

  const showClubsEmpty = !searching && clubs.length === 0 && debouncedQuery;
  const showProfilesEmpty =
    !searching && profiles.length === 0 && debouncedQuery;

  return (
    <section className="page explorePage">
      {/* Combined search — clubs + people */}
      <section className="sectionBlock">
        <div className="exploreSearchBar">
          <span className="exploreSearchBar__icon" aria-hidden="true">
            <IconSearch />
          </span>
          <input
            type="search"
            className="exploreSearchBar__input"
            placeholder="Busca clubs o corredores"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar clubs o corredores"
          />
        </div>
      </section>

      {/* Search results */}
      {debouncedQuery ? (
        <>
          <section className="sectionBlock">
            <h2 className="exploreSection__title">Corredores</h2>
            {searching ? (
              <div className="stateCard">
                <p className="stateCard__text">Buscando…</p>
              </div>
            ) : showProfilesEmpty ? (
              <div className="stateCard">
                <p className="stateCard__text">
                  Ningún corredor coincide con "{debouncedQuery}".
                </p>
              </div>
            ) : (
              <div className="searchList">
                {profiles.map((p) => (
                  <ProfileRow key={`p-${p.id}`} profile={p} />
                ))}
              </div>
            )}
          </section>

          <section className="sectionBlock">
            <h2 className="exploreSection__title">Clubs</h2>
            {searching ? null : showClubsEmpty ? (
              <div className="stateCard">
                <p className="stateCard__text">
                  Ningún club coincide con "{debouncedQuery}".
                </p>
              </div>
            ) : (
              <div className="searchList">
                {clubs.slice(0, 10).map((c) => (
                  <ClubRow
                    key={`c-${c.id}`}
                    club={c}
                    onJoin={handleJoinClub}
                    busy={clubBusyId === c.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Medallero — achievements instead of retos */}
          <section className="sectionBlock">
            <h2 className="exploreSection__title">Medallero</h2>
            {loadingStats ? (
              <div className="stateCard">
                <p className="stateCard__text">Cargando…</p>
              </div>
            ) : (
              <div className="achievementsGrid">
                {achievements.map((item) => (
                  <AchievementCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Popular clubs directory snippet when not searching */}
          <section className="sectionBlock">
            <div className="exploreSection__header">
              <h2 className="exploreSection__title">Clubs</h2>
              <Link to="/clubs" className="exploreSection__link">
                Ver todos
              </Link>
            </div>
            {clubs.length === 0 ? (
              <div className="stateCard">
                <p className="stateCard__text">
                  Todavía no hay clubs cercanos. Busca uno o crea el tuyo desde la sección Clubs.
                </p>
              </div>
            ) : (
              <div className="searchList">
                {clubs.slice(0, 5).map((c) => (
                  <ClubRow
                    key={`home-c-${c.id}`}
                    club={c}
                    onJoin={handleJoinClub}
                    busy={clubBusyId === c.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
