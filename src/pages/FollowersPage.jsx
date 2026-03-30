import { useNavigate } from "react-router-dom";

export default function FollowersPage() {
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

        <h1 className="app-page__title">Seguidores</h1>
      </div>

      <div className="app-emptyState">
        <div className="app-emptyState__icon">👥</div>
        <p className="app-emptyState__title">Aún no tienes seguidores</p>
        <p className="app-emptyState__subtitle">
          Cuando otros corredores empiecen a seguirte, aparecerán aquí.
        </p>
      </div>
    </div>
  );
}
