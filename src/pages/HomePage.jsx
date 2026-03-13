import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import UpcomingMeetups from "../components/UpcomingMeetups";
import Toasts from "../components/Toasts";
import { useAuth } from "../hooks/useAuth";
import { useLiveMeetupEvents } from "../hooks/useLiveMeetupEvents";

function MetricCard({ value, label }) {
  return (
    <article className="homeMinimal__metric app-card">
      <span className="app-badge">{label}</span>
      <strong className="homeMinimal__metricValue">{value}</strong>
    </article>
  );
}

function QuickLinkCard({ to, title, text }) {
  return (
    <Link to={to} className="homeMinimal__quick app-card app-card--interactive">
      <h3 className="app-card__title">{title}</h3>
      <p className="app-card__description">{text}</p>
    </Link>
  );
}

export default function HomePage() {
  const { isAuthed, me } = useAuth();
  const [agendaVersion, setAgendaVersion] = useState(0);

  const { toasts, removeToast } = useLiveMeetupEvents({
    enabled: isAuthed,
    onAgendaUpdate: () => setAgendaVersion((current) => current + 1),
  });

  const profileCompletion = useMemo(() => {
    if (!isAuthed) return 0;

    let score = 0;
    if (me?.handle) score += 40;
    if (me?.full_name || me?.name) score += 25;
    if (me?.email) score += 20;
    if (me?.bio) score += 15;

    return Math.min(score, 100);
  }, [isAuthed, me]);

  if (!isAuthed) {
    return (
      <>
        <div className="app-page homeMinimal">
          <section className="homeMinimal__hero app-section">
            <div className="homeMinimal__heroCopy">
              <span className="app-kicker">App social deportiva</span>
              <h1 className="homeMinimal__title">
                Organiza grupos, quedadas y conversaciones desde una interfaz limpia.
              </h1>
              <p className="homeMinimal__subtitle">
                Una base más simple, rápida y coherente para descubrir comunidad y
                coordinar actividad deportiva.
              </p>
            </div>

            <div className="homeMinimal__actions">
              <Link to="/login" className="app-button app-button--primary">
                Iniciar sesión
              </Link>
              <Link to="/register" className="app-button app-button--secondary">
                Crear cuenta
              </Link>
            </div>

            <div className="homeMinimal__metrics">
              <MetricCard value="24/7" label="Disponibilidad" />
              <MetricCard value="Mobile" label="Primero" />
              <MetricCard value="Simple" label="Sistema" />
            </div>
          </section>

          <section className="homeMinimal__grid">
            <QuickLinkCard
              to="/explorar"
              title="Explorar actividad"
              text="Descubre planes, rutas y quedadas cercanas."
            />
            <QuickLinkCard
              to="/groups"
              title="Entrar en grupos"
              text="Busca comunidades y únete a la que mejor encaje contigo."
            />
            <QuickLinkCard
              to="/mensajes"
              title="Abrir mensajes"
              text="Coordina detalles de forma rápida y clara."
            />
          </section>
        </div>

        <Toasts toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="app-page homeMinimal">
        <section className="homeMinimal__hero app-section">
          <div className="homeMinimal__heroCopy">
            <span className="app-kicker">Inicio</span>
            <h1 className="homeMinimal__title">
              Bienvenido{me?.handle ? `, ${me.handle}` : ""}.
            </h1>
            <p className="homeMinimal__subtitle">
              Tu agenda, tu perfil y tus accesos principales en una sola vista.
            </p>
          </div>

          <div className="homeMinimal__metrics">
            <MetricCard value={`${profileCompletion}%`} label="Perfil" />
            <MetricCard value="Live" label="Agenda" />
            <MetricCard value="Ready" label="Estado" />
          </div>
        </section>

        <section className="homeMinimal__dashboard">
          <div className="homeMinimal__main">
            <UpcomingMeetups key={agendaVersion} />
          </div>

          <aside className="homeMinimal__aside app-section">
            <div className="homeMinimal__asideBlock">
              <span className="app-kicker">Accesos</span>
              <div className="homeMinimal__stack">
                <QuickLinkCard
                  to="/explorar"
                  title="Explorar actividad"
                  text="Ver nuevas quedadas y movimiento reciente."
                />
                <QuickLinkCard
                  to="/groups"
                  title="Gestionar grupos"
                  text="Entrar en tus comunidades y organizar planes."
                />
                <QuickLinkCard
                  to="/perfil"
                  title="Revisar perfil"
                  text="Actualizar tu identidad deportiva."
                />
              </div>
            </div>
          </aside>
        </section>
      </div>

      <Toasts toasts={toasts} onClose={removeToast} />
    </>
  );
}
