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
    <button type="button" className="messagesPage__thread" onClick={() => onOpen?.(thread)}>
      <div className="messagesPage__threadAvatar">
        {thread.avatar_url ? (
          <img src={thread.avatar_url} alt={thread.name || "Conversación"} />
        ) : (
          <span>{initials(thread.name || thread.email)}</span>
        )}
      </div>

      <div className="messagesPage__threadBody">
        <div className="messagesPage__threadTop">
          <strong className="messagesPage__threadName">{thread.name || "Conversación"}</strong>
          <span className="messagesPage__threadTime">{timeShort(thread.updated_at)}</span>
        </div>

        <p className="messagesPage__threadSnippet">
          {thread.last_message || "Sin mensajes recientes."}
        </p>
      </div>

      <div className="messagesPage__threadMeta">
        {thread.unread ? (
          <span className="messagesPage__unreadBadge" aria-label="Mensajes sin leer" />
        ) : (
          <span className="messagesPage__chevron" aria-hidden="true">
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
    <div className="app-page messagesPage">
      <section className="app-card messagesPage__hero">
        <div className="messagesPage__heroCopy">
          <span className="app-badge app-badge--primary">Mensajes</span>
          <h2 className="messagesPage__title">Conversaciones y solicitudes</h2>
          <p className="messagesPage__description">
            Sigue el hilo de tus chats y coordina quedadas con otros usuarios.
          </p>
        </div>

        <div className="messagesPage__heroActions">
          <button type="button" className="app-button app-button--ghost app-button--sm" onClick={() => nav(-1)}>
            Volver
          </button>
          <button
            type="button"
            className="app-button app-button--primary app-button--sm"
            onClick={() => toast?.info?.("Nuevo mensaje próximamente")}
            disabled={!isAuthed}
          >
            Nuevo mensaje
          </button>
        </div>
      </section>

      <div className="messagesPage__layout">
        <section className="app-card messagesPage__inbox">
          <div className="messagesPage__sectionHead">
            <div className="app-card__header">
              <span className="app-badge">Bandeja</span>
              <h3 className="app-card__title">Conversaciones activas</h3>
              <p className="app-card__description">
                Busca por nombre o por contenido reciente.
              </p>
            </div>

            <button
              type="button"
              className="app-button app-button--secondary app-button--sm"
              onClick={() => load(q)}
              disabled={loading || !token}
            >
              {loading ? "Actualizando…" : "Recargar"}
            </button>
          </div>

          <div className="messagesPage__search">
            <label className="app-field">
              <span className="app-label">Buscar conversación</span>
              <input
                className="app-input"
                placeholder="Nombre, usuario o contenido reciente"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={!token}
              />
            </label>
          </div>

          {!token ? (
            <div className="app-empty">
              <strong>Necesitas iniciar sesión</strong>
              <span>Accede a tu cuenta para ver mensajes, solicitudes y conversaciones.</span>
              <Link to="/login" className="app-button app-button--primary app-button--sm">
                Iniciar sesión
              </Link>
            </div>
          ) : loading ? (
            <div className="app-empty">
              <strong>Cargando mensajes</strong>
              <span>Estamos actualizando tu bandeja de entrada.</span>
            </div>
          ) : error ? (
            <div className="app-empty">
              <strong>No se pudieron cargar</strong>
              <span>{error}</span>
            </div>
          ) : list.length === 0 ? (
            <div className="app-empty">
              <strong>No hay conversaciones aún</strong>
              <span>Cuando empieces a hablar con otros usuarios, aparecerán aquí.</span>
            </div>
          ) : (
            <div className="messagesPage__threadList">
              {list.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} onOpen={openThread} />
              ))}
            </div>
          )}
        </section>

        <aside className="app-card messagesPage__tips">
          <div className="app-card__header">
            <span className="app-badge app-badge--warning">Uso recomendado</span>
            <h3 className="app-card__title">Mantén la coordinación clara</h3>
            <p className="app-card__description">
              Mensajes pensados para cerrar detalles del plan sin salir de la app.
            </p>
          </div>

          <div className="messagesPage__tipsList">
            <article className="messagesPage__tip">
              <strong>Directo</strong>
              <p>Coordina hora, punto de encuentro y cambios de última hora.</p>
            </article>

            <article className="messagesPage__tip">
              <strong>Claro</strong>
              <p>Mantén cada conversación ligada al contexto deportivo correspondiente.</p>
            </article>

            <article className="messagesPage__tip">
              <strong>Útil</strong>
              <p>Deja por escrito ubicación, hora y material necesario para no perder detalles.</p>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}
