import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMThreads } from "../services/api";

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function timeShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ThreadRow({ t, onOpen }) {
  return (
    <button
      type="button"
      className={`ms-item ${t.unread ? "unread" : ""}`}
      onClick={() => onOpen?.(t)}
    >
      <div className="ms-ava">
        {t.avatar_url ? <img src={t.avatar_url} alt="" /> : <span>{initials(t.name)}</span>}
      </div>

      <div className="ms-mid">
        <div className="ms-top">
          <div className="ms-name">{t.name}</div>
          <div className="ms-time">{timeShort(t.updated_at)}</div>
        </div>
        <div className="ms-snippet">{t.last_message}</div>
      </div>

      <div className="ms-right">
        {t.unread ? <span className="ms-dot" aria-label="No leído" /> : <span className="ms-chevron">›</span>}
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [q, setQ] = useState("");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // debounce búsqueda (300ms)
  const timerRef = useRef(null);

  async function load(query = q) {
    if (!token) {
      setThreads([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiDMThreads(query || "", token);
      const items = Array.isArray(res) ? res : res?.items || [];
      setThreads(items);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los mensajes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      load(q);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, token]);

  const list = useMemo(() => threads || [], [threads]);

  function openThread(t) {
    if (!t?.id) return;
    const threadIds = list.map((x) => x.id);
    nav(`/mensajes/${t.id}`, { state: { threadIds } });
  }

  return (
    <div className="page ms-page" style={{ paddingBottom: 96 }}>
      <div className="ms-hero quartz-surface">
        <div className="ms-heroTop">
          <button
            type="button"
            className="ms-back"
            onClick={() => nav(-1)}
            aria-label="Volver"
            title="Volver"
          >
            ‹
          </button>

          <div className="ms-titleWrap">
            <div className="ms-title">Mensajes</div>
            <div className="ms-sub">Chats y solicitudes</div>
          </div>

          <button
            type="button"
            className="ms-action"
            onClick={() => toast?.info?.("Próximamente")}
            aria-label="Nuevo mensaje"
            title="Nuevo mensaje (próximamente)"
            disabled={!token}
          >
            ＋
          </button>
        </div>

        <div className="ms-search">
          <span className="ms-searchIco" aria-hidden="true">⌕</span>
          <input
            className="ms-searchInput"
            placeholder="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={!token}
          />
        </div>
      </div>

      <div className="ms-list">
        {!token ? (
          <div className="card">
            <p className="muted m0">Inicia sesión para ver tus mensajes.</p>
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
            <p className="m0 text-black">No hay conversaciones aún.</p>
          </div>
        ) : (
          list.map((t) => <ThreadRow key={t.id} t={t} onOpen={openThread} />)
        )}
      </div>
    </div>
  );
}
