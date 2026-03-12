import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiMarkNotifRead, apiNotifications } from "../services/api";

function timeAgoLabel(dateOrIso) {
  const d = new Date(dateOrIso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  return `${days} d`;
}

function initialsFromNameOrEmail(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function NotifItem({ n, onOpen }) {
  return (
    <button
      type="button"
      className={`nt-item ${n.unread ? "unread" : ""}`}
      onClick={() => onOpen?.(n)}
    >
      <div className="nt-ava">
        {n.avatar_url ? (
          <img src={n.avatar_url} alt="" />
        ) : (
          <span>{initialsFromNameOrEmail(n.from)}</span>
        )}
      </div>

      <div className="nt-mid">
        <div className="nt-text">
          <strong className="nt-from">{n.from}</strong>{" "}
          <span className="nt-msg">{n.text}</span>
        </div>

        <div className="nt-meta">
          <span className="nt-time">{timeAgoLabel(n.created_at)}</span>
          {n.badge ? <span className="nt-badge">{n.badge}</span> : null}
        </div>
      </div>

      <div className="nt-right">
        <span className="nt-chevron">›</span>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [tab, setTab] = useState("all"); // all | mentions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  const list = useMemo(() => data || [], [data]);

  async function load(currentTab = tab) {
    if (!token) {
      setData([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiNotifications(currentTab, token);
      // backend puede devolver array directamente o {items:[]}
      const items = Array.isArray(res) ? res : res?.items || [];
      setData(items);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  function routeFromNotif(n) {
    // Ajusta esto si tu backend trae un "target_url" o "entity_id"
    if (n?.type === "message") return "/mensajes";
    if (n?.type === "mention") return "/publicaciones";
    if (n?.type === "group") return "/grupos";
    if (n?.type === "meetup") return "/explorar";
    return "/explorar";
  }

  async function openNotif(n) {
    if (!n) return;

    // optimista: la marcamos como leída en UI ya
    setData((prev) =>
      (prev || []).map((x) => (x.id === n.id ? { ...x, unread: false } : x))
    );

    if (token && n.id && n.unread) {
      try {
        await apiMarkNotifRead(n.id, token);
      } catch (e) {
        // si falla, no bloqueamos navegación
        toast?.error?.(e?.message || "No se pudo marcar como leída");
      }
    }

    nav(routeFromNotif(n));
  }

  return (
    <div className="page nt-page" style={{ paddingBottom: 96 }}>
      <div className="nt-hero quartz-surface">
        <div className="nt-heroTop">
          <button
            type="button"
            className="nt-back"
            onClick={() => nav(-1)}
            aria-label="Volver"
            title="Volver"
          >
            ‹
          </button>

          <div className="nt-titleWrap">
            <div className="nt-title">Notificaciones</div>
            <div className="nt-sub">Actividad reciente</div>
          </div>

          {/* Placeholder visual para mantener el grid */}
          <button
            type="button"
            className="nt-action"
            onClick={() => load(tab)}
            aria-label="Recargar"
            title="Recargar"
            disabled={loading || !token}
          >
            ↻
          </button>
        </div>

        <div className="nt-tabs">
          <button
            type="button"
            className={`nt-tab ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
            disabled={loading}
          >
            Todo
          </button>
          <button
            type="button"
            className={`nt-tab ${tab === "mentions" ? "active" : ""}`}
            onClick={() => setTab("mentions")}
            disabled={loading}
          >
            Menciones
          </button>
        </div>
      </div>

      <div className="nt-list">
        {!token ? (
          <div className="card">
            <p className="muted m0">Inicia sesión para ver tus notificaciones.</p>
          </div>
        ) : loading ? (
          <div className="card">
            <p className="muted m0">Cargando…</p>
          </div>
        ) : error ? (
          <div className="card">
            <p className="muted m0">{error}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <p className="m0 text-black">
              No hay notificaciones.
            </p>
          </div>

        ) : (
          list.map((n) => <NotifItem key={n.id} n={n} onOpen={openNotif} />)
        )}
      </div>
    </div>
  );
}
