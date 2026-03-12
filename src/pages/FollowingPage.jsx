import { useNavigate } from "react-router-dom";

export default function FollowingPage() {
  const nav = useNavigate();

  return (
    <div className="page" style={{ paddingBottom: 96 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 12px" }}>
        <div className="neutral-card" style={{ padding: 14, borderRadius: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" className="icon-btn icon-btn--gold" onClick={() => nav(-1)} title="Volver" aria-label="Volver">
              ‹
            </button>
            <div style={{ fontWeight: 900 }}>Seguidos</div>
            <div style={{ width: 38 }} />
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            Próximamente: listado de seguidos (cuando exista backend).
          </div>
        </div>
      </div>
    </div>
  );
}
