import { useLocation, useNavigate } from "react-router-dom";
import "../styles/mobile-shell.css";
import iconEventos from "../assets/Eventos.png";
import iconPerfil from "../assets/Perfil.png";
import iconActividad from "../assets/Actividad.png";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottomNav" aria-label="Navegación inferior">
      <div className="bottomNav__inner">
        <button
          type="button"
          className={`bottomNav__link ${isActive("/eventos") ? "is-active" : ""}`}
          onClick={() => navigate("/eventos")}
          aria-label="Eventos"
        >
          <img src={iconEventos} alt="" className="bottomNav__iconImage" />
        </button>

        <button
          type="button"
          className={`bottomNav__link ${isActive("/perfil") ? "is-active" : ""}`}
          onClick={() => navigate("/perfil")}
          aria-label="Perfil"
        >
          <img src={iconPerfil} alt="" className="bottomNav__iconImage" />
        </button>

        <button
          type="button"
          className={`bottomNav__link ${isActive("/actividad") ? "is-active" : ""}`}
          onClick={() => navigate("/actividad")}
          aria-label="Actividad"
        >
          <img src={iconActividad} alt="" className="bottomNav__iconImage" />
        </button>
      </div>
    </nav>
  );
}
