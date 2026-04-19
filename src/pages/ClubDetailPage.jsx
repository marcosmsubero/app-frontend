import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n/index.jsx";
import {
  apiClubGet,
  apiClubJoin,
  apiClubLeave,
  apiClubWall,
  apiClubWallPost,
  apiClubMembers,
  apiClubCreateEvent,
  apiClubUpdate,
} from "../services/api";
import { uploadAvatarToSupabase } from "../services/storage";
import { AnalyticsEvents } from "../services/analytics";
import "../styles/clubs.css";
import "../styles/club-detail.css";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} d`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

function getDateGroup(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hoy";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    }
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ClubDetailPage() {
  const { clubId } = useParams();
  const { token, me } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const nav = useNavigate();

  const [club, setClub] = useState(null);
  const [wall, setWall] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("wall");
  const { blockedIds } = useBlockedIds();

  const visibleMembers = useMemo(
    () =>
      (members || []).filter((m) => {
        const uid = m?.user_id ?? m?.user?.id;
        if (uid == null) return true;
        return !blockedIds.has(String(uid));
      }),
    [members, blockedIds]
  );

  const visibleWall = useMemo(
    () =>
      (wall || []).filter((p) => {
        const uid = p?.author_user_id ?? p?.author?.id;
        if (uid == null) return true;
        return !blockedIds.has(String(uid));
      }),
    [wall, blockedIds]
  );

  // Post form
  const [postBody, setPostBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);

  // Likes state (local)
  const [likes, setLikes] = useState({});

  // Event creation form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "",
    meeting_point: "",
  });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Edit club form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    location: "",
    is_private: false,
  });
  const [editingClub, setEditingClub] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!token || !clubId) return;
    setLoading(true);
    setError("");
    try {
      const [clubData, wallData, membersData] = await Promise.all([
        apiClubGet(clubId, token),
        apiClubWall(clubId, token).catch(() => []),
        apiClubMembers(clubId, token).catch(() => []),
      ]);
      setClub(clubData);
      setWall(Array.isArray(wallData) ? wallData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Initialize edit form with club data
      if (clubData) {
        setEditForm({
          display_name: clubData.display_name || "",
          bio: clubData.bio || "",
          location: clubData.location || "",
          is_private: clubData.is_private || false,
        });
      }
    } catch (e) {
      setError(e?.message || t("general.error"));
    } finally {
      setLoading(false);
    }
  }, [token, clubId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    if (!club) return;
    setBusy(true);
    try {
      await apiClubJoin(club.id, token);
      AnalyticsEvents.clubJoined?.(club.id);
      toast?.success?.(t("clubs.joined"));
      await load();
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!club) return;
    setBusy(true);
    try {
      await apiClubLeave(club.id, token);
      toast?.success?.(t("clubs.left"));
      await load();
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    const body = postBody.trim();
    if (!body || !club) return;

    setPosting(true);
    try {
      await apiClubWallPost(club.id, { body }, token);
      setPostBody("");
      toast?.success?.(t("clubs.posted"));
      await load();
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setPosting(false);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!club || !eventForm.title || !eventForm.date || !eventForm.time)
      return;

    setCreatingEvent(true);
    try {
      const startDateTime = `${eventForm.date}T${eventForm.time}:00`;
      const payload = {
        title: eventForm.title,
        starts_at: startDateTime,
        meeting_point: eventForm.meeting_point || null,
      };
      await apiClubCreateEvent(club.id, payload, token);
      setEventForm({ title: "", date: "", time: "", meeting_point: "" });
      setShowEventForm(false);
      toast?.success?.(t("clubs.eventCreated"));
      await load();
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleUpdateClub(e) {
    e.preventDefault();
    if (!club) return;

    setEditingClub(true);
    try {
      const payload = {
        display_name: editForm.display_name || club.display_name,
        bio: editForm.bio || "",
        location: editForm.location || "",
        is_private: editForm.is_private,
      };
      await apiClubUpdate(club.id, payload, token);
      toast?.success?.(t("clubs.updated"));
      setShowEditForm(false);
      await load();
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setEditingClub(false);
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !club) return;

    setUploadingAvatar(true);
    try {
      const { publicUrl } = await uploadAvatarToSupabase(file, `club_${club.id}`);
      await apiClubUpdate(club.id, { avatar_url: publicUrl }, token);
      toast?.success?.("Avatar del club actualizado");
      await load();
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo subir el avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function toggleLike(postId) {
    setLikes((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }

  if (loading) {
    return (
      <section className="page clubsPage clubDetailPage">
        <div className="stateCard">
          <h3 className="stateCard__title">{t("general.loading")}</h3>
        </div>
      </section>
    );
  }

  if (error || !club) {
    return (
      <section className="page clubsPage clubDetailPage">
        <div className="stateCard">
          <h3 className="stateCard__title">{t("general.error")}</h3>
          <p className="stateCard__text">{error || "Club no encontrado."}</p>
          <button
            type="button"
            className="feedCard__action"
            onClick={() => nav("/clubs")}
          >
            {t("general.back")}
          </button>
        </div>
      </section>
    );
  }

  const isMember = club.is_member;
  const isAdmin = club.my_role === "admin";
  const memberCount = club.members_count || members.length;

  return (
    <section className="page clubsPage clubDetailPage">
      {/* Header */}
      <section className="sectionBlock">
        {showEditForm ? (
          <form className="clubEditForm" onSubmit={handleUpdateClub}>
            <h2 className="clubEditForm__title">Editar club</h2>
            <div className="clubEditForm__field">
              <label className="clubEditForm__label">Nombre</label>
              <input
                type="text"
                className="clubEditForm__input"
                value={editForm.display_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, display_name: e.target.value })
                }
              />
            </div>
            <div className="clubEditForm__field">
              <label className="clubEditForm__label">Bio</label>
              <textarea
                className="clubEditForm__input"
                rows="3"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
              />
            </div>
            <div className="clubEditForm__field">
              <label className="clubEditForm__label">Ubicación</label>
              <input
                type="text"
                className="clubEditForm__input"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>
            <div className="clubEditForm__field">
              <label className="clubEditForm__checkbox">
                <input
                  type="checkbox"
                  checked={editForm.is_private}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_private: e.target.checked })
                  }
                />
                <span>Club privado</span>
              </label>
            </div>
            <div className="clubEditForm__actions">
              <button
                type="button"
                className="feedCard__action"
                onClick={() => setShowEditForm(false)}
                disabled={editingClub}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="feedCard__action feedCard__action--primary"
                disabled={editingClub || !editForm.display_name.trim()}
              >
                {editingClub ? t("general.loading") : "Guardar"}
              </button>
            </div>
          </form>
        ) : (
          <article className="clubDetailHeader clubDetailHeader--profile">
            {/* Avatar with upload for admins */}
            <div className="clubDetailHeader__avatarWrap">
              <div className="clubDetailHeader__avatar">
                {club.avatar_url ? (
                  <img src={club.avatar_url} alt={club.display_name} />
                ) : (
                  <div className="clubDetailHeader__avatarFallback">
                    {(club.display_name || "C").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="clubDetailHeader__avatarEditBtn"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Cambiar avatar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>
                    </svg>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="srOnly"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                </>
              )}
              {uploadingAvatar && <div className="clubDetailHeader__uploadingBadge">Subiendo...</div>}
              {club.is_private && (
                <div className="clubDetailHeader__privateBadge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Privado
                </div>
              )}
            </div>

            {/* Profile-like info */}
            <div className="clubDetailHeader__body">
              <h1 className="clubDetailHeader__name">{club.display_name}</h1>
              {club.handle ? (
                <div className="clubDetailHeader__handle">@{club.handle}</div>
              ) : null}

              {club.bio ? (
                <p className="clubDetailHeader__bio">{club.bio}</p>
              ) : (
                <p className="clubDetailHeader__bio clubDetailHeader__bio--empty">Sin descripción</p>
              )}

              <div className="clubDetailHeader__meta">
                <span className="clubDetailHeader__metaItem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {memberCount}{" "}
                  {memberCount === 1 ? t("clubs.member") : t("clubs.memberPlural")}
                </span>
                {club.location ? (
                  <span className="clubDetailHeader__metaItem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {club.location}
                  </span>
                ) : null}
                {club.my_role ? (
                  <span className="clubDetailHeader__metaItem clubDetailHeader__role">
                    {club.my_role}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action buttons */}
            <div className="clubDetailHeader__actions">
              {isAdmin && (
                <button
                  type="button"
                  className="clubDetailHeader__actionBtn clubDetailHeader__actionBtn--secondary"
                  onClick={() => setShowEditForm(true)}
                >
                  Editar club
                </button>
              )}
              {isMember ? (
                <button
                  type="button"
                  className="clubDetailHeader__actionBtn"
                  disabled={busy}
                  onClick={handleLeave}
                >
                  {t("clubs.leave") || "Salir"}
                </button>
              ) : (
                <button
                  type="button"
                  className="clubDetailHeader__actionBtn clubDetailHeader__actionBtn--primary"
                  disabled={busy}
                  onClick={handleJoin}
                >
                  {t("clubs.join")}
                </button>
              )}
            </div>
          </article>
        )}
      </section>

      {/* Tabs */}
      <section className="sectionBlock">
        <div className="clubDetailTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "wall"}
            className={`clubDetailTabs__btn ${
              tab === "wall" ? "is-active" : ""
            }`}
            onClick={() => setTab("wall")}
          >
            {t("clubs.tabWall") || "Muro"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "events"}
            className={`clubDetailTabs__btn ${
              tab === "events" ? "is-active" : ""
            }`}
            onClick={() => setTab("events")}
          >
            {t("clubs.tabEvents") || "Eventos"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "members"}
            className={`clubDetailTabs__btn ${
              tab === "members" ? "is-active" : ""
            }`}
            onClick={() => setTab("members")}
          >
            {t("clubs.tabMembers") || "Miembros"}
          </button>
        </div>
      </section>

      {/* Wall tab */}
      {tab === "wall" ? (
        <section className="sectionBlock">
          {club.is_private && !isMember ? (
            <div className="clubPrivateBanner">
              <div className="clubPrivateBanner__icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="clubPrivateBanner__text">
                Este club es privado. Solicita unirte para ver el contenido.
              </p>
            </div>
          ) : isMember ? (
            <>
              <form className="clubCompose" onSubmit={handlePost}>
                <div className="clubCompose__avatar">
                  {me?.avatar_url ? (
                    <img src={me.avatar_url} alt="" />
                  ) : (
                    <div className="clubCompose__avatarFallback">
                      {(me?.display_name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="clubCompose__content">
                  <textarea
                    className="clubCompose__input"
                    placeholder="¿Qué está pasando?!"
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    maxLength={1000}
                  />
                  <div className="clubCompose__footer">
                    <span className="clubCompose__charCount">
                      {postBody.length}/1000
                    </span>
                    <button
                      type="submit"
                      className="clubCompose__submitBtn"
                      disabled={posting || !postBody.trim()}
                    >
                      {posting ? t("general.loading") : "Publicar"}
                    </button>
                  </div>
                </div>
              </form>

              {visibleWall.length === 0 ? (
                <div className="stateCard">
                  <h3 className="stateCard__title">
                    {t("clubs.wallEmpty") ||
                      "Todavía no hay publicaciones"}
                  </h3>
                  <p className="stateCard__text">
                    {t("clubs.wallEmptyText") ||
                      "Sé la primera persona en compartir algo."}
                  </p>
                </div>
              ) : (
                <div className="clubWallList">
                  {visibleWall.map((post, idx) => {
                    const authorName =
                      post.author?.display_name || `#${post.author_user_id}`;
                    const authorInitial = (authorName || "?")
                      .slice(0, 1)
                      .toUpperCase();
                    const currentDate = getDateGroup(post.created_at);
                    const prevDate =
                      idx > 0
                        ? getDateGroup(wall[idx - 1].created_at)
                        : null;
                    const showDateSeparator = currentDate !== prevDate;

                    return (
                      <div key={post.id}>
                        {showDateSeparator && (
                          <div className="clubWallDateSeparator">
                            {currentDate}
                          </div>
                        )}
                        <article className="clubWallPost">
                          <Link
                            to={`/perfil/${post.author_user_id}`}
                            className="clubWallPost__avatarLink"
                          >
                            {post.author?.avatar_url ? (
                              <img
                                className="clubWallPost__avatar"
                                src={post.author.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="clubWallPost__avatar clubWallPost__avatar--fallback">
                                {authorInitial}
                              </div>
                            )}
                          </Link>

                          <div className="clubWallPost__body">
                            <Link
                              to={`/perfil/${post.author_user_id}`}
                              className="clubWallPost__header"
                            >
                              <span className="clubWallPost__authorName">
                                {authorName}
                              </span>
                              {post.author_user_id === me?.id && (
                                <span className="clubWallPost__you">tú</span>
                              )}
                              <span className="clubWallPost__time">
                                {relativeTime(post.created_at)}
                              </span>
                            </Link>

                            <p className="clubWallPost__text">{post.body}</p>

                            {post.image_url && (
                              <img
                                className="clubWallPost__image"
                                src={post.image_url}
                                alt=""
                              />
                            )}

                            <div className="clubWallPost__actions">
                              <button
                                type="button"
                                className={`clubWallPost__actionBtn clubWallPost__likeBtn ${
                                  likes[post.id]
                                    ? "clubWallPost__likeBtn--liked"
                                    : ""
                                }`}
                                onClick={() => toggleLike(post.id)}
                                title="Me gusta"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill={likes[post.id] ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="clubWallPost__actionBtn"
                                title="Responder"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="clubWallPost__actionBtn"
                                title="Compartir"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="18" cy="5" r="3" />
                                  <circle cx="6" cy="12" r="3" />
                                  <circle cx="18" cy="19" r="3" />
                                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="stateCard">
              <p className="stateCard__text">
                {t("clubs.mustJoinToPost") ||
                  "Únete al club para publicar en el muro."}
              </p>
            </div>
          )}
        </section>
      ) : null}

      {/* Events tab */}
      {tab === "events" ? (
        <section className="sectionBlock">
          {isAdmin && (
            <div className="clubEventsHeader">
              {showEventForm ? (
                <form className="clubEventForm" onSubmit={handleCreateEvent}>
                  <h2 className="clubEventForm__title">Crear evento</h2>
                  <div className="clubEventForm__field">
                    <label className="clubEventForm__label">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                        <polyline points="16 2 16 6 8 6 8 2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Título
                    </label>
                    <input
                      type="text"
                      className="clubEventForm__input"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      placeholder="Nombre del evento"
                    />
                  </div>
                  <div className="clubEventForm__row">
                    <div className="clubEventForm__field">
                      <label className="clubEventForm__label">Fecha</label>
                      <input
                        type="date"
                        className="clubEventForm__input"
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="clubEventForm__field">
                      <label className="clubEventForm__label">Hora</label>
                      <input
                        type="time"
                        className="clubEventForm__input"
                        value={eventForm.time}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, time: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="clubEventForm__field">
                    <label className="clubEventForm__label">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Punto de encuentro
                    </label>
                    <input
                      type="text"
                      className="clubEventForm__input"
                      value={eventForm.meeting_point}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          meeting_point: e.target.value,
                        })
                      }
                      placeholder="Ubicación (opcional)"
                    />
                  </div>
                  <div className="clubEventForm__actions">
                    <button
                      type="button"
                      className="feedCard__action"
                      onClick={() => setShowEventForm(false)}
                      disabled={creatingEvent}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="feedCard__action feedCard__action--primary"
                      disabled={
                        creatingEvent ||
                        !eventForm.title.trim() ||
                        !eventForm.date ||
                        !eventForm.time
                      }
                    >
                      {creatingEvent ? t("general.loading") : "Crear"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="feedCard__action feedCard__action--primary"
                  onClick={() => setShowEventForm(true)}
                >
                  Crear evento
                </button>
              )}
            </div>
          )}

          {(club.upcoming_events || []).length === 0 ? (
            <div className="stateCard">
              <h3 className="stateCard__title">
                {t("clubs.eventsEmpty") || "Sin eventos próximos"}
              </h3>
              <p className="stateCard__text">
                {t("clubs.eventsEmptyText") ||
                  "Cuando el club organice quedadas, aparecerán aquí."}
              </p>
            </div>
          ) : (
            <div className="clubEventsList">
              {club.upcoming_events.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/evento/${ev.id}`}
                  className="clubEventRow"
                >
                  <div className="clubEventRow__icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                      <polyline points="16 2 16 6 8 6 8 2" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="clubEventRow__body">
                    <div className="clubEventRow__title">{ev.title}</div>
                    <div className="clubEventRow__details">
                      <span className="clubEventRow__date">
                        {formatDate(ev.starts_at)}
                      </span>
                      {ev.meeting_point && (
                        <>
                          <span className="clubEventRow__separator">·</span>
                          <span className="clubEventRow__location">
                            {ev.meeting_point}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Members tab */}
      {tab === "members" ? (
        <section className="sectionBlock">
          {visibleMembers.length === 0 ? (
            <div className="stateCard">
              <h3 className="stateCard__title">
                {t("clubs.membersEmpty") || "Sin miembros"}
              </h3>
            </div>
          ) : (
            <div className="clubMembersList">
              {visibleMembers.map((m) => {
                const name = m.user?.display_name || `#${m.user_id}`;
                const initial = (name || "?").slice(0, 1).toUpperCase();
                return (
                  <Link
                    key={m.user_id}
                    to={`/perfil/${m.user_id}`}
                    className="clubMemberRow"
                  >
                    {m.user?.avatar_url ? (
                      <img
                        className="clubMemberRow__avatar"
                        src={m.user.avatar_url}
                        alt=""
                      />
                    ) : (
                      <div className="clubMemberRow__avatar clubMemberRow__avatar--fallback">
                        {initial}
                      </div>
                    )}
                    <div className="clubMemberRow__body">
                      <div className="clubMemberRow__name">{name}</div>
                      <div className="clubMemberRow__role">
                        {m.user?.handle ? `@${m.user.handle} · ` : ""}
                        {m.role}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
