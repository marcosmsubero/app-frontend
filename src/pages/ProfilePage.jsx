import { Link } from "react-router-dom";
import MeetupCalendar from "../components/MeetupCalendar";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";

function formatHandle(handle) {
  const clean = String(handle || "").trim().replace(/^@+/, "");
  return clean ? `@${clean}` : "@runner";
}

function formatLocation(location) {
  const clean = String(location || "").trim();
  return clean || "Ubicación no indicada";
}

function formatBio(bio) {
  const clean = String(bio || "").trim();
  return clean || "Aún no has añadido una bio a tu perfil.";
}

function initialsFromName(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "R";
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || parts[0][0].toUpperCase();
}

function StatCard({ value, label }) {
  return (
    <div className="profilePage__statCard">
      <span className="profilePage__statValue">{value}</span>
      <span className="profilePage__statLabel">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { me, profile, meReady } = useAuth();
  const { items: meetups = [], loading: meetupsLoading, error: meetupsError } = useMyMeetups();

  if (!meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando perfil…</div>
        </div>
      </div>
    );
  }

  const displayName =
    me?.full_name ||
    profile?.full_name ||
    me?.handle ||
    profile?.handle ||
    "Tu perfil";

  const handle = me?.handle || profile?.handle || "";
  const bio = me?.bio || profile?.bio || "";
  const location = me?.location || profile?.location || "";
  const avatarUrl = me?.avatar_url || profile?.avatar_url || "";

  const followers = Number(me?.followers_count ?? 0);
  const following = Number(me?.following_count ?? 0);
  const planned = Array.isArray(meetups) ? meetups.length : 0;

  return (
    <section className="profilePage">
      <article className="app-section profilePage__hero">
        <div className="profilePage__heroTop">
          <div className="profilePage__identity">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="profilePage__avatarImage" />
            ) : (
              <div className="profilePage__avatarFallback">{initialsFromName(displayName)}</div>
            )}

            <div className="profilePage__identityCopy">
              <div className="profilePage__identityHead">
                <div className="profilePage__nameBlock">
                  <h1 className="profilePage__name">{displayName}</h1>
                  <p className="profilePage__handle">{formatHandle(handle)}</p>
                </div>

                <div className="profilePage__metaInline">
                  <span className="app-chip">Running</span>
                  <span className="app-chip app-chip--soft">{formatLocation(location)}</span>
                </div>
              </div>

              <p className="profilePage__bio">{formatBio(bio)}</p>

              <div className="profilePage__actions">
                <Link to="/ajustes" className="app-button app-button--ghost">
                  Ajustes
                </Link>
              </div>
            </div>
          </div>

          <div className="profilePage__stats">
            <StatCard value={followers} label="Seguidores" />
            <StatCard value={following} label="Seguidos" />
            <StatCard value={planned} label="Planes" />
          </div>
        </div>
      </article>

        <article className="app-section profilePage__calendarCard">
          <MeetupCalendar meetups={meetups} me={me} />
        </article>
      </div>
    </section>
  );
}
