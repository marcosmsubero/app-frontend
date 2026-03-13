import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMThreads } from "../services/api";

function initialsFromNameOrEmail(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function timeAgoLabel(dateOrIso) {
  try {
    const d = new Date(dateOrIso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);

    if (min < 1) return "ahora";
    if (min < 60) return `${min} min`;

    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;

    const days = Math.floor(h / 24);
    return `${days} d`;
  } catch {
    return "";
  }
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
  const unreadCount = getUnreadCount(thread);

  return (
    <button
      type="button"
      className={`messagesSimple__row${
        unreadCount > 0 ? " messagesSimple__row--unread" : ""
      }`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="messagesSimple__avatar">
        {thread?.avatar_url ? (
          <img src={thread.avatar_url} alt={getThreadName(thread)} />
        ) : (
          <span>{initialsFromNameOrEmail(getThreadName(thread))}</span>
        )}
      </div>

      <div className="messagesSimple__content">
        <div className="messagesSimple__text">
          <strong>{getThreadName(thread)}</strong>{" "}
          <span>{getThreadPreview(thread)}</span>
        </div>

        <div className="messagesSimple__meta">
          <span>{timeAgoLabel(thread?.updated_at)}</span>
        </div>
      </div>

      <div className="messagesSimple__state">
        {unreadCount > 0 ? (
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
  const nav = useNavigate();
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
    };
  }, [q, token]);

  const list = useMemo(() => threads || [], [threads]);

  const unreadThreads = useMemo(() => {
    return list.filter((t) => getUnreadCount(t) > 0).length;
  }, [list]);

  function openThread(thread) {
    if (!thread?.id) return;

    const threadIds = list.map((item) => item.id);
    nav(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body">
          <div className="page__header">
            <span className="page__eyebrow">Mensajería</span>
            <h1 className="page__title">Conversaciones</h1>
            <p className="page__subtitle">
              Revisa tus chats y coordina actividades con tu red deportiva.
            </p>
          </div>
        </div>
      </div>

      <div className="page__columns">

        <div className="app-stack app-stack--lg">

          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">
                    Bandeja de conversaciones
                  </div>

                  <div className="app-section-header__subtitle">
                    Tus chats ordenados por actividad reciente.
                  </div>
                </div>

                {unreadThreads > 0 && (
                  <span className="app-badge app-badge--primary">
                    {unreadThreads} sin leer
                  </span>
                )}
              </div>
            </div>

            <div className="app-card__body app-stack">

              <div className="messagesSimple__toolbar">

                <div className="app-field">
                  <label className="app-label">Buscar conversación</label>

                  <input
                    className="app-input"
                    placeholder="Ej. Carlos, trail..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={!token}
                  />
                </div>

                <button
                  className="app-button app-button--ghost app-button--sm"
                  onClick={() => load(q)}
                  disabled={!token || loading}
                >
                  {loading ? "Actualizando..." : "Actualizar"}
                </button>

              </div>

              {!token ? (
                <div className="app-empty">
                  <div className="messagesSimple__emptyBody">
                    <strong>Necesitas iniciar sesión</strong>
                    <p>Accede a tu cuenta para revisar tus mensajes.</p>

                    <Link to="/login" className="app-button app-button--primary">
                      Iniciar sesión
                    </Link>
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
                    <p>
                      Cuando interactúes con otros usuarios aparecerán aquí.
                    </p>
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

            </div>
          </div>

        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">

              <div className="app-section-header__title">
                Centro de mensajes
              </div>

              <p className="app-text-soft">
                Coordina quedadas, responde a otros usuarios y revisa tu actividad.
              </p>

              <div className="app-list">

                <div className="app-list-item">
                  <div className="app-badge app-badge--primary">Chats</div>
                  <div>
                    <strong>Conversaciones privadas</strong>
                    <div className="app-text-soft">
                      Mensajes directos entre usuarios.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--success">Grupos</div>
                  <div>
                    <strong>Mensajes de comunidad</strong>
                    <div className="app-text-soft">
                      Actividad dentro de grupos y planes.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--warning">Actividad</div>
                  <div>
                    <strong>Coordina actividades</strong>
                    <div className="app-text-soft">
                      Mantén conversaciones antes de una quedada.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </aside>

      </div>
    </section>
  );
}
