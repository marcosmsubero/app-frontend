import { Link, Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import logo from "../assets/Logo.png";
import settingsIcon from "../assets/Ajustes.png";
import "../styles/mobile-shell.css";

export default function MobileShell() {
  return (
    <div className="appChrome">
      <header className="appTopbar">
        <div className="appTopbar__inner">
          <img src={logo} alt="RunVibe" className="appTopbar__logo" />

          <Link to="/ajustes" className="appTopbar__settings" aria-label="Ir a ajustes">
            <img src={settingsIcon} alt="" className="appTopbar__settingsIcon" />
          </Link>
        </div>
      </header>

      <div className="appChrome__frame">
        <main className="appChrome__main">
          <div className="appChrome__content">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
