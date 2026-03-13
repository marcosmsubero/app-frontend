import { Link } from "react-router-dom";

function resolveImage(post) {
  return (
    post?.image ||
    post?.image_url ||
    post?.cover ||
    post?.cover_image ||
    post?.media_url ||
    null
  );
}

function resolveTitle(post) {
  return post?.title || post?.name || "Publicación";
}

function resolveDescription(post) {
  return post?.description || post?.caption || post?.excerpt || "";
}

function resolveCategory(post) {
  return post?.category || post?.tag || post?.type || "";
}

function resolveAuthor(post) {
  return post?.author || post?.user_name || post?.handle || "";
}

function resolveLink(post) {
  return post?.link || post?.url || null;
}

function PostCard({ post }) {
  if (!post) return null;

  const image = resolveImage(post);
  const title = resolveTitle(post);
  const description = resolveDescription(post);
  const category = resolveCategory(post);
  const author = resolveAuthor(post);
  const link = resolveLink(post);

  return (
    <article className="postsSimple__card app-card app-card--interactive">
      {image ? (
        <div className="postsSimple__media">
          <img src={image} alt={title} loading="lazy" />
        </div>
      ) : null}

      <div className="postsSimple__body">
        {category ? <span className="app-badge">{category}</span> : null}

        <div className="postsSimple__copy">
          <h3 className="postsSimple__title">{title}</h3>
          {description ? <p className="postsSimple__description">{description}</p> : null}
        </div>
      </div>

      {(author || link) ? (
        <div className="postsSimple__footer">
          {author ? <span className="postsSimple__author">{author}</span> : <span />}

          {link ? (
            <Link to={link} className="app-button app-button--ghost app-button--sm">
              Ver
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function PostsGrid({ posts = [] }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="postsSimple__empty app-empty">
        Todavía no hay publicaciones disponibles.
      </div>
    );
  }

  return (
    <section className="postsSimple">
      {posts.map((post, index) => (
        <PostCard key={post?.id || post?.slug || index} post={post} />
      ))}
    </section>
  );
}
