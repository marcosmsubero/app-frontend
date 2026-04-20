import { Link } from "react-router-dom";
import { timeLabel } from "../../utils/dates";
import shoesImage from "../../assets/shoes.png";
import finishlineImage from "../../assets/finishline.png";
import partyImage from "../../assets/party.png";
import AvatarStack from "./AvatarStack";
import UrgencyBadge from "./UrgencyBadge";

function eventTitle(event) {
  return event?.title || event?.meeting_point || "Evento";
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

function trainingLabel(type) {
  if (type === "series") return "Series";
  if (type === "carrera_continua") return "Carrera continua";
  return "";
}

function formatPace(min, max) {
  if (min && max && min !== max) return `${min}–${max} min/km`;
  if (min) return `${min} min/km`;
  if (max) return `${max} min/km`;
  return "";
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

export default function EventCard({
  event,
  variant = "day",
  canManage = false,
  onEdit,
  onDelete,
}) {
  const imageSrc = eventImageSrc(event);
  const title = eventTitle(event);
  const participants = event?.participants || [];
  const spots = typeof event?.participants_count === "number" ? spotsInfo(event) : null;

  const training = trainingLabel(event?.training_type);
  const distance = event?.distance_km ? `${event.distance_km} km` : "";
  const elev = event?.elevation_m ? `${event.elevation_m} D+` : "";
  const pace = formatPace(event?.pace_min, event?.pace_max);
  const techLine = [training, distance, elev, pace].filter(Boolean).join(" · ");

  const externalLinksCount = event?.external_links
    ? Object.values(event.external_links).filter(Boolean).length
    : 0;

  const date = new Date(event.starts_at);
  const showDateBadge = variant === "grid";
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();

  const statusTag =
    event?.status === "cancelled" ? "Cancelado"
    : event?.status === "done" ? "Finalizado"
    : null;

  return (
    <Link
      to={`/evento/${event.id}`}
      className={`eventCard eventCard--${variant}`}
    >
      <div className="eventCard__imageWrap">
        <img src={imageSrc} alt={title} className="eventCard__image" loading="lazy" />

        {showDateBadge ? (
          <div className="eventCard__dateBadge">
            <span className="eventCard__dateDay">{dayNum}</span>
            <span className="eventCard__dateMonth">{monthStr}</span>
          </div>
        ) : null}

        {event?.event_type ? (
          <span className="eventCard__typeTag">
            {event.event_type === "carrera"
              ? "Carrera"
              : event.event_type === "vibe"
              ? "Vibe"
              : event.event_type}
          </span>
        ) : null}

        {statusTag ? (
          <span className={`eventCard__statusTag eventCard__statusTag--${event.status}`}>
            {statusTag}
          </span>
        ) : null}
      </div>

      <div className="eventCard__body">
        <h3 className="eventCard__title">{title}</h3>

        <p className="eventCard__meta eventCard__meta--primary">
          {timeLabel(event.starts_at)}
        </p>

        <p className="eventCard__meta">
          {event.meeting_point || "Sin ubicación"}
        </p>

        {techLine ? (
          <p className="eventCard__meta eventCard__meta--tech">{techLine}</p>
        ) : null}

        {(event?.level_tag || event?.requires_approval) ? (
          <div className="eventCard__chipRow">
            {event?.level_tag ? (
              <span className="eventCard__chip">{event.level_tag}</span>
            ) : null}
            {event?.requires_approval ? (
              <span className="eventCard__chip eventCard__chip--soft">Requiere aprobación</span>
            ) : null}
            {externalLinksCount > 0 ? (
              <span className="eventCard__chip eventCard__chip--soft">
                {externalLinksCount} enlace{externalLinksCount !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        {event?.notes ? (
          <p className="eventCard__notes">{event.notes}</p>
        ) : null}

        <div className="eventCard__social">
          {participants.length > 0 ? (
            <AvatarStack users={participants} max={3} size={22} />
          ) : null}

          {spots ? (
            <UrgencyBadge variant={spots.variant}>{spots.label}</UrgencyBadge>
          ) : null}
        </div>

        {canManage ? (
          <div
            className="eventCard__actions"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className="eventCard__iconBtn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(event);
              }}
              aria-label="Editar evento"
            >
              <IconEdit />
            </button>
            <button
              type="button"
              className="eventCard__iconBtn eventCard__iconBtn--danger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(event);
              }}
              aria-label="Borrar evento"
            >
              <IconTrash />
            </button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
