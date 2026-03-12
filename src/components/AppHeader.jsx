import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function AppHeader() {
  const location = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const { isAuthed, logout } = useAuth();

  const path = location.pathname;
  const isActive = (p) => path === p;

  // Si no hay sesión, no mostramos barra
  if (!isAuthed) return null;

  return (
    <div className="bottom-nav">
      <Link className={`bn-item ${isActive("/perfil") ? "active" : ""}`} to="/perfil">
        <span className="bn-ico">👤</span>
        <span className="bn-txt">Perfil</span>
      </Link>

      <Link className={`bn-item ${isActive("/explorar") ? "active" : ""}`} to="/explorar">
        <span className="bn-ico">🔎</span>
        <span className="bn-txt">Explorar</span>
      </Link>

      <Link className={`bn-item ${isActive("/groups") ? "active" : ""}`} to="/groups">
        <span className="bn-ico">👥</span>
        <span className="bn-txt">Grupos</span>
      </Link>

      <button
        className="bn-item"
        onClick={() => {
          logout();
          toast?.info?.("Sesión cerrada");
          nav("/", { replace: true });
        }}
      >
        <span className="bn-ico">🚪</span>
        <span className="bn-txt">Salir</span>
      </button>
    </div>
  );
}