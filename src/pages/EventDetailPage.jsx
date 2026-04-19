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
  api,
} from "../services/api";
import { AnalyticsEvents } from "../services/analytics";
import { timeLabel, localDayKey } from "../utils/dates";
import shoesImage from "../assets/shoes.png";
import finishlineImage from "../assets/finishline.png";
import partyImage from "../assets/party.png";
import "../styles/event-detail.css";
import ImageViewer from "../components/ui/ImageViewer";
import IconButton from "../components/ui/IconButton";
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
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [heroTab, setHeroTab] = useState("image"); // "image" | "organizer"
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

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
          setFavorited(Boolean(data?.is_favorited));
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

  async function toggleFavorite() {
    setFavLoading(true);
    try {
      if (favorited) {
        await api(`/favorites/${eventId}`, { method: "DELETE", token });
        setFavorited(false);
      } else {
        await api(`/favorites/${eventId}`, { method: "POST", token });
        setFavorited(true);
      }
    } catch (err) {
      toast?.error?.(err?.message || "Error al actualizar favorito.");
    } finally {
      setFavLoading(false);
    }
  }

  function handleShare() {
    const title = event?.title || event?.meeting_point || "Evento RunVibe";
    const text = `${title} — ${formatFullDate(event?.starts_at)} · ${timeLabel(
      event?.starts_at
    )}`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast?.success?.("Enlace copiado al portapapeles.");
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
      <div className="eventDetailNav">
        <IconButton
          variant="solid"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </IconButton>
        <div className="eventDetailNav__right">
          <IconButton
            variant="solid"
            pressed={favorited}
            disabled={favLoading}
            onClick={toggleFavorite}
            aria-label={favorited ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg
              viewBox="0 0 24 24"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </IconButton>
          <IconButton
            variant="solid"
            onClick={handleShare}
            aria-label="Compartir"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div className="eventDetailHeroPanel">
        <div
          className="eventDetailHeroPanel__tabs"
          role="tablist"
          aria-label="Cabecera del evento"
        >
          <button
            type="button"
            role="tab"
            aria-selected={heroTab === "image"}
            className={`eventDetailHeroPanel__tab${heroTab === "image" ? " is-active" : ""}`}
            onClick={() => setHeroTab("image")}
          >
            Imagen
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={heroTab === "organizer"}
            className={`eventDetailHeroPanel__tab${heroTab === "organizer" ? " is-active" : ""}`}
            onClick={() => setHeroTab("organizer")}
          >
            Organizador
          </button>
        </div>

        {heroTab === "image" ? (
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
        ) : (
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
        )}
      </div>

      <div className="eventDetailBody">
        <h1 className="eventDetailTitle">
          {event.title || event.meeting_point || "Evento"}
        </h1>

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

          {event.level_tag ? (
            <div className="eventDetailMetaRow">
              <span className="eventDetailMetaLabel">Nivel:</span>
              <span className="eventDetailLevelBadge">{event.level_tag}</span>
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
            <>
              <span className="eventDetailJoinedBadge eventDetailJoinedBadge--creator">
                Eres el organizador
              </span>
              <div className="eventDetailOwnerActions">
                <button
                  type="button"
                  className="app-button app-button--secondary eventDetailActionBtn"
                  onClick={handleEdit}
                >
                  Editar evento
                </button>
                <button
                  type="button"
                  className="app-button app-button--danger eventDetailActionBtn"
                  onClick={handleDelete}
                >
                  Eliminar evento
                </button>
              </div>
            </>
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
