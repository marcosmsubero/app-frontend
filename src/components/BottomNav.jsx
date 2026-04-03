import { useNavigate, useLocation } from "react-router-dom";
import "../styles/mobile-shell.css";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottomNav">

      <img
        src="/src/assets/Eventos.png"
        className={isActive("/eventos") ? "active" : ""}
        onClick={() => navigate("/eventos")}
      />

      <img
        src="/src/assets/Perfil.png"
        className={isActive("/perfil") ? "active" : ""}
        onClick={() => navigate("/perfil")}
      />

      <img
        src="/src/assets/Actividad.png"
        className={isActive("/actividad") ? "active" : ""}
        onClick={() => navigate("/actividad")}
      />

    </nav>
  );
}
