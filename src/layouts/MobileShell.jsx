import "../styles/mobile-shell.css";
import BottomNav from "../components/BottomNav";

export default function MobileShell({ children }) {
  return (
    <div className="mobile-shell">
      <div className="mobile-content">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
