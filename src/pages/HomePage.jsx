import { Link } from "react-router-dom";
import { useState } from "react";
import UpcomingMeetups from "../components/UpcomingMeetups";
import Toasts from "../components/Toasts";
import { useAuth } from "../hooks/useAuth";
import { useLiveMeetupEvents } from "../hooks/useLiveMeetupEvents";

function BenefitCard({ badgeClass, badgeText, title, text }) {
  return (
    <article className="app-card app-card--soft feed-card">
      <div className="feed-card__body">
        <div className={`app-badge ${badgeClass}`}>{badgeText}</div>
        <div className="feed-card__title">{title}</div>
        <p className="feed-card__text">{text}</p>
      </div>
    </article>
  );
}

function DesktopMetric({ value, label, text }) {
  return (
    <div className="home-desktop-metric">
      <div className="home-desktop-metric__value">{value}</div>
      <div className="home-desktop-metric__label">{label}</div>
      <div className="home-desktop-metric__text">{text}</div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthed, me } = useAuth();
  const [hasAgendaUpdates, setHasAgendaUpdates] = useState(false);

  const { toasts, removeToast } = useLiveMeetupEvents({
    enabled: isAuthed,
    onAgendaUpdate: () => setHasAgendaUpdates(true),
  });

  return (
    <section className="page">
      <div className="page__hero home-hero">
        <div className="home-hero__body">
          <div className="home-hero__content">
            <div className="page__header">
              <span className="page__eyebrow">
                {isAuthed ? "Dashboard" : "App social deportiva"}
              </span>

              <h1 className="page__title">
                {isAuthed
                  ? `Hola${me?.handle ? `, ${me.handle}` : ""}`
                  : "Conecta deporte, comunidad y actividad"}
              </h1>

              <p className="page__subtitle">
                {isAuthed
                  ? "Consulta tu agenda, revisa novedades y accede rápido a grupos, mensajes y quedadas."
                  : "Tu punto de encuentro para descubrir grupos, planificar salidas y mantener tu actividad deportiva conectada."}
              </p>
            </div>

            {isAuthed ? (
              <div className="stats-strip">
                <div className="app-stat">
                  <div className="app-stat__value">{me?.handle ? `@${me.handle}` : "Activa"}</div>
                  <div className="app-stat__label">Cuenta</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">{me?.city || "Sin ciudad"}</div>
                  <div className="app-stat__label">Ubicación</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">
                    {Array.isArray(me?.disciplines) && me.disciplines.length > 0
                      ? me.disciplines.length
                      : me?.discipline || me?.sport
                        ? 1
                        : 0}
                  </div>
                  <div className="app-stat__label">Disciplinas</div>
                </div>

                <div className="app-stat">
                  <div className="app-stat__value">{hasAgendaUpdates ? "Nuevo" : "Al día"}</div>
                  <div className="app-stat__label">Agenda</div>
                </div>
              </div>
            ) : (
              <>
                <div className="split-actions">
                  <Link to="/login" className="app-btn app-btn--primary app-btn--lg">
                    Iniciar sesión
                  </Link>
                  <Link to="/register" className="app-btn app-btn--secondary app-btn--lg">
                    Crear cuenta
                  </Link>
                </div>

                <div className="home-desktop-metrics">
                  <DesktopMetric
                    value="Explora"
                    label="Actividad local"
                    text="Encuentra planes, rutas y quedadas deportivas cerca de ti."
                  />
                  <DesktopMetric
                    value="Conecta"
                    label="Comunidad"
                    text="Únete a grupos por ciudad, nivel o disciplina."
                  />
                  <DesktopMetric
                    value="Organiza"
                    label="Agenda"
                    text="Confirma asistencia y mantén tus salidas bajo control."
                  />
                </div>
              </>
            )}
          </div>

          {!isAuthed ? (
            <div className="home-hero__aside">
              <div className="home-hero-card">
                <div className="home-hero-card__eyebrow">Primera impresión</div>
                <div className="home-hero-card__title">
                  Una app social deportiva pensada como producto real
                </div>
                <div className="home-hero-card__list">
                  <div className="home-hero-card__item">
                    <span className="app-badge app-badge--primary">Explorar</span>
                    <span>Descubre actividad local y planes cercanos.</span>
                  </div>
                  <div className="home-hero-card__item">
                    <span className="app-badge app-badge--success">Comunidad</span>
                    <span>Crea o únete a grupos por deporte, ciudad o nivel.</span>
                  </div>
                  <div className="home-hero-card__item">
                    <span className="app-badge app-badge--warning">Mensajes</span>
                    <span>Coordina rutas, entrenos y quedadas sin salir de la app.</span>
                  </div>
                </div>

                <div className="split-actions">
                  <Link to="/register" className="app-btn app-btn--primary">
                    Empezar ahora
                  </Link>
                  <Link to="/login" className="app-btn app-btn--ghost">
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isAuthed ? (
        <div className="feed-layout home-dashboard-layout">
          <div className="feed-column">
            <div className="app-card">
              <div className="app-card__header">
                <div className="app-section-header">
                  <div>
                    <div className="app-section-header__title">Tu agenda</div>
                    <div className="app-section-header__subtitle">
                      Próximas quedadas y actividad sincronizada en tiempo real.
                    </div>
                  </div>

                  <Link to="/explorar" className="app-btn app-btn--secondary app-btn--sm">
                    Explorar
                  </Link>
                </div>
              </div>

              <div className="app-card__body">
                <UpcomingMeetups
                  hasUpdates={hasAgendaUpdates}
                  onClearUpdates={() => setHasAgendaUpdates(false)}
                />
              </div>
            </div>
          </div>

          <aside className="feed-column home-dashboard-side">
            <div className="app-card app-card--soft">
              <div className="app-card__body app-stack">
                <div>
                  <div className="app-section-header__title">Accesos rápidos</div>
                  <div className="app-section-header__subtitle">
                    Muévete por la app sin perder el hilo de tu actividad.
                  </div>
                </div>

                <div className="home-quick-grid">
                  <Link to="/groups" className="home-quick-card">
                    <span className="app-badge app-badge--primary">Grupos</span>
                    <strong>Ver grupos</strong>
                    <span>Descubre comunidad y organiza planes.</span>
                  </Link>

                  <Link to="/mensajes" className="home-quick-card">
                    <span className="app-badge app-badge--success">Mensajes</span>
                    <strong>Conversaciones</strong>
                    <span>Coordina quedadas y responde rápido.</span>
                  </Link>

                  <Link to="/perfil" className="home-quick-card">
                    <span className="app-badge app-badge--warning">Perfil</span>
                    <strong>Mi perfil</strong>
                    <span>Gestiona identidad, agenda y publicaciones.</span>
                  </Link>

                  <Link to="/notificaciones" className="home-quick-card">
                    <span className="app-badge app-badge--neutral">Avisos</span>
                    <strong>Notificaciones</strong>
                    <span>Consulta novedades y cambios recientes.</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="app-card">
              <div className="app-card__body app-stack">
                <div className="app-section-header__title">Siguiente paso</div>
                <p className="app-text-soft">
                  Crea un grupo, únete a una comunidad o lanza una quedada para esta semana.
                </p>

                <div className="split-actions">
                  <Link to="/groups" className="app-btn app-btn--primary">
                    Crear o unirme
                  </Link>
                  <Link to="/explorar" className="app-btn app-btn--ghost">
                    Descubrir actividad
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="page__columns home-public-columns">
          <div className="app-card">
            <div className="app-card__body app-stack app-stack--lg">
              <div>
                <div className="app-section-header__title">Qué puedes hacer</div>
                <div className="app-section-header__subtitle">
                  Una app social deportiva pensada para planificar, conectar y salir a entrenar.
                </div>
              </div>

              <div className="app-grid app-grid--cards">
                <BenefitCard
                  badgeClass="app-badge--primary"
                  badgeText="Explorar"
                  title="Descubre actividad local"
                  text="Encuentra quedadas, rutas y planes deportivos cerca de ti."
                />
                <BenefitCard
                  badgeClass="app-badge--success"
                  badgeText="Comunidad"
                  title="Crea o únete a grupos"
                  text="Organiza comunidades por deporte, ciudad o nivel de actividad."
                />
                <BenefitCard
                  badgeClass="app-badge--warning"
                  badgeText="Agenda"
                  title="Coordina tus salidas"
                  text="Sigue la agenda, confirma asistencia y mantén tus planes actualizados."
                />
              </div>
            </div>
          </div>

          <aside className="page__sidebar">
            <div className="app-card">
              <div className="app-card__body app-stack">
                <div className="app-section-header__title">Empieza ahora</div>
                <p className="app-text-soft">
                  Regístrate para acceder a grupos, mensajes, perfil y quedadas.
                </p>

                <div className="split-actions">
                  <Link to="/register" className="app-btn app-btn--primary">
                    Crear cuenta
                  </Link>
                  <Link to="/login" className="app-btn app-btn--secondary">
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Toasts toasts={toasts} onRemove={removeToast} />
    </section>
  );
}
