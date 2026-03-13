import { Link } from "react-router-dom";

function PostCard({ post }) {
  if (!post) return null;

  return (
    <article className="app-card post-card">
      {post.image && (
        <div className="post-card__media">
          <img src={post.image} alt={post.title || "Post"} />
        </div>
      )}

      <div className="post-card__content">
        <div className="app-stack app-stack--sm">
          {post.category && (
            <span className="app-badge">{post.category}</span>
          )}

          {post.title && (
            <h3 className="post-card__title">
              {post.title}
            </h3>
          )}

          {post.description && (
            <p className="post-card__description">
              {post.description}
            </p>
          )}
        </div>
      </div>

      <div className="post-card__footer">
        {post.author && (
          <span className="post-card__author">
            {post.author}
          </span>
        )}

        {post.link && (
          <Link
            to={post.link}
            className="app-button app-button--ghost app-button--sm"
          >
            Ver
          </Link>
        )}
      </div>
    </article>
  );
}

export default function PostsGrid({ posts = [] }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="posts-grid-empty app-card">
        <div className="app-stack">
          <span className="app-badge">Feed</span>
          <p className="app-card__description">
            Todavía no hay publicaciones disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="posts-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
