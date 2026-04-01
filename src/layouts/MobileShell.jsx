import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function MobileShell() {
  return (
    <div className="appChrome">
      <main className="appChrome__main appChrome__main--bare">
        <div className="appChrome__content">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
