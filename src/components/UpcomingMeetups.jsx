import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpcomingMeetups } from "../hooks/useUpcomingMeetups";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dayDiff(startsAt) {
  const target = startOfDay(new Date(startsAt));
  const today = startOfDay(new Date());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function dayLabel(startsAt) {
  const diff = dayDiff(startsAt);

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";

  return new Date(startsAt).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeOnly(startsAt) {
  return new Date(startsAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(startsAt) {
  const diff = dayDiff(startsAt);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return "Próxima";
}

function statusTone(startsAt) {
  const diff = dayDiff(startsAt);
  if (diff === 0) return "primary";
  if (diff === 1) return "warning";
  return "";
}

function ownerLabel(meetup) {
  return (
    meetup?.creator_profile_name ||
    meetup?.group?.name ||
    meetup?.group_name ||
    "Perfil"
  );
}

export default function UpcomingMeetups() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const { meetups, loading, error, reload } = useUpcomingMeetups(token, toast);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [meetups]);

  const items = useMemo(() => (Array.isArray(meetups) ? meetups : []), [meetups]);

  if (!token) return null;

  if (loading) {
    return (
      <section className="upcomingMeetups app-section" aria-label="Próximas quedadas">
        <div className="upcomingMeetups__head">
          <div>
            <p className="app-kicker">Agenda</p>
            <h3 className="upcomingMeetups__title">Próximas quedadas</h3>
          </div>
        </div>

        <div className="upcomingMeetups__state">Cargando agenda…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="upcomingMeetups app-section" aria-label="Próximas quedadas">
        <div className="upcomingMeetups__head">
          <div>
            <p className="app-kicker">Agenda</p>
            <h3 className="upcomingMeetups__title">Próximas quedadas</h3>
          </div>

          <button
            type="button"
            className="app-button app-button--secondary app-button--sm"
            onClick={reload}
          >
            Recargar
          </button>
        </div>

        <div className="upcomingMeetups__state upcomingMeetups__state--error">
          No se pudo cargar la agenda: {error}
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="upcomingMeetups app-section" aria-label="Próximas quedadas">
        <div className="upcomingMeetups__head">
          <div>
            <p className="app-kicker">Agenda</p>
            <h3 className="upcomingMeetups__title">Próximas quedadas</h3>
          </div>

          <button
            type="button"
            className="app-button app-button--secondary app-button--sm"
            onClick={reload}
          >
            Recargar
          </button>
        </div>

        <div className="upcomingMeetups__state">
          No tienes quedadas próximas.
        </div>
      </section>
    );
  }

  const safeIndex = Math.min(index, items.length - 1);
  const meetup = items[safeIndex];
  const tone = statusTone(meetup.starts_at);
  const creatorProfileId = meetup?.creator_profile_id;
  const label = ownerLabel(meetup);

  function handleOpenMeetup() {
    if (creatorProfileId) {
      nav(`/perfil/${creatorProfileId}`);
      return;
    }

    nav("/blablarun");
  }

  return (
    <section className="upcomingMeetups app-section" aria-label="Próximas quedadas">
      <div className="upcomingMeetups__head">
        <div>
          <p className="app-kicker">Agenda</p>
          <h3 className="upcomingMeetups__title">Próximas quedadas</h3>
        </div>

        <button
          type="button"
          className="app-button app-button--secondary app-button--sm"
          onClick={reload}
        >
          Recargar
        </button>
      </div>

      <div className="upcomingMeetups__carousel">
        <button
          type="button"
          className="upcomingMeetups__navBtn"
          disabled={safeIndex === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          aria-label="Anterior"
          title="Anterior"
        >
          ←
        </button>

        <article
          className="upcomingMeetups__card"
          role="button"
          tabIndex={0}
          onClick={handleOpenMeetup}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenMeetup();
            }
          }}
        >
          <div className="upcomingMeetups__cardTop">
            <span className={`app-badge${tone ? ` app-badge--${tone}` : ""}`}>
              {statusLabel(meetup.starts_at)}
            </span>

            <span className="upcomingMeetups__count">
              {safeIndex + 1}/{items.length}
            </span>
          </div>

          <div className="upcomingMeetups__cardBody">
            <h4 className="upcomingMeetups__cardTitle">
              {meetup.meeting_point || meetup.title || "Quedada"}
            </h4>

            <p className="upcomingMeetups__cardMeta">
              {dayLabel(meetup.starts_at)} · {timeOnly(meetup.starts_at)}
            </p>

            <p className="upcomingMeetups__cardSub">
              {label}
            </p>
          </div>
        </article>

        <button
          type="button"
          className="upcomingMeetups__navBtn"
          disabled={safeIndex >= items.length - 1}
          onClick={() =>
            setIndex((current) => Math.min(items.length - 1, current + 1))
          }
          aria-label="Siguiente"
          title="Siguiente"
        >
          →
        </button>
      </div>
    </section>
  );
}
