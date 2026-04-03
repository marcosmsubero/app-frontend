import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import logo from "../assets/Logo.png";
import "../styles/mobile-shell.css";

export default function MobileShell() {
  return (
    <div className="appChrome">
      <header className="appTopbar">
        <div className="appTopbar__inner">
          <img src={logo} alt="RunVibe" className="appTopbar__logo" />
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
