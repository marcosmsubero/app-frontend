import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";

function getInitials(name = "") {
  return String(name)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getPrimarySport(me) {
  if (Array.isArray(me?.disciplines) && me.disciplines.length > 0) {
    return me.disciplines[0];
  }
  return "Running";
}

function buildCommunityFeed(me) {
  const currentHandle = me?.handle || "tuusuario";

  return [
    {
      id: "feed-1",
      author: "laura.trail",
      name: "Laura Martínez",
      location: "Sierra de Aitana",
      sport: "Trail",
      image:
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
      caption:
        "Rodaje largo con desnivel y buenas sensaciones. Se viene una semana fuerte de montaña.",
      likes: 184,
      comments: 12,
      time: "Hace 42 min",
    },
    {
      id: "feed-2",
      author: "raul.cycling",
      name: "Raúl Gómez",
      location: "Alicante",
      sport: "Ciclismo",
      image:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
      caption:
        "Salida suave para acumular kilómetros y preparar la grupeta del sábado.",
      likes: 239,
      comments: 18,
      time: "Hace 1 h",
    },
    {
      id: "feed-3",
      author: currentHandle,
      name: me?.full_name || me?.name || "Tu perfil",
      location: me?.location || "Tu ciudad",
      sport: getPrimarySport(me),
      image:
        "https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80",
      caption:
        "Tu feed puede mostrar publicaciones propias y de otros perfiles cuando conectemos la fuente real del backend.",
      likes: 96,
      comments: 7,
      time: "Hace 3 h",
      isOwn: true,
    },
  ];
}

const SPORTS_NEWS = [
  {
    id: "news-1",
    tag: "Evento",
    title: "Media maratón local abierta a nuevos clubes y grupos",
    text: "Una buena oportunidad para coordinar participación desde la app.",
  },
  {
    id: "news-2",
    tag: "Comunidad",
    title: "Aumentan las salidas grupales de ciclismo al amanecer",
    text: "Las rutas cortas entre semana están ganando mucha tracción.",
  },
  {
    id: "news-3",
    tag: "Running",
    title: "Más usuarios buscan entrenos compartidos de ritmo medio",
    text: "El feed puede ayudar a conectar mejor perfiles compatibles.",
  },
];

function FeedPostCard({ post }) {
  return (
    <article className="homeFeed__post app-card">
      <div className="homeFeed__postHeader">
        <div className="homeFeed__postAuthor">
          <div className="homeFeed__avatar">
            {getInitials(post.name || post.author)}
          </div>

          <div className="homeFeed__authorMeta">
            <strong className="homeFeed__authorName">{post.author}</strong>
            <span className="homeFeed__authorSub">
              {[post.location, post.sport].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>

        <span className="homeFeed__time">{post.time}</span>
      </div>

      <div className="homeFeed__mediaWrap">
        <img
          src={post.image}
          alt={post.caption}
          className="homeFeed__media"
          loading="lazy"
        />
      </div>

      <div className="homeFeed__postBody">
        <div className="homeFeed__postMeta">
          <span className="app-badge">{post.likes} me gusta</span>
          <span className="app-badge">{post.comments} comentarios</span>
          {post.isOwn ? (
            <span className="app-badge app-badge--primary">Tu publicación</span>
          ) : null}
        </div>

        <p className="homeFeed__caption">
          <strong>{post.author}</strong> {post.caption}
        </p>
      </div>
    </article>
  );
}

function NewsCard({ item }) {
  return (
    <article className="homeFeed__newsCard app-card">
      <div className="app-card__header">
        <span className="app-badge">{item.tag}</span>
        <h3 className="app-card__title">{item.title}</h3>
        <p className="app-card__description">{item.text}</p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { isAuthed, me } = useAuth();
  const feedPosts = useMemo(() => buildCommunityFeed(me), [me]);

  if (!isAuthed) {
    return (
      <div className="app-page homeFeed">
        <section className="homeFeed__guest app-section">
          <div className="homeFeed__guestCopy">
            <span className="app-kicker">App social deportiva</span>
            <h1 className="homeFeed__guestTitle">
              Un feed deportivo para descubrir comunidad, actividad y planes.
            </h1>
            <p className="homeFeed__guestSubtitle">
              Entra para ver publicaciones, noticias y eventos deportivos en una
              experiencia más simple y visual.
            </p>
          </div>

          <div className="homeFeed__guestActions">
            <Link to="/login" className="app-button app-button--primary">
              Iniciar sesión
            </Link>
            <Link to="/register" className="app-button app-button--secondary">
              Crear cuenta
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page homeFeed">
      <section className="homeFeed__layout">
        <div className="homeFeed__main">
          <div className="homeFeed__feedHead app-section">
            <div>
              <span className="app-kicker">Inicio</span>
              <h1 className="homeFeed__title">Feed deportivo</h1>
              <p className="homeFeed__subtitle">
                Nuevas publicaciones y actividad reciente
              </p>
            </div>
          </div>

          <div className="homeFeed__posts">
            {feedPosts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="homeFeed__aside">
          <section className="homeFeed__asideSection app-section">
            <div className="homeFeed__asideHead">
              <span className="app-kicker">Noticias</span>
              <h2 className="app-title">Actualidad deportiva</h2>
            </div>

            <div className="homeFeed__newsList">
              {SPORTS_NEWS.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
