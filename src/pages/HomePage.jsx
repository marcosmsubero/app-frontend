import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import UpcomingMeetups from "../components/UpcomingMeetups";
import Toasts from "../components/Toasts";
import { useAuth } from "../hooks/useAuth";
import { useLiveMeetupEvents } from "../hooks/useLiveMeetupEvents";

function MetricCard({ value, label, description, tone = "primary" }) {
  return (
    <article className="homePage__metricCard app-card">
      <div className="homePage__metricHead">
        <span className={`app-badge${tone !== "neutral" ? ` app-badge--${tone}` : ""}`}>
          {label}
        </span>
      </div>

      <div className="homePage__metricBody">
        <strong className="homePage__metricValue">{value}</strong>
        <p className="homePage__metricDescription">{description}</p>
      </div>
    </article>
  );
}

function FeatureCard({ badge, title, text, to, cta, tone = "neutral" }) {
  return (
    <article className="homePage__featureCard app-card app-card--interactive">
      <div className="app-card__header">
        <span className={`app-badge${tone !== "neutral" ? ` app-badge--${tone}` : ""}`}>
          {badge}
        </span>
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
    <Link to={to} className="homePage__quickAction app-card app-card--interactive">
      <div className="homePage__quickActionInner">
        <span className="app-badge app-badge--primary">Acceso rápido</span>
        <h3 className="app-card__title">{title}</h3>
        <p className="app-card__description">{text}</p>
      </div>
    </Link>
  );
}

function InsightCard({ kicker, title, text, actions }) {
  return (
    <article className="homePage__insightCard app-card">
      <div className="app-card__header">
        <span className="app-kicker">{kicker}</span>
        <h3 className="homePage__insightTitle">{title}</h3>
        <p className="app-card__description">{text}</p>
      </div>

      {actions ? <div className="app-card__footer">{actions}</div> : null}
    </article>
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
        <div className="app-page homePage">
          <section className="homePage__hero homePage__hero--guest app-section">
            <div className="homePage__heroMain">
              <div className="homePage__heroCopy">
                <span className="app-kicker">App social deportiva</span>

                <h1 className="homePage__heroTitle">
                  Organiza grupos, actividades y conversaciones desde una interfaz
                  limpia, rápida y lista para escalar.
                </h1>

                <p className="homePage__heroSubtitle">
                  Una experiencia pensada para runners, ciclistas y deportistas que
                  quieren descubrir planes, coordinar quedadas y mantener su comunidad
                  activa en móvil y escritorio con una base visual coherente.
                </p>
              </div>

              <div className="homePage__heroActions">
                <Link to="/login" className="app-button app-button--primary app-button--lg">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="app-button app-button--secondary app-button--lg">
                  Crear cuenta
                </Link>
              </div>

              <div className="homePage__metricGrid">
                <MetricCard
                  value="24/7"
                  label="Disponibilidad"
                  tone="primary"
                  description="Comunidad, agenda y conversaciones accesibles en cualquier momento."
                />
                <MetricCard
                  value="1"
                  label="Sistema visual"
                  tone="success"
                  description="Una base coherente para escalar producto sin fragmentar la experiencia."
                />
                <MetricCard
                  value="Mobile"
                  label="Primero"
                  tone="warning"
                  description="Diseño compacto en móvil y expansión elegante en escritorio."
                />
              </div>
            </div>

            <div className="homePage__heroAside">
              <InsightCard
                kicker="Qué puedes hacer"
                title="Tu espacio deportivo en una sola app"
                text="La home actúa como punto de entrada, resumen de actividad y lanzadera hacia grupos, agenda, mensajes y perfil."
                actions={
                  <div className="homePage__tagRow">
                    <span className="app-badge">Grupos</span>
                    <span className="app-badge">Agenda</span>
                    <span className="app-badge">Mensajes</span>
                    <span className="app-badge">Perfil</span>
                    <span className="app-badge">Actividad</span>
                  </div>
                }
              />
            </div>
          </section>

          <section className="homePage__featureGrid">
            <FeatureCard
              badge="Comunidad"
              tone="primary"
              title="Explora actividad cerca de ti"
              text="Encuentra nuevas rutas, entrenamientos compartidos y planes deportivos con una visibilidad más clara."
              to="/explorar"
              cta="Ir a explorar"
            />
            <FeatureCard
              badge="Coordinación"
              tone="success"
              title="Crea o únete a grupos"
              text="Organiza quedadas, comparte contexto y da continuidad a tu comunidad deportiva."
              to="/groups"
              cta="Ver grupos"
            />
            <FeatureCard
              badge="Conversación"
              tone="warning"
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
      <div className="app-page homePage">
        <section className="homePage__hero homePage__hero--authed app-section">
          <div className="homePage__heroMain">
            <div className="homePage__heroCopy">
              <span className="app-kicker">Workspace deportivo</span>

              <h1 className="homePage__heroTitle">
                Bienvenido{me?.handle ? `, ${me.handle}` : ""}. Tu actividad,
                tu agenda y tus siguientes acciones empiezan aquí.
              </h1>

              <p className="homePage__heroSubtitle">
                Usa esta pantalla como dashboard principal para ver prioridades,
                próximos planes y accesos rápidos con una estructura más limpia y profesional.
              </p>
            </div>

            <div className="homePage__metricGrid">
              <MetricCard
                value={`${profileCompletion}%`}
                label="Perfil"
                tone="primary"
                description="Indicador simple para completar tu identidad y mejorar confianza y descubrimiento."
              />
              <MetricCard
                value="Live"
                label="Agenda"
                tone="success"
                description="Las novedades de quedadas se refrescan con eventos en tiempo real."
              />
              <MetricCard
                value="Ready"
                label="Producto"
                tone="warning"
                description="Base visual estable para seguir creciendo sin perder consistencia."
              />
            </div>
          </div>

          <div className="homePage__heroAside">
            <UpcomingMeetups key={agendaVersion} />

            <InsightCard
              kicker="Siguiente paso recomendado"
              title="Completa tu perfil y activa mejor la comunidad"
              text="Un perfil más completo mejora descubrimiento, confianza y calidad percibida dentro del producto."
              actions={
                <>
                  <Link to="/perfil" className="app-button app-button--primary app-button--sm">
                    Revisar perfil
                  </Link>
                  <Link to="/ajustes" className="app-button app-button--ghost app-button--sm">
                    Ajustes
                  </Link>
                </>
              }
            />
          </div>
        </section>

        <section className="homePage__quickGrid">
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

        <section className="homePage__featureGrid">
          <FeatureCard
            badge="Jerarquía"
            tone="primary"
            title="Home más clara y menos densa"
            text="La información principal pasa a estar agrupada por prioridad y no por acumulación visual."
            to="/explorar"
            cta="Explorar"
          />
          <FeatureCard
            badge="Responsive"
            tone="success"
            title="Preparada para móvil y desktop"
            text="El contenido se apila con naturalidad en móvil y aprovecha mejor el ancho disponible en escritorio."
            to="/groups"
            cta="Ver grupos"
          />
          <FeatureCard
            badge="Escalabilidad"
            tone="warning"
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
