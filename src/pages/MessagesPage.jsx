import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBlockedIds } from "../hooks/useBlockedIds";
import { apiDMThreads } from "../services/api";
import ListItem from "../components/ui/ListItem";
import Skeleton from "../components/ui/Skeleton";

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
  const name = getThreadName(thread);
  const preview = getThreadPreview(thread);
  const time = timeAgoLabel(thread?.updated_at);

  const leading = (
    <div className="messagesSimple__avatar">
      {thread?.avatar_url ? (
        <img src={thread.avatar_url} alt={name} />
      ) : (
        <span>{initialsFromNameOrEmail(name)}</span>
      )}
    </div>
  );

  const trailing = unreadCount > 0 ? (
    <span className="messagesSimple__badge" aria-label={`${unreadCount} sin leer`}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  ) : (
    <span className="messagesSimple__meta">{time}</span>
  );

  return (
    <ListItem
      onClick={() => onOpen?.(thread)}
      leading={leading}
      title={name}
      text={preview}
      trailing={trailing}
      className={unreadCount > 0 ? "messagesSimple__row--unread" : ""}
    />
  );
}

export default function MessagesPage() {
  const nav = useNavigate();
  const { token } = useAuth();
  const { blockedIds } = useBlockedIds();

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, token]);

  const list = useMemo(() => {
    const all = threads || [];
    if (!blockedIds || blockedIds.size === 0) return all;
    return all.filter((t) => {
      const peerId =
        t?.other_user_id ??
        t?.peer_user_id ??
        t?.participant_user_id ??
        t?.user_id;
      if (peerId == null) return true;
      return !blockedIds.has(String(peerId));
    });
  }, [threads, blockedIds]);

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
      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">Bandeja de conversaciones</div>
            <div className="app-section-header__subtitle">
              Chats privados ordenados por actividad reciente.
            </div>
          </div>

          {unreadThreads > 0 ? (
            <span className="app-badge app-badge--primary">
              {unreadThreads} sin leer
            </span>
          ) : null}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="messagesSimple__toolbar">
          <div className="app-field" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <input
              className="app-input"
              type="search"
              placeholder="Buscar conversación"
              aria-label="Buscar conversación"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={!token}
            />
          </div>

          <button
            type="button"
            className="app-button app-button--ghost app-button--sm app-button--icon-only"
            onClick={() => load(q)}
            disabled={!token || loading}
            aria-label={loading ? "Actualizando" : "Actualizar"}
            aria-busy={loading || undefined}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </section>

      <section className="sectionBlock">
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
        ) : loading && list.length === 0 ? (
          <div className="messagesSimple__list">
            <Skeleton variant="row" />
            <Skeleton variant="row" />
            <Skeleton variant="row" />
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
              <MessageRow key={thread.id} thread={thread} onOpen={openThread} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
