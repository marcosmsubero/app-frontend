import { useNavigate } from "react-router-dom";

export default function FollowingPage() {
  const navigate = useNavigate();

  return (
    <div className="app-page">
      <div className="app-page__header">
        <button
          onClick={() => navigate(-1)}
          className="app-backButton"
        >
          ←
        </button>

        <h1 className="app-page__title">Seguidos</h1>
      </div>

      <div className="app-emptyState">
        <div className="app-emptyState__icon">🏃</div>
        <p className="app-emptyState__title">No sigues a nadie aún</p>
        <p className="app-emptyState__subtitle">
          Explora corredores y empieza a conectar con la comunidad.
        </p>
      </div>
    </div>
  );
}
