import { Link } from "react-router-dom";
import { timeLabel } from "../../utils/dates";
import shoesImage from "../../assets/shoes.png";
import finishlineImage from "../../assets/finishline.png";
import partyImage from "../../assets/party.png";

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
  const techLine = [training, distance, elev, pace].filter(Boolean).join(" · ");

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

        {techLine ? (
          <p className="eventCard__meta eventCard__meta--tech">{techLine}</p>
        ) : null}
      </div>
    </Link>
  );
}
