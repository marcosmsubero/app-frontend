import { Link } from "react-router-dom";

export default function ExploreResultRow({
  to,
  avatarUrl,
  avatarFallback,
  title,
  subtitle,
}) {
  return (
    <Link to={to} className="exploreRow">
      <div className="exploreRow__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={title} />
        ) : (
          <span>{avatarFallback}</span>
        )}
      </div>
      <div className="exploreRow__body">
        <div className="exploreRow__title">{title}</div>
        {subtitle ? <div className="exploreRow__subtitle">{subtitle}</div> : null}
      </div>
    </Link>
  );
}
