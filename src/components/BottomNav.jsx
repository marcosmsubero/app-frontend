import { useNavigate, useLocation } from "react-router-dom";
import "../styles/mobile-shell.css";
import iconEventos from "../assets/Eventos.png";
import iconPerfil from "../assets/Perfil.png";
import iconActividad from "../assets/Actividad.png";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottomNav">
      <div className="bottomNav__list">

        <button
          className={`bottomNav__link ${isActive("/eventos") ? "is-active" : ""}`}
          onClick={() => navigate("/eventos")}
        >
          <img src={iconEventos} alt="Eventos" className="bottomNav__iconImage" />
        </button>

        <button
          className={`bottomNav__link ${isActive("/perfil") ? "is-active" : ""}`}
          onClick={() => navigate("/perfil")}
        >
          <img src={iconPerfil} alt="Perfil" className="bottomNav__iconImage" />
        </button>

        <button
          className={`bottomNav__link ${isActive("/actividad") ? "is-active" : ""}`}
          onClick={() => navigate("/actividad")}
        >
          <img src={iconActividad} alt="Actividad" className="bottomNav__iconImage" />
        </button>

      </div>
    </nav>
  );
}
