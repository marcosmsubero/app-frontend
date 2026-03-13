import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMThreads } from "../services/api";

import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Loader,
} from "../components/ui";

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
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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

function ThreadRow({ thread, onOpen }) {
  const name = getThreadName(thread);
  const preview = getThreadPreview(thread);
  const unreadCount = getUnreadCount(thread);

  return (
    <button
      type="button"
      className={`threadRow ${unreadCount > 0 ? "threadRow--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="threadRow__avatar">
        {thread?.avatar_url ? (
          <img src={thread.avatar_url} alt={name} />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>

      <div className="threadRow__body">
        <div className="threadRow__top">
          <strong>{name}</strong>
          <span>{timeShort(thread?.updated_at)}</span>
        </div>

        <p className="threadRow__preview">{preview}</p>
      </div>

      <div className="threadRow__state">
        {unreadCount > 0 ? (
          <span className="threadRow__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="threadRow__chevron">›</span>
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

  const unreadThreads = useMemo(() => {
    return list.filter((thread) => getUnreadCount(thread) > 0).length;
  }, [list]);

  function openThread(thread) {
    if (!thread?.id) return;

    const threadIds = list.map((item) => item.id);
    navigate(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  const activeSearch = q.trim();

  return (
    <section className="page">
      <div className="page__hero">
        <div className="page__header">
          <span className="page__eyebrow">Mensajería</span>
          <h1 className="page__title">Mensajes</h1>
          <p className="page__subtitle">
            Revisa tus conversaciones y mantén la coordinación con tu red deportiva.
          </p>
        </div>

        <div className="split-actions">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          <Button
            variant="secondary"
            onClick={() => toast?.info?.("Nuevo mensaje próximamente")}
            disabled={!token}
          >
            Nuevo mensaje
          </Button>
        </div>
      </div>

      <div className="page__columns">
        <div className="app-stack app-stack--lg">

          <Card>
            <CardBody className="app-stack">

              <div className="app-section-header">
                <div>
                  <div className="app-section-header__title">
                    Conversaciones
                  </div>

                  <div className="app-section-header__subtitle">
                    Tus chats más recientes ordenados por actividad.
                  </div>
                </div>

                {unreadThreads > 0 && (
                  <Badge>{unreadThreads} sin leer</Badge>
                )}
              </div>

              <Input
                label="Buscar conversación"
                placeholder="Ej. Carlos, trail, grupo..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={!token}
              />

              {!token ? (
                <EmptyState
                  title="Inicia sesión para ver tus mensajes"
                  description="Necesitas una sesión activa para acceder a tus conversaciones."
                  actionLabel="Ir al inicio"
                  onAction={() => navigate("/")}
                />
              ) : loading && list.length === 0 ? (
                <Loader label="Cargando conversaciones" centered block />
              ) : error ? (
                <EmptyState
                  title="No se pudieron cargar"
                  description={error}
                  actionLabel="Reintentar"
                  onAction={() => load(q)}
                />
              ) : list.length === 0 ? (
                <EmptyState
                  title={
                    activeSearch
                      ? "No hay resultados"
                      : "No hay conversaciones"
                  }
                  description={
                    activeSearch
                      ? "Prueba con otro término."
                      : "Cuando interactúes con otros usuarios aparecerán aquí."
                  }
                />
              ) : (
                <div className="threadList">
                  {list.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      onOpen={openThread}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

        </div>

        <aside className="page__sidebar">
          <Card className="app-card--soft">
            <CardBody className="app-stack">
              <div className="app-section-header__title">
                Centro de mensajes
              </div>

              <p className="app-text-soft">
                Aquí puedes revisar conversaciones activas, responder mensajes
                y continuar la coordinación de actividades deportivas.
              </p>

              <div className="app-list">
                <div className="app-list-item">
                  <strong>Chats directos</strong>
                  <div className="app-text-soft">
                    Conversaciones privadas entre usuarios.
                  </div>
                </div>

                <div className="app-list-item">
                  <strong>Grupos</strong>
                  <div className="app-text-soft">
                    Mensajes asociados a comunidades o actividades.
                  </div>
                </div>

                <div className="app-list-item">
                  <strong>Actividad</strong>
                  <div className="app-text-soft">
                    Mantente al día con cambios y coordinación.
                  </div>
                </div>
              </div>

            </CardBody>
          </Card>
        </aside>
      </div>
    </section>
  );
}
