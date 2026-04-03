import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/mobile-shell.css";
import logo from "../assets/Logo.png";

export default function MobileShell() {
  return (
    <div className="appChrome">
      <header className="appTopbar">
        <div className="appTopbar__inner">
          <img src={logo} alt="RunVibe" className="appTopbar__logo" />
        </div>
      </header>

      <main className="appChrome__frame">
        <div className="appChrome__content">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
