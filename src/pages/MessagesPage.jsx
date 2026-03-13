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

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  return `${days} d`;
}

function getThreadName(thread) {
  return (
    thread?.name ||
    thread?.title ||
    thread?.user_name ||
    thread?.participant_name ||
    "Conversación"
  );
}

function getThreadPreview(thread) {
  return (
    thread?.last_message ||
    thread?.preview ||
    thread?.snippet ||
    "Sin mensajes recientes"
  );
}

function getUnreadCount(thread) {
  if (typeof thread?.unread_count === "number") return thread.unread_count;
  if (thread?.unread === true) return 1;
  return 0;
}

function MessageRow({ thread, onOpen }) {
  const name = getThreadName(thread);
  const preview = getThreadPreview(thread);
  const unreadCount = getUnreadCount(thread);

  return (
    <button
      type="button"
      className={`messagesSimple__row${unreadCount ? " messagesSimple__row--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="messagesSimple__avatar">
        {thread?.avatar_url ? (
          <img src={thread.avatar_url} alt={name} />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>

      <div className="messagesSimple__content">
        <div className="messagesSimple__text">
          <strong>{name}</strong>{" "}
          <span>{preview}</span>
        </div>

        <div className="messagesSimple__meta">
          <span>{timeAgo(thread?.updated_at)}</span>
        </div>
      </div>

      <div className="messagesSimple__state">
        {unreadCount ? (
          <span className="messagesSimple__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="messagesSimple__chevron">›</span>
        )}
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuth();

  const [q, setQ] = useState("");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, [q, token]);

  const list = useMemo(() => threads || [], [threads]);
  const unreadThreads = useMemo(
    () => list.filter((t) => getUnreadCount(t) > 0).length,
    [list]
  );

  function openThread(thread) {
    if (!thread?.id) return;
    const threadIds = list.map((item) => item.id);
    navigate(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  return (
    <section className="messagesSimple">
      <div className="messagesSimple__hero">
        <div className="messagesSimple__heroCopy">
          <span className="app-kicker">Mensajes</span>
          <h1 className="messagesSimple__title">Conversaciones</h1>
          <p className="messagesSimple__subtitle">
            Revisa tus chats y mantén la coordinación con tu red deportiva.
          </p>
        </div>

        <div className="messagesSimple__heroActions">
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>

          <button
            type="button"
            className="app-button app-button--primary"
            onClick={() => toast?.info?.("Nuevo mensaje próximamente")}
            disabled={!token}
          >
            Nuevo mensaje
          </button>
        </div>
      </div>

      <div className="messagesSimple__layout">
        <div className="messagesSimple__main">
          <section className="messagesSimple__panel">
            <div className="messagesSimple__panelHead">
              <div>
                <p className="app-kicker">Bandeja</p>
                <h2 className="app-title">Conversaciones</h2>
                <p className="app-subtitle">
                  Tus chats más recientes ordenados por actividad.
                </p>
              </div>

              {unreadThreads > 0 && (
                <span className="app-badge app-badge--primary">
                  {unreadThreads} sin leer
                </span>
              )}
            </div>

            <div className="messagesSimple__toolbar">
              <input
                className="app-input"
                placeholder="Buscar conversación..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={!token}
              />
            </div>

            {!token ? (
              <div className="app-empty">
                <div className="messagesSimple__emptyBody">
                  <strong>Inicia sesión para ver tus mensajes</strong>
                  <p>Necesitas una sesión activa para acceder a tus conversaciones.</p>
                </div>
              </div>
            ) : loading && list.length === 0 ? (
              <div className="app-empty">
                <div className="messagesSimple__emptyBody">
                  <strong>Cargando conversaciones</strong>
                </div>
              </div>
            ) : error ? (
              <div className="app-empty">
                <div className="messagesSimple__emptyBody">
                  <strong>No se pudieron cargar</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : list.length === 0 ? (
              <div className="app-empty">
                <div className="messagesSimple__emptyBody">
                  <strong>No hay conversaciones</strong>
                  <p>Cuando interactúes con otros usuarios aparecerán aquí.</p>
                </div>
              </div>
            ) : (
              <div className="messagesSimple__list">
                {list.map((thread) => (
                  <MessageRow
                    key={thread.id}
                    thread={thread}
                    onOpen={openThread}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="messagesSimple__aside">
          <section className="messagesSimple__asideCard">
            <div className="messagesSimple__panelHead">
              <div>
                <p className="app-kicker">Centro de mensajes</p>
                <h2 className="app-title">Cómo usarlo</h2>
                <p className="app-subtitle">
                  Este panel te ayuda a mantener la coordinación con tu red deportiva.
                </p>
              </div>
            </div>

            <div className="messagesSimple__asideList">
              <div className="messagesSimple__asideItem">
                <strong>Chats directos</strong>
                <p>Conversaciones privadas entre usuarios.</p>
              </div>

              <div className="messagesSimple__asideItem">
                <strong>Grupos</strong>
                <p>Mensajes asociados a comunidades o actividades.</p>
              </div>

              <div className="messagesSimple__asideItem">
                <strong>Actividad</strong>
                <p>Coordina quedadas y planes con rapidez.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
