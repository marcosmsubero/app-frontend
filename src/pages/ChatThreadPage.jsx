import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMMessages, apiDMSend, apiDMThreads } from "../services/api";

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function timeTiny(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function statusGlyph(status) {
  if (status === "sent") return "✓";
  if (status === "delivered") return "✓✓";
  if (status === "read") return "✓✓";
  return "";
}

function normalizeMessage(msg, myUserId) {
  const senderId = Number(msg?.sender_id);
  const mine = Number.isFinite(senderId) && Number(senderId) === Number(myUserId);

  return {
    id: String(msg?.id ?? `msg_${Date.now()}`),
    from: mine ? "me" : "them",
    sender_id: msg?.sender_id ?? null,
    text: String(msg?.text ?? ""),
    created_at: msg?.created_at ?? new Date().toISOString(),
    status: mine ? "delivered" : undefined,
  };
}

function getThreadDisplayName(thread) {
  return (
    thread?.name ||
    thread?.title ||
    thread?.participant_name ||
    thread?.user_name ||
    "Conversación"
  );
}

function getThreadAvatar(thread) {
  return thread?.avatar_url || null;
}

export default function ChatThreadPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { threadId } = useParams();
  const { token, me } = useAuth();
  const toast = useToast();

  const threadIds = Array.isArray(location.state?.threadIds)
    ? location.state.threadIds
    : [];

  const threadFromState = location.state?.thread || null;

  const idx = threadIds.indexOf(threadId);
  const prevId = idx > 0 ? threadIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < threadIds.length - 1 ? threadIds[idx + 1] : null;

  const [thread, setThread] = useState(() =>
    threadFromState?.id === threadId
      ? threadFromState
      : { id: threadId, name: "Conversación", avatar_url: null }
  );

  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const endRef = useRef(null);
  const composerRef = useRef(null);

  const displayName = useMemo(() => getThreadDisplayName(thread), [thread]);
  const avatarUrl = useMemo(() => getThreadAvatar(thread), [thread]);

  function scrollToBottom(smooth = true) {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  async function loadThreadMeta() {
    if (!token || !threadId) {
      setLoadingThread(false);
      return;
    }

    setLoadingThread(true);

    try {
      const res = await apiDMThreads("", token);
      const items = Array.isArray(res) ? res : res?.items || [];
      const found = items.find((item) => String(item.id) === String(threadId));

      if (found) {
        setThread(found);
      } else if (threadFromState?.id === threadId) {
        setThread(threadFromState);
      } else {
        setThread({ id: threadId, name: "Conversación", avatar_url: null });
      }
    } catch {
      if (threadFromState?.id === threadId) {
        setThread(threadFromState);
      }
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadMessages({ silent = false } = {}) {
    if (!token || !threadId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    if (!silent) {
      setLoadingMessages(true);
      setError("");
    }

    try {
      const res = await apiDMMessages(threadId, token);
      const items = Array.isArray(res) ? res : res?.items || [];
      const normalized = items.map((msg) => normalizeMessage(msg, me?.id));
      setMessages(normalized);
      setError("");
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los mensajes");
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  }

  useEffect(() => {
    setMessages([]);
    setError("");
    setText("");
    loadThreadMeta();
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, token, me?.id]);

  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  async function send() {
    const value = String(text || "").trim();
    if (!value || sending || !token || !threadId) return;

    const tempId = `tmp_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimistic = {
      id: tempId,
      from: "me",
      sender_id: me?.id ?? null,
      text: value,
      created_at: nowIso,
      status: "sent",
    };

    setSending(true);
    setText("");
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiDMSend(threadId, value, token);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "delivered" } : m
        )
      );

      await loadMessages({ silent: true });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText((prev) => (prev ? prev : value));
      toast?.error?.(e?.message || "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
      window.setTimeout(() => {
        composerRef.current?.focus();
      }, 0);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const touch = useRef({ x0: 0, y0: 0, t0: 0, edge: false });

  function onTouchStart(e) {
    const t = e.touches?.[0];
    if (!t) return;
    touch.current.x0 = t.clientX;
    touch.current.y0 = t.clientY;
    touch.current.t0 = Date.now();
    touch.current.edge = t.clientX <= 24;
  }

  function onTouchEnd(e) {
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touch.current.x0;
    const dy = t.clientY - touch.current.y0;
    const dt = Date.now() - touch.current.t0;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (dt > 650) return;
    if (absX < 60) return;
    if (absY > 55) return;

    if (touch.current.edge && dx > 0) {
      nav(-1);
      return;
    }

    if (dx < 0 && nextId) {
      nav(`/mensajes/${nextId}`, {
        replace: true,
        state: { threadIds },
      });
      return;
    }

    if (dx > 0 && prevId) {
      nav(`/mensajes/${prevId}`, {
        replace: true,
        state: { threadIds },
      });
    }
  }

  return (
    <div
      className="page chat-page"
      style={{ paddingBottom: 96 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="chat-hero quartz-surface">
        <div className="chat-heroTop">
          <button
            type="button"
            className="chat-back"
            onClick={() => nav(-1)}
            aria-label="Volver"
            title="Volver"
          >
            ‹
          </button>

          <div className="chat-titleWrap">
            <div className="chat-title">
              {loadingThread ? "Cargando…" : displayName}
            </div>
            <div className="chat-sub">
              {loadingMessages
                ? "Cargando mensajes…"
                : error
                ? "Error de carga"
                : "Conversación privada"}
            </div>
          </div>

          <div className="chat-ava" aria-label="Avatar chat">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              <span>{initials(displayName)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="chat-list">
        {loadingMessages ? (
          <div className="app-empty">
            <div className="messagesSimple__emptyBody">
              <strong>Cargando conversación</strong>
              <p>Estamos recuperando los mensajes del chat.</p>
            </div>
          </div>
        ) : error ? (
          <div className="app-empty">
            <div className="messagesSimple__emptyBody">
              <strong>No se pudo abrir el chat</strong>
              <p>{error}</p>
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => loadMessages()}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="app-empty">
            <div className="messagesSimple__emptyBody">
              <strong>Aún no hay mensajes</strong>
              <p>Envía el primero para iniciar la conversación.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.from === "me";

            return (
              <div key={m.id} className={`chat-row ${mine ? "mine" : "theirs"}`}>
                {!mine && (
                  <div className="chat-miniAva" aria-hidden="true">
                    {initials(displayName)}
                  </div>
                )}

                <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                  <div className="chat-text">{m.text}</div>

                  <div className="chat-metaRow">
                    <div className="chat-time">{timeTiny(m.created_at)}</div>
                    {mine && m.status ? (
                      <div
                        className={`chat-status ${
                          m.status === "read" ? "read" : ""
                        }`}
                      >
                        {statusGlyph(m.status)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={endRef} />
      </div>

      <div className="chat-composer">
        <div className="chat-composerInner">
          <textarea
            ref={composerRef}
            className="chat-input"
            rows={1}
            placeholder="Escribe un mensaje…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!!error || sending}
          />

          <button
            type="button"
            className="chat-send"
            onClick={send}
            disabled={sending || !text.trim() || !!error}
            aria-label="Enviar"
            title="Enviar"
          >
            {sending ? "…" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}
