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

function getThreadMeta(thread) {
  const parts = [];

  if (thread?.is_group || thread?.group_id) parts.push("Grupo");
  if (thread?.activity_title) parts.push(thread.activity_title);
  if (thread?.sport) parts.push(thread.sport);

  return parts.filter(Boolean).slice(0, 2);
}

function SummaryTile({ value, label }) {
  return (
    <Card className="messages-summaryCard" compact>
      <CardBody>
        <div className="messages-summaryValue">{value}</div>
        <div className="messages-summaryLabel">{label}</div>
      </CardBody>
    </Card>
  );
}

function ThreadRow({ thread, onOpen }) {
  const name = getThreadName(thread);
  const preview = getThreadPreview(thread);
  const unreadCount = getUnreadCount(thread);
  const meta = getThreadMeta(thread);

  return (
    <button
      type="button"
      className={`threadRow ui-card ${unreadCount > 0 ? "threadRow--unread" : ""}`}
      onClick={() => onOpen?.(thread)}
    >
      <div className="threadRow__avatarWrap">
        {thread?.avatar_url ? (
          <img
            src={thread.avatar_url}
            alt={name}
            className="threadRow__avatar"
          />
        ) : (
          <div className="threadRow__avatarFallback">{initials(name)}</div>
        )}
      </div>

      <div className="threadRow__body">
        <div className="threadRow__top">
          <strong className="threadRow__name">{name}</strong>
          <span className="threadRow__time">{timeShort(thread?.updated_at)}</span>
        </div>

        {meta.length > 0 ? (
          <div className="threadRow__badges">
            {meta.map((item) => (
              <Badge key={`${thread?.id}-${item}`}>{item}</Badge>
            ))}
          </div>
        ) : null}

        <p className="threadRow__preview">{preview}</p>
      </div>

      <div className="threadRow__side">
        {unreadCount > 0 ? (
          <span className="threadRow__unreadCount">
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

  const totalUnreadMessages = useMemo(() => {
    return list.reduce((acc, thread) => acc + getUnreadCount(thread), 0);
  }, [list]);

  const activeSearch = q.trim();
  const hasThreads = list.length > 0;

  function openThread(thread) {
    if (!thread?.id) return;

    const threadIds = list.map((item) => item.id);
    navigate(`/mensajes/${thread.id}`, { state: { threadIds } });
  }

  return (
    <div className="messages-pageShell">
      <Card className="messages-hero">
        <CardBody>
          <div className="messages-heroTop">
            <div>
              <p className="messages-sectionEyebrow">Mensajería</p>
              <h1 className="messages-title">Mensajes</h1>
              <p className="messages-subtitle">
                Gestiona tus conversaciones, revisa actividad reciente y accede
                rápido a tus chats y solicitudes.
              </p>
            </div>

            <div className="messages-heroActions">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate(-1)}
                aria-label="Volver"
                title="Volver"
              >
                Volver
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => toast?.info?.("Nuevo mensaje próximamente")}
                aria-label="Nuevo mensaje"
                title="Nuevo mensaje"
                disabled={!token}
              >
                Nuevo mensaje
              </Button>
            </div>
          </div>

          <div className="messages-summaryGrid">
            <SummaryTile value={list.length} label="conversaciones" />
            <SummaryTile value={unreadThreads} label="chats sin leer" />
            <SummaryTile value={totalUnreadMessages} label="mensajes pendientes" />
          </div>
        </CardBody>
      </Card>

      <Card className="messages-toolbar">
        <CardBody>
          <div className="messages-toolbarRow">
            <Input
              id="messages-search"
              name="messages-search"
              label="Buscar conversaciones"
              hint="Busca por nombre o conversación"
              placeholder="Ej. Carlos, trail, grupo del sábado..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={!token}
            />

            <div className="messages-toolbarActions">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => load(q)}
                disabled={!token || loading}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </Button>

              {activeSearch ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setQ("")}
                  disabled={!token}
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {!token ? (
        <Card className="messages-stateCard">
          <CardBody>
            <EmptyState
              title="Inicia sesión para ver tus mensajes"
              description="Necesitas una sesión activa para acceder a tus conversaciones y solicitudes."
              actionLabel="Ir al inicio"
              onAction={() => navigate("/")}
            />
          </CardBody>
        </Card>
      ) : loading && !hasThreads ? (
        <Card className="messages-stateCard">
          <CardBody>
            <Loader label="Cargando conversaciones" centered block />
          </CardBody>
        </Card>
      ) : error ? (
        <Card className="messages-stateCard">
          <CardBody>
            <EmptyState
              title="No se pudieron cargar los mensajes"
              description={error}
              actionLabel="Reintentar"
              onAction={() => load(q)}
            />
          </CardBody>
        </Card>
      ) : !hasThreads ? (
        <Card className="messages-stateCard">
          <CardBody>
            <EmptyState
              title={
                activeSearch
                  ? "No hay resultados para tu búsqueda"
                  : "No hay conversaciones todavía"
              }
              description={
                activeSearch
                  ? "Prueba con otro nombre o elimina el filtro para ver todas tus conversaciones."
                  : "Cuando empieces a interactuar con otras personas o grupos, aparecerán aquí."
              }
              actionLabel={activeSearch ? "Ver todo" : undefined}
              onAction={activeSearch ? () => setQ("") : undefined}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="messages-contentGrid">
          <Card className="messages-listCard">
            <CardBody>
              <div className="messages-listHeader">
                <div>
                  <p className="messages-sectionEyebrow">Bandeja</p>
                  <h2 className="messages-listTitle">
                    {activeSearch ? "Resultados" : "Conversaciones recientes"}
                  </h2>
                  <p className="messages-listSubtitle">
                    {activeSearch
                      ? `Mostrando coincidencias para “${activeSearch}”.`
                      : "Tus chats más recientes, ordenados por última actividad."}
                  </p>
                </div>

                {unreadThreads > 0 ? <Badge>{unreadThreads} sin leer</Badge> : null}
              </div>

              <div className="messages-threadList">
                {list.map((thread) => (
                  <ThreadRow
                    key={thread?.id || `${getThreadName(thread)}-${thread?.updated_at || ""}`}
                    thread={thread}
                    onOpen={openThread}
                  />
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="messages-sideInfo">
            <CardBody>
              <div className="messages-listHeader">
                <div>
                  <p className="messages-sectionEyebrow">Vista rápida</p>
                  <h2 className="messages-listTitle">Estado de la bandeja</h2>
                </div>
              </div>

              <div className="messages-sideStack">
                <div className="messages-sideItem">
                  <strong>Conversaciones activas</strong>
                  <p>{list.length} abiertas o con historial reciente.</p>
                </div>

                <div className="messages-sideItem">
                  <strong>Mensajes pendientes</strong>
                  <p>
                    {totalUnreadMessages > 0
                      ? `Tienes ${totalUnreadMessages} mensajes pendientes de revisar.`
                      : "No tienes mensajes pendientes ahora mismo."}
                  </p>
                </div>

                <div className="messages-sideItem">
                  <strong>Siguiente paso</strong>
                  <p>
                    Entra en una conversación para responder, revisar contexto o
                    continuar la coordinación de una actividad.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
