import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { useToast } from "../hooks/useToast";
import {
  apiGetMeetup,
  apiJoinMeetup,
  apiLeaveMeetup,
  apiDeleteMyMeetup,
  apiDMCreateThread,
  apiDMSend,
  apiDMThreads,
  apiSearchProfiles,
} from "../services/api";
import { AnalyticsEvents } from "../services/analytics";
import { timeLabel, localDayKey } from "../utils/dates";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import "../styles/event-detail.css";
import ImageViewer from "../components/ui/ImageViewer";
import BottomSheet from "../components/ui/BottomSheet";
import haptic from "../utils/haptic";

function eventTypeKey(event) {
  return String(event?.event_type || "").trim().toLowerCase();
}

function eventTypeLabel(event) {
  const type = eventTypeKey(event);
  if (type === "carrera") return "Carrera";
  if (type === "vibe") return "Vibe";
  if (type === "quedada") return "Quedada";
  return "Entrenamiento";
}

function eventImageSrc(event) {
  const uploaded = event?.image_url;
  if (uploaded) return uploaded;

  const type = eventTypeKey(event);
  if (type === "carrera") return finishlineImage;
  if (type === "vibe") return partyImage;
  return shoesImage;
}

function formatFullDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
  const formatted = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${formatted}`;
}

function initialsFromName(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
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

function CalendarIcon() {
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
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function UsersIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShareEventSheet({ open, onClose, token, onShareExternal, onShareToUser }) {
  const [mode, setMode] = useState("root"); // "root" | "user"
  const [threads, setThreads] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("root");
      setQuery("");
      setSearchResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (mode !== "user" || !token) return;
    let cancelled = false;
    setLoadingThreads(true);
    apiDMThreads("", token)
      .then((res) => {
        if (cancelled) return;
        setThreads(Array.isArray(res) ? res : res?.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingThreads(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, token]);

  useEffect(() => {
    if (mode !== "user" || !token) return;
    const needle = query.trim();
    if (needle.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      apiSearchProfiles(needle, token)
        .then((res) => {
          if (cancelled) return;
          setSearchResults(Array.isArray(res) ? res : res?.items || []);
        })
        .catch(() => {});
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, mode, token]);

  if (mode === "user") {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredThreads = normalizedQuery
      ? threads.filter((t) =>
          String(t.name || "").toLowerCase().includes(normalizedQuery)
        )
      : threads;

    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Enviar a usuario"
        ariaLabel="Enviar a usuario"
      >
        <div className="shareSheet__searchRow">
          <input
            type="search"
            className="app-input"
            placeholder="Buscar contacto o usuario"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="app-button app-button--ghost app-button--sm"
            onClick={() => setMode("root")}
          >
            Atrás
          </button>
        </div>

        <div className="shareSheet__list">
          {filteredThreads.map((t) => (
            <button
              key={`thread-${t.id}`}
              type="button"
              className="shareSheet__row"
              onClick={() => onShareToUser(t.other_user_id)}
              disabled={!t.other_user_id}
            >
              <div className="shareSheet__avatar">
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt={t.name} />
                ) : (
                  <span>{(t.name || "U").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="shareSheet__info">
                <span className="shareSheet__name">{t.name}</span>
                {t.other_handle ? (
                  <span className="shareSheet__handle">@{t.other_handle}</span>
                ) : null}
              </div>
            </button>
          ))}

          {loadingThreads && filteredThreads.length === 0 ? (
            <p className="shareSheet__muted">Cargando…</p>
          ) : null}

          {!loadingThreads && filteredThreads.length === 0 && searchResults.length === 0 ? (
            <p className="shareSheet__muted">
              {query.trim().length >= 2
                ? "Sin resultados"
                : "Empieza a escribir para buscar usuarios"}
            </p>
          ) : null}

          {searchResults.length > 0 ? (
            <>
              <div className="shareSheet__sectionLabel">Otros usuarios</div>
              {searchResults.map((p) => (
                <button
                  key={`profile-${p.id}`}
                  type="button"
                  className="shareSheet__row"
                  onClick={() => onShareToUser(p.user_id)}
                  disabled={!p.user_id}
                >
                  <div className="shareSheet__avatar">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.display_name} />
                    ) : (
                      <span>
                        {(p.display_name || p.handle || "U").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="shareSheet__info">
                    <span className="shareSheet__name">
                      {p.display_name || p.handle}
                    </span>
                    {p.handle ? (
                      <span className="shareSheet__handle">@{p.handle}</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Compartir evento"
      ariaLabel="Opciones de compartir"
    >
      <div className="shareSheet__options">
        <button
          type="button"
          className="shareSheet__option"
          onClick={() => setMode("user")}
        >
          <span className="shareSheet__optionIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="shareSheet__optionBody">
            <span className="shareSheet__optionTitle">Enviar a un usuario</span>
            <span className="shareSheet__optionText">
              Comparte el evento por chat dentro de la app.
            </span>
          </span>
          <span className="shareSheet__optionArrow" aria-hidden="true">›</span>
        </button>

        <button
          type="button"
          className="shareSheet__option"
          onClick={onShareExternal}
        >
          <span className="shareSheet__optionIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </span>
          <span className="shareSheet__optionBody">
            <span className="shareSheet__optionTitle">Compartir enlace</span>
            <span className="shareSheet__optionText">
              Comparte fuera de la app o copia el enlace.
            </span>
          </span>
          <span className="shareSheet__optionArrow" aria-hidden="true">›</span>
        </button>
      </div>
    </BottomSheet>
  );
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, me } = useAuth();
  const { blockedIds, isBlocked } = useBlockedIds();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [heroTab, setHeroTab] = useState("organizer"); // "image" | "organizer"
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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
          AnalyticsEvents.eventViewed?.(eventId);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "No se pudo cargar el evento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, token]);

  async function handleJoin() {
    setJoining(true);
    try {
      await apiJoinMeetup(eventId, token);
      haptic.tick();
      AnalyticsEvents.eventJoined?.(eventId);
      const data = await apiGetMeetup(eventId, token);
      setEvent(data);
      toast?.success?.("Te has unido al evento.");
    } catch (err) {
      haptic.warn();
      toast?.error?.(err?.message || "No se pudo unir al evento.");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await apiLeaveMeetup(eventId, token);
      haptic.tick();
      AnalyticsEvents.eventLeft?.(eventId);
      const data = await apiGetMeetup(eventId, token);
      setEvent(data);
      toast?.success?.("Has salido del evento.");
    } catch (err) {
      haptic.warn();
      toast?.error?.(err?.message || "No se pudo salir del evento.");
    } finally {
      setLeaving(false);
    }
  }

  async function handleDelete() {
    const title = event?.title || event?.meeting_point || "este evento";
    const accepted = window.confirm(`¿Seguro que quieres borrar "${title}"?`);
    if (!accepted) return;

    try {
      await apiDeleteMyMeetup(eventId, token);
      toast?.success?.("Evento eliminado.");
      navigate("/eventos", { replace: true });
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo eliminar el evento.");
    }
  }

  function handleEdit() {
    const dayKey = event?.starts_at ? localDayKey(event.starts_at) : "";
    navigate(
      `/crear-evento?edit=${encodeURIComponent(eventId)}${
        dayKey ? `&day=${encodeURIComponent(dayKey)}` : ""
      }`
    );
  }

  function handleOpenShare() {
    setShareOpen(true);
  }

  function buildShareText() {
    const title = event?.title || event?.meeting_point || "Evento RunVibe";
    return `${title} — ${formatFullDate(event?.starts_at)} · ${timeLabel(
      event?.starts_at
    )}\n${window.location.href}`;
  }

  async function handleShareExternal() {
    const title = event?.title || event?.meeting_point || "Evento RunVibe";
    const text = `${title} — ${formatFullDate(event?.starts_at)} · ${timeLabel(
      event?.starts_at
    )}`;
    const url = window.location.href;

    setShareOpen(false);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast?.success?.("Enlace copiado al portapapeles.");
      } catch {
        toast?.error?.("No se pudo copiar el enlace.");
      }
    }
  }

  async function handleShareToUser(targetUserId) {
    if (!targetUserId) return;
    try {
      const thread = await apiDMCreateThread(targetUserId, token);
      if (!thread?.id) throw new Error("No se pudo abrir el chat.");
      await apiDMSend(thread.id, buildShareText(), token);
      setShareOpen(false);
      toast?.success?.("Enviado");
      navigate(`/mensajes/${thread.id}`);
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo enviar.");
    }
  }

  async function handleContactCreator() {
    const creatorUserId = event?.created_by;
    if (!creatorUserId || dmLoading) return;

    setDmLoading(true);
    try {
      const result = await apiDMCreateThread(creatorUserId, token);
      if (result?.id) {
        navigate(`/mensajes/${result.id}`);
      }
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo iniciar la conversación.");
    } finally {
      setDmLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="page eventDetailPage">
        <div className="eventDetailLoading">
          <div className="app-loader-screen__spinner" />
          <p>Cargando evento…</p>
        </div>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="page eventDetailPage">
        <div className="eventDetailError">
          <h2>No se encontró el evento</h2>
          <p>{error || "El evento no existe o no tienes acceso."}</p>
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

  const creator = event.creator_profile || event.host_profile || {};
  const creatorName =
    creator.name ||
    event.creator_profile_name ||
    event.host_profile_name ||
    "Perfil";
  const creatorHandle =
    creator.handle ||
    event.creator_profile_handle ||
    event.host_profile_handle ||
    "";
  const creatorAvatar =
    creator.avatar_url ||
    event.creator_profile_avatar_url ||
    event.host_profile_avatar_url ||
    "";
  const creatorId =
    creator.id || event.creator_profile_id || event.host_profile_id;

  const imageSrc = eventImageSrc(event);
  const hasCoords =
    Number.isFinite(Number(event.latitude)) &&
    Number.isFinite(Number(event.longitude));

  const myUserId = me?.id || me?.supabase_user_id;
  const isCreator =
    Boolean(event.can_edit) ||
    Boolean(event.can_delete) ||
    (event.created_by != null && myUserId != null && String(event.created_by) === String(myUserId));
  const creatorBlocked = !isCreator && event.created_by != null && isBlocked(event.created_by);

  if (creatorBlocked) {
    return (
      <section className="page eventDetailPage">
        <div className="eventDetailError">
          <h2>Evento oculto</h2>
          <p>
            No puedes ver este evento porque has bloqueado a quien lo organiza.
            Puedes gestionar tus bloqueos desde Ajustes → Privacidad → Usuarios bloqueados.
          </p>
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

  const isJoined = isCreator || Boolean(event.is_joined);
  const isFull = event.status === "full";
  const isCancelled = event.status === "cancelled";
  const isDone = event.status === "done";
  const isPast =
    event.starts_at && new Date(event.starts_at).getTime() < Date.now();
  const canJoin =
    !isCreator && !isJoined && !isFull && !isCancelled && !isDone && !isPast;
  const canLeave = isJoined && !isCreator && !isCancelled && !isDone;

  return (
    <section className="page eventDetailPage">
      {imageViewerOpen ? (
        <ImageViewer
          src={imageSrc}
          alt={event.title || event.meeting_point || "Evento"}
          onClose={() => setImageViewerOpen(false)}
        />
      ) : null}
      <ShareEventSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        token={token}
        onShareExternal={handleShareExternal}
        onShareToUser={handleShareToUser}
      />


      <div className="eventDetailHeroPanel">
        <div
          className="eventDetailHeroPanel__tabs"
          role="tablist"
          aria-label="Cabecera del evento"
        >
          <button
            type="button"
            role="tab"
            aria-selected={heroTab === "organizer"}
            className={`eventDetailHeroPanel__tab${heroTab === "organizer" ? " is-active" : ""}`}
            onClick={() => setHeroTab("organizer")}
          >
            Organizador
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={heroTab === "image"}
            className={`eventDetailHeroPanel__tab${heroTab === "image" ? " is-active" : ""}`}
            onClick={() => setHeroTab("image")}
          >
            Imagen
          </button>
        </div>

        {heroTab === "organizer" ? (
          <Link
            to={creatorId ? `/perfil/${creatorId}` : "#"}
            className="eventDetailHero eventDetailHero--organizer"
            role="tabpanel"
          >
            <div className="eventDetailHeroOrganizer">
              {creatorAvatar ? (
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="eventDetailHeroOrganizer__avatar"
                />
              ) : (
                <div className="eventDetailHeroOrganizer__avatar eventDetailHeroOrganizer__avatar--fallback">
                  {initialsFromName(creatorName)}
                </div>
              )}
              <div className="eventDetailHeroOrganizer__info">
                <span className="eventDetailHeroOrganizer__label">
                  Organiza
                </span>
                <span className="eventDetailHeroOrganizer__name">
                  {creatorName}
                </span>
                {creatorHandle ? (
                  <span className="eventDetailHeroOrganizer__handle">
                    {creatorHandle.startsWith("@")
                      ? creatorHandle
                      : `@${creatorHandle}`}
                  </span>
                ) : null}
              </div>
              <span
                className="eventDetailHeroOrganizer__arrow"
                aria-hidden="true"
              >
                ›
              </span>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            className="eventDetailHero eventDetailHero--image"
            role="tabpanel"
            onClick={() => setImageViewerOpen(true)}
            aria-label="Ampliar imagen"
          >
            <img
              src={imageSrc}
              alt={event.title || event.meeting_point || "Evento"}
              className="eventDetailHero__image"
            />
            <div className="eventDetailHero__overlay">
              <span className="eventDetailHero__badge">
                {eventTypeLabel(event)}
              </span>
            </div>
          </button>
        )}
      </div>

      <div className="eventDetailBody">
        <div className="eventDetailTitleRow">
          <h1 className="eventDetailTitle">
            {event.title || event.meeting_point || "Evento"}
          </h1>
          <button
            type="button"
            className="eventDetailShareBtn"
            onClick={handleOpenShare}
            aria-label="Compartir"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </button>
        </div>

        {event.status && event.status !== "open" ? (
          <div className={`eventDetailStatus eventDetailStatus--${event.status}`}>
            {event.status === "full" && "Completo"}
            {event.status === "cancelled" && "Cancelado"}
            {event.status === "done" && "Finalizado"}
          </div>
        ) : null}

        <div className="eventDetailMeta">
          <div className="eventDetailMetaRow">
            <CalendarIcon />
            <span>
              {formatFullDate(event.starts_at)} · {timeLabel(event.starts_at)}
            </span>
          </div>

          <div className="eventDetailMetaRow">
            <MapPinIcon />
            <span>{event.meeting_point || "Sin ubicación"}</span>
          </div>

          {event.distance_km || event.elevation_m || event.training_type ? (
            <div className="eventDetailTechStats">
              {event.training_type ? (
                <div className="eventDetailStatChip eventDetailStatChip--training">
                  <span className="eventDetailStatChip__value">
                    {event.training_type === "series"
                      ? "Series"
                      : event.training_type === "carrera_continua"
                      ? "Carrera continua"
                      : event.training_type}
                  </span>
                </div>
              ) : null}
              {event.distance_km ? (
                <div className="eventDetailStatChip">
                  <span className="eventDetailStatChip__value">
                    {event.distance_km}
                  </span>
                  <span className="eventDetailStatChip__unit">km</span>
                </div>
              ) : null}
              {event.elevation_m ? (
                <div className="eventDetailStatChip">
                  <span className="eventDetailStatChip__value">
                    {event.elevation_m}
                  </span>
                  <span className="eventDetailStatChip__unit">D+</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {event.pace_min || event.pace_max ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Ritmo:</span>
              <span>
                {event.pace_min && event.pace_max && event.pace_min !== event.pace_max
                  ? `${event.pace_min}–${event.pace_max} min/km`
                  : `${event.pace_min || event.pace_max} min/km`}
              </span>
            </div>
          ) : null}

          {event.level_tag ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Nivel:</span>
              <span className="eventDetailLevelBadge">{event.level_tag}</span>
            </div>
          ) : null}

          {event.event_type ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Tipo:</span>
              <span className="eventDetailLevelBadge">{eventTypeLabel(event)}</span>
            </div>
          ) : null}

          {typeof event.participants_count === "number" || event.capacity ? (
            <div className="eventDetailMetaRow">
              <UsersIcon />
              <span>
                {typeof event.participants_count === "number"
                  ? `${event.participants_count} inscritos`
                  : ""}
                {event.capacity ? ` / ${event.capacity} plazas` : ""}
              </span>
            </div>
          ) : null}

          {event.visibility && event.visibility !== "public" ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Visibilidad:</span>
              <span>
                {event.visibility === "private"
                  ? "Privado"
                  : event.visibility === "followers"
                  ? "Solo seguidores"
                  : event.visibility}
              </span>
            </div>
          ) : null}

          {event.requires_approval ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Aprobación:</span>
              <span>Requiere aprobación del organizador</span>
            </div>
          ) : null}

          {hasCoords ? (
            <button
              type="button"
              className="eventDetailDirectionsBtn"
              onClick={() => navigate(`/evento/${eventId}/como-llegar`)}
            >
              <MapPinIcon /> Cómo llegar
            </button>
          ) : null}
        </div>

        {event.notes ? (
          <div className="eventDetailNotes">
            <h2 className="eventDetailSectionTitle">Descripción</h2>
            <p className="eventDetailNotesText">{event.notes}</p>
          </div>
        ) : null}

        {event.external_links && Object.keys(event.external_links).length > 0 ? (
          <div className="eventDetailLinks">
            <h2 className="eventDetailSectionTitle">Enlaces</h2>
            <div className="eventDetailLinksList">
              {Object.entries(event.external_links).map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="eventDetailLinkItem"
                >
                  <span className="eventDetailLinkLabel">{label}</span>
                  <span className="eventDetailLinkArrow" aria-hidden="true">
                    ›
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="eventDetailActions">
          {isCreator ? (
            <div className="eventDetailOwnerActions">
              <button
                type="button"
                className="app-button app-button--secondary app-button--sm eventDetailActionBtn"
                onClick={handleEdit}
              >
                Editar
              </button>
              <button
                type="button"
                className="app-button app-button--danger app-button--sm eventDetailActionBtn"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          ) : (
            <>
              {isJoined ? (
                <span className="eventDetailJoinedBadge">Ya estás inscrito</span>
              ) : null}

              {canJoin ? (
                <button
                  type="button"
                  className="app-button app-button--primary eventDetailActionBtn"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? "Uniéndote…" : "Unirme al evento"}
                </button>
              ) : null}

              {canLeave ? (
                <button
                  type="button"
                  className="app-button app-button--secondary eventDetailActionBtn"
                  onClick={handleLeave}
                  disabled={leaving}
                >
                  {leaving ? "Saliendo…" : "Salir del evento"}
                </button>
              ) : null}

              {!isCreator && event?.created_by ? (
                <button
                  type="button"
                  className="app-button app-button--secondary eventDetailActionBtn eventDetailContactBtn"
                  onClick={handleContactCreator}
                  disabled={dmLoading}
                >
                  {dmLoading ? "Abriendo chat…" : "Contactar organizador"}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
