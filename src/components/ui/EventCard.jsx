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

/* Minimalist card: image + technical info only. No surrounding
   container (no border, no background), no event-type badge, no
   description, no social or management controls — the grid relies
   purely on the rhythm of image + text blocks. */
export default function EventCard({ event, variant = "day" }) {
  const imageSrc = eventImageSrc(event);
  const title = eventTitle(event);

  const training = trainingLabel(event?.training_type);
  const distance = event?.distance_km ? `${event.distance_km} km` : "";
  const elev = event?.elevation_m ? `${event.elevation_m} D+` : "";
  const pace = formatPace(event?.pace_min, event?.pace_max);

  const participants = event?.participants || [];
  const spots = typeof event?.participants_count === "number" ? spotsInfo(event) : null;

  const date = new Date(event.starts_at);
  const showDateBadge = variant === "grid";
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();

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
      </div>

      <div className="eventCard__body">
        <h3 className="eventCard__title">{title}</h3>

        <p className="eventCard__meta eventCard__meta--primary">
          {timeLabel(event.starts_at)}
        </p>

        <p className="eventCard__meta">
          {event.meeting_point || "Sin ubicación"}
        </p>

        {training ? (
          <p className="eventCard__meta eventCard__meta--tech">{training}</p>
        ) : null}

        {distance ? (
          <p className="eventCard__meta eventCard__meta--tech">{distance}</p>
        ) : null}

        {elev ? (
          <p className="eventCard__meta eventCard__meta--tech">{elev}</p>
        ) : null}

        {pace ? (
          <p className="eventCard__meta eventCard__meta--tech">{pace}</p>
        ) : null}

        {(participants.length > 0 || spots) ? (
          <div className="eventCard__social">
            {participants.length > 0 ? (
              <AvatarStack users={participants} max={3} size={22} />
            ) : null}
            {spots ? (
              <UrgencyBadge variant={spots.variant}>{spots.label}</UrgencyBadge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
