import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import UpcomingMeetups from "../components/UpcomingMeetups";
import Toasts from "../components/Toasts";
import { useAuth } from "../hooks/useAuth";
import { useLiveMeetupEvents } from "../hooks/useLiveMeetupEvents";

function MetricCard({ value, label, description }) {
  return (
    <article className="app-card">
      <div className="app-stack app-stack--sm">
        <span className="app-badge app-badge--primary">{label}</span>
        <strong
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.35rem)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {value}
        </strong>
        <p className="app-card__description">{description}</p>
      </div>
    </article>
  );
}

function FeatureCard({ badge, title, text, to, cta }) {
  return (
    <article className="app-card app-card--interactive">
      <div className="app-card__header">
        <span className="app-badge">{badge}</span>
        <h3 className="app-card__title">{title}</h3>
        <p className="app-card__description">{text}</p>
      </div>

      <div className="app-card__footer">
        <Link to={to} className="app-button app-button--secondary app-button--sm">
          {cta}
        </Link>
      </div>
    </article>
  );
}

function QuickAction({ to, title, text }) {
  return (
    <Link to={to} className="app-card app-card--interactive" style={{ textDecoration: "none" }}>
      <div className="app-card__header">
        <span className="app-badge app-badge--primary">Acceso rápido</span>
        <h3 className="app-card__title">{title}</h3>
        <p className="app-card__description">{text}</p>
      </div>
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
        <div className="app-page home-shell">
          <section className="app-card hero-card">
            <div className="app-stack app-stack--lg">
              <div className="app-stack app-stack--sm">
                <p className="app-kicker">App social deportiva</p>
                <h2 className="app-title">
                  Organiza grupos, actividades y mensajes desde una interfaz clara y preparada para crecer.
                </h2>
                <p className="app-copy" style={{ margin: 0, maxWidth: "62ch" }}>
                  Una experiencia pensada para runners, ciclistas y deportistas que quieren descubrir planes, coordinar
                  quedadas y mantener su comunidad activa tanto en móvil como en escritorio.
                </p>
              </div>

              <div className="app-inline">
                <Link to="/login" className="app-button app-button--primary">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="app-button app-button--secondary">
                  Crear cuenta
                </Link>
              </div>

              <div className="app-grid app-grid--cards">
                <MetricCard
                  value="24/7"
                  label="Disponibilidad"
                  description="Comunidad, agenda y conversaciones accesibles en cualquier momento."
                />
                <MetricCard
                  value="1"
                  label="Sistema visual"
                  description="Una base coherente para escalar producto sin fragmentar la UI."
                />
                <MetricCard
                  value="Mobile"
                  label="Primero"
                  description="Diseño compacto, navegación inferior y adaptación fluida a desktop."
                />
              </div>
            </div>

            <div className="app-stack">
              <article className="app-card">
                <div className="app-card__header">
                  <span className="app-badge app-badge--success">Qué puedes hacer</span>
                  <h3 className="app-card__title">Tu espacio deportivo en una sola app</h3>
                  <p className="app-card__description">
                    La home debe funcionar como punto de entrada, resumen de actividad y lanzadera hacia el resto del
                    producto.
                  </p>
                </div>

                <div className="app-stack app-stack--sm">
                  <div className="app-inline">
                    <span className="app-badge">Grupos</span>
                    <span className="app-badge">Agenda</span>
                    <span className="app-badge">Mensajes</span>
                    <span className="app-badge">Perfil</span>
                    <span className="app-badge">Actividad</span>
                  </div>

                  <div className="app-divider" />

                  <p className="app-card__description" style={{ margin: 0 }}>
                    Esta pantalla queda preparada para evolucionar después con métricas reales, onboarding contextual y
                    bloques dinámicos conectados al backend.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="app-grid app-grid--cards">
            <FeatureCard
              badge="Comunidad"
              title="Explora actividad cerca de ti"
              text="Encuentra nuevas rutas, entrenamientos compartidos y planes deportivos con mejor visibilidad."
              to="/explorar"
              cta="Ir a explorar"
            />
            <FeatureCard
              badge="Coordinación"
              title="Crea o únete a grupos"
              text="Organiza quedadas, comparte contexto y da continuidad a la comunidad deportiva."
              to="/groups"
              cta="Ver grupos"
            />
            <FeatureCard
              badge="Conversación"
              title="Mantén vivo el plan"
              text="Una mensajería más limpia para cerrar detalles sin fricción entre participantes."
              to="/mensajes"
              cta="Abrir mensajes"
            />
          </section>
        </div>

        <Toasts toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="app-page home-shell">
        <section className="app-card hero-card">
          <div className="app-stack app-stack--lg">
            <div className="app-stack app-stack--sm">
              <p className="app-kicker">Workspace deportivo</p>
              <h2 className="app-title">
                Bienvenido{me?.handle ? `, ${me.handle}` : ""}. Tu actividad y tu agenda quedan visibles desde aquí.
              </h2>
              <p className="app-copy" style={{ margin: 0, maxWidth: "62ch" }}>
                Usa esta pantalla como dashboard principal: acceso rápido a grupos, mensajes, perfil y próximas
                quedadas, con un lenguaje visual más estable y profesional.
              </p>
            </div>

            <div className="app-grid app-grid--cards metrics-grid">
              <MetricCard
                value={`${profileCompletion}%`}
                label="Perfil"
                description="Indicador simple para priorizar onboarding y mejorar la identidad del usuario."
              />
              <MetricCard
                value="Live"
                label="Agenda"
                description="Las novedades de quedadas se refrescan desde eventos en tiempo real."
              />
              <MetricCard
                value="Ready"
                label="Producto"
                description="Base visual más sólida para seguir refinando pantallas sociales y flujos internos."
              />
            </div>
          </div>

          <div className="app-stack">
            <UpcomingMeetups key={agendaVersion} />

            <article className="app-card">
              <div className="app-card__header">
                <span className="app-badge app-badge--warning">Siguiente paso recomendado</span>
                <h3 className="app-card__title">Completa tu perfil y activa mejor la comunidad</h3>
                <p className="app-card__description">
                  Un perfil más completo mejora descubrimiento, confianza y calidad percibida dentro del producto.
                </p>
              </div>

              <div className="app-card__footer">
                <Link to="/perfil" className="app-button app-button--primary app-button--sm">
                  Revisar perfil
                </Link>
                <Link to="/ajustes" className="app-button app-button--ghost app-button--sm">
                  Ajustes
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="app-grid app-grid--cards quick-actions">
          <QuickAction
            to="/explorar"
            title="Explorar actividad"
            text="Descubre nuevas quedadas, rutas y movimiento reciente."
          />
          <QuickAction
            to="/groups"
            title="Gestionar grupos"
            text="Entra en tus comunidades y organiza la siguiente salida."
          />
          <QuickAction
            to="/mensajes"
            title="Abrir mensajes"
            text="Continúa conversaciones y concreta detalles del próximo plan."
          />
          <QuickAction
            to="/notificaciones"
            title="Ver avisos"
            text="Consulta cambios, novedades y actualizaciones importantes."
          />
        </section>

        <section className="app-grid app-grid--cards">
          <FeatureCard
            badge="Jerarquía"
            title="Home más clara y menos densa"
            text="La información principal pasa a estar agrupada por prioridad y no por acumulación visual."
            to="/explorar"
            cta="Explorar"
          />
          <FeatureCard
            badge="Responsive"
            title="Preparada para móvil y desktop"
            text="El contenido se apila en móvil y aprovecha mejor el ancho disponible en escritorio."
            to="/groups"
            cta="Ver grupos"
          />
          <FeatureCard
            badge="Escalabilidad"
            title="Base útil para siguientes pantallas"
            text="Este patrón permite replicar cards, acciones y bloques informativos en el resto del producto."
            to="/perfil"
            cta="Abrir perfil"
          />
        </section>
      </div>

      <Toasts toasts={toasts} onClose={removeToast} />
    </>
  );
}
