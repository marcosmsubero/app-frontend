import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function ThreadRow({ thread, onOpen }) {
  return (
    <button
      type="button"
      className={`thread-row${thread.unread ? " thread-row--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="thread-row__avatar">
        {thread.avatar_url ? (
          <img src={thread.avatar_url} alt={thread.name || "Usuario"} />
        ) : (
          <span>{initials(thread.name || thread.email)}</span>
        )}
      </div>

      <div className="thread-row__content">
        <div className="thread-row__top">
          <div className="thread-row__name">{thread.name || "Conversación"}</div>
          <div className="thread-row__time">{timeShort(thread.updated_at)}</div>
        </div>

        <div className="thread-row__message">
          {thread.last_message || "Sin mensajes recientes."}
        </div>
      </div>

      <div className="thread-row__meta">
        {thread.unread ? (
          <span className="thread-row__dot" aria-label="No leído" />
        ) : (
          <span className="thread-row__chevron" aria-hidden="true">
            ›
          </span>
        )}
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { token, isAuthed } = useAuth();

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

  function openThread(thread) {
    if (!thread?.id) return;
    const threadIds = list.map((item) => item.id);
    nav(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  return (
    <section className="page">
      <div className="page__hero glass-banner">
        <div className="glass-banner__body">
          <div className="page__header">
            <span className="page__eyebrow">Mensajes</span>
            <h1 className="page__title">Conversaciones y solicitudes</h1>
            <p className="page__subtitle">
              Sigue el hilo de tus chats y coordina quedadas con otros usuarios.
            </p>
          </div>

          <div className="split-actions">
            <button
              type="button"
              className="app-btn app-btn--secondary"
              onClick={() => nav(-1)}
            >
              Volver
            </button>

            <button
              type="button"
              className="app-btn app-btn--primary"
              onClick={() => toast?.info?.("Nuevo mensaje próximamente")}
              disabled={!isAuthed}
            >
              Nuevo mensaje
            </button>
          </div>
        </div>
      </div>

      <div className="page__columns">
        <div className="app-stack app-stack--lg">
          <div className="app-card">
            <div className="app-card__header">
              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">Bandeja</div>
                  <div className="app-section-header__subtitle">
                    Busca conversaciones activas por nombre o contenido reciente.
                  </div>
                </div>
                <button
                  type="button"
                  className="app-btn app-btn--secondary app-btn--sm"
                  onClick={() => load(q)}
                  disabled={loading || !token}
                >
                  {loading ? "Actualizando…" : "Recargar"}
                </button>
              </div>
            </div>

            <div className="app-card__body app-stack">
              <div className="app-field">
                <label className="app-label" htmlFor="messages-search">
                  Buscar conversación
                </label>
                <input
                  id="messages-search"
                  className="app-input"
                  placeholder="Escribe un nombre o una pista"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  disabled={!token}
                />
              </div>

              {!token ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">Necesitas iniciar sesión</div>
                  <div className="app-empty-state__text">
                    Accede a tu cuenta para ver mensajes, solicitudes y conversaciones.
                  </div>
                  <div className="split-actions" style={{ justifyContent: "center" }}>
                    <Link to="/login" className="app-btn app-btn--primary">
                      Iniciar sesión
                    </Link>
                  </div>
                </div>
              ) : loading ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">Cargando mensajes</div>
                  <div className="app-empty-state__text">
                    Estamos actualizando tu bandeja de entrada.
                  </div>
                </div>
              ) : error ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">No se pudieron cargar</div>
                  <div className="app-empty-state__text">{error}</div>
                </div>
              ) : list.length === 0 ? (
                <div className="app-empty-state">
                  <div className="app-empty-state__title">No hay conversaciones aún</div>
                  <div className="app-empty-state__text">
                    Cuando empieces a hablar con otros usuarios, aparecerán aquí.
                  </div>
                </div>
              ) : (
                <div className="thread-list">
                  {list.map((thread) => (
                    <ThreadRow key={thread.id} thread={thread} onOpen={openThread} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="page__sidebar">
          <div className="app-card app-card--soft">
            <div className="app-card__body app-stack">
              <div className="app-section-header__title">Uso recomendado</div>
              <p className="app-text-soft">
                Utiliza mensajes para confirmar hora, punto de encuentro y cambios de última hora.
              </p>

              <div className="app-list">
                <div className="app-list-item">
                  <div className="app-badge app-badge--primary">Directo</div>
                  <div>
                    <strong>Coordina sin salir de la app</strong>
                    <div className="app-text-soft">
                      Mantén la conversación ligada al contexto deportivo.
                    </div>
                  </div>
                </div>

                <div className="app-list-item">
                  <div className="app-badge app-badge--success">Claro</div>
                  <div>
                    <strong>Evita perder detalles</strong>
                    <div className="app-text-soft">
                      Deja por escrito ubicación, hora y material necesario.
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
