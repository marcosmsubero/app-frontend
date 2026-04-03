import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import appIcon from "../assets/Icono.png";

export default function MobileShell() {
  return (
    <div className="appChrome">
      <div className="appChrome__frame">
        <header className="appTopbar appTopbar--brand">
          <div className="appBrandHeader">
            <img src={appIcon} alt="RunVibe" className="appBrandHeader__icon" />
            <span className="appBrandHeader__name">RunVibe</span>
          </div>
        </header>

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
