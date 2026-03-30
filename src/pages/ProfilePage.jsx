import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import MeetupCalendar from "../components/MeetupCalendar";
import { useAuth } from "../hooks/useAuth";
import { useMyMeetups } from "../hooks/useMyMeetups";
import { useToast } from "../hooks/useToast";
import { apiUpdateProfile } from "../services/api";
import { uploadAvatarToSupabase } from "../services/storage";

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
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "R";
}

function StatCard({ value, label, to }) {
  const content = (
    <>
      <span className="profilePage__statValue">{value}</span>
      <span className="profilePage__statLabel">{label}</span>
    </>
  );

  if (!to) {
    return <div className="profilePage__statCard">{content}</div>;
  }

  return (
    <Link
      to={to}
      className="profilePage__statCard"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {content}
    </Link>
  );
}

function IconButton({ children, title, as: Component = "button", ...props }) {
  return (
    <Component
      title={title}
      aria-label={title}
      {...props}
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        display: "inline-grid",
        placeItems: "center",
        border: "1px solid var(--app-border)",
        background: "rgba(255,255,255,0.84)",
        boxShadow: "var(--shadow-xs)",
        color: "var(--app-text)",
        textDecoration: "none",
        transition:
          "transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)",
        ...props.style,
      }}
    >
      {children}
    </Component>
  );
}

function IconSettings() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.91V20a2 2 0 0 1-4 0v-.08a1 1 0 0 0-.66-.94 1 1 0 0 0-1.09.23l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.91-.6H4a2 2 0 0 1 0-4h.08a1 1 0 0 0 .94-.66 1 1 0 0 0-.23-1.09l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.91V4a2 2 0 0 1 4 0v.08a1 1 0 0 0 .66.94 1 1 0 0 0 1.09-.23l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1 1 0 0 0-.2 1.1 1 1 0 0 0 .91.6H20a2 2 0 0 1 0 4h-.08a1 1 0 0 0-.94.66 1 1 0 0 0 .23 1.09Z" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-2h6l2 2h4a2 2 0 0 1 2 2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ProfilePage() {
  const { me, profile, meReady, token, refreshMe, user } = useAuth();
  const { items: meetups = [] } = useMyMeetups();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!user?.id) {
      toast?.error?.("No se pudo identificar al usuario.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const { publicUrl } = await uploadAvatarToSupabase(file, user.id);
      await apiUpdateProfile({ avatar_url: publicUrl }, token);
      await refreshMe(token);
      toast?.success?.("Foto de perfil actualizada.");
    } catch (error) {
      toast?.error?.(error?.message || "No se pudo actualizar la foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <section className="profilePage" style={{ width: "100%" }}>
      <article className="app-section profilePage__hero">
        <div className="profilePage__heroTop">
          <div className="profilePage__identity">
            <div style={{ position: "relative", width: 104, height: 104 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="profilePage__avatarImage" />
              ) : (
                <div className="profilePage__avatarFallback">
                  {initialsFromName(displayName)}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Cambiar foto de perfil"
                aria-label="Cambiar foto de perfil"
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid var(--app-border)",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "var(--shadow-sm)",
                  color: "var(--app-text)",
                  cursor: uploadingAvatar ? "default" : "pointer",
                }}
              >
                <IconCamera />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="profilePage__identityCopy">
              <div className="profilePage__identityHead">
                <div className="profilePage__nameBlock">
                  <h1 className="profilePage__name">{displayName}</h1>
                  <p className="profilePage__handle">{formatHandle(handle)}</p>
                </div>

                <div className="profilePage__metaInline">
                  <span className="app-chip app-chip--soft">{formatLocation(location)}</span>
                </div>
              </div>

              <p className="profilePage__bio">{formatBio(bio)}</p>

              <div
                className="profilePage__actions"
                style={{ justifyContent: "flex-start", alignItems: "center" }}
              >
                <IconButton as={Link} to="/ajustes" title="Ajustes">
                  <IconSettings />
                </IconButton>

                <IconButton
                  as={Link}
                  to="/onboarding?mode=edit"
                  state={{ editProfile: true }}
                  title="Editar"
                >
                  <IconEdit />
                </IconButton>

                <span
                  style={{
                    color: "var(--app-text-faint)",
                    fontSize: "var(--font-sm)",
                    fontWeight: 600,
                  }}
                >
                  {uploadingAvatar ? "Subiendo foto…" : "Perfil"}
                </span>
              </div>
            </div>
          </div>

          <div
            className="profilePage__stats"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <StatCard value={followers} label="Seguidores" to="/perfil/seguidores" />
            <StatCard value={following} label="Seguidos" to="/perfil/seguidos" />
          </div>
        </div>
      </article>

      <div style={{ width: "100%" }}>
        <article className="app-section profilePage__calendarCard" style={{ width: "100%" }}>
          <MeetupCalendar meetups={meetups} me={me} />
        </article>
      </div>
    </section>
  );
}
