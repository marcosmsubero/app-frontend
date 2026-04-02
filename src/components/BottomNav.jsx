import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { label: "Eventos", path: "/" },
    { label: "Perfil", path: "/profile" },
    { label: "Actividad", path: "/activity" }
  ];

  return (
    <div className="bottom-nav">
      {items.map((item) => {
        const active = location.pathname === item.path;

        return (
          <div
            key={item.path}
            className={`bottom-nav-item ${active ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            {/* ICON placeholder (se refactoriza en siguiente paso) */}
            <div style={{ fontSize: 20 }}>
              ●
            </div>

            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
