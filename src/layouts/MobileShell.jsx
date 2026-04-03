import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/mobile-shell.css";

export default function MobileShell() {
  return (
    <div className="appContainer">
      
      {/* HEADER FLOATING */}
      <header className="appHeader">
        <img
          src="/src/assets/Logo.png"
          alt="RunVibe"
          className="appLogo"
        />
      </header>

      {/* CONTENIDO */}
      <main className="pageContent">
        <Outlet />
      </main>

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}
