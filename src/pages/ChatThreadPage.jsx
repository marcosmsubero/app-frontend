import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || s[0];
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function timeTiny(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusGlyph(status) {
  // sent -> ✓, delivered -> ✓✓, read -> ✓✓ (gold)
  if (status === "sent") return "✓";
  if (status === "delivered") return "✓✓";
  if (status === "read") return "✓✓";
  return "";
}

export default function ChatThreadPage() {
  const nav = useNavigate();
  const { threadId } = useParams();
  const location = useLocation();
  const { me } = useAuth();

  // Orden para swipe entre chats
  const threadIds = Array.isArray(location.state?.threadIds) ? location.state.threadIds : [];
  const idx = threadIds.indexOf(threadId);
  const prevId = idx > 0 ? threadIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < threadIds.length - 1 ? threadIds[idx + 1] : null;

  // ⚠️ Mock thread
  const thread = useMemo(() => {
    const map = {
      t1: { id: "t1", name: "BlaBlaRun Zaragoza" },
      t2: { id: "t2", name: "Carlos" },
      t3: { id: "t3", name: "Coach Dani" },
    };
    return map[threadId] || { id: threadId, name: "Chat" };
  }, [threadId]);

  const [messages, setMessages] = useState(() => {
    const now = Date.now();
    return [
      {
        id: "m1",
        from: "them",
        text: "Ey! Tenemos una quedada cerca de ti 👀",
        created_at: new Date(now - 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m2",
        from: "me",
        text: "Genial, ¿a qué hora y dónde quedáis?",
        created_at: new Date(now - 55 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: "m3",
        from: "them",
        text: "Sábado 9:00 en el Parque Grande. Ritmo 5:00–5:30.",
        created_at: new Date(now - 53 * 60 * 1000).toISOString(),
      },
    ];
  });

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // typing indicator
  const [isTyping, setIsTyping] = useState(false);

  const endRef = useRef(null);

  function scrollToBottom(smooth = true) {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isTyping]);

  // ✅ SSE: escucha mensajes DM globales emitidos por SSEListener
  useEffect(() => {
    function onDmMessage(ev) {
      const payload = ev?.detail;
      if (!payload) return;
      if (payload.thread_id !== threadId) return;

      setMessages((p) => [
        ...p,
        {
          id: payload.id || `sse_${Date.now()}`,
          from: payload.from === me?.id ? "me" : "them",
          text: payload.text || "",
          created_at: payload.created_at || new Date().toISOString(),
        },
      ]);
    }

    function onTyping(ev) {
      const payload = ev?.detail;
      if (!payload) return;
      if (payload.thread_id !== threadId) return;
      // si viene de la otra parte
      if (payload.from === me?.id) return;

      setIsTyping(true);
      window.clearTimeout(onTyping._t);
      onTyping._t = window.setTimeout(() => setIsTyping(false), 1300);
    }

    function onRead(ev) {
      const payload = ev?.detail;
      if (!payload) return;
      if (payload.thread_id !== threadId) return;
      // marca como read los mensajes "me"
      setMessages((p) =>
        p.map((m) => (m.from === "me" ? { ...m, status: "read" } : m))
      );
    }

    window.addEventListener("dm:message", onDmMessage);
    window.addEventListener("dm:typing", onTyping);
    window.addEventListener("dm:read", onRead);

    return () => {
      window.removeEventListener("dm:message", onDmMessage);
      window.removeEventListener("dm:typing", onTyping);
      window.removeEventListener("dm:read", onRead);
    };
  }, [threadId, me?.id]);

  async function send() {
    const v = text.trim();
    if (!v || sending) return;

    setSending(true);
    try {
      const tempId = `m_${Date.now()}`;
      const nowIso = new Date().toISOString();

      // 1) Optimista: aparece con "sent"
      setMessages((p) => [
        ...p,
        { id: tempId, from: "me", text: v, created_at: nowIso, status: "sent" },
      ]);
      setText("");

      // 2) Demo entrega
      setTimeout(() => {
        setMessages((p) => p.map((m) => (m.id === tempId ? { ...m, status: "delivered" } : m)));
      }, 450);

      // 3) Demo leído + typing del otro
      setTimeout(() => setIsTyping(true), 600);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((p) => p.map((m) => (m.id === tempId ? { ...m, status: "read" } : m)));
        setMessages((p) => [
          ...p,
          { id: `m_${Date.now() + 1}`, from: "them", text: "Perfecto 😄 ¡te apunto!", created_at: new Date().toISOString() },
        ]);
      }, 1200);

      // 🔌 luego aquí harás POST /dm/threads/:id/messages
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ✅ Swipe gestures:
  // - swipe desde el borde izquierdo hacia derecha => volver
  // - swipe horizontal en el chat => prev/next si existen
  const touch = useRef({ x0: 0, y0: 0, t0: 0, edge: false });

  function onTouchStart(e) {
    const t = e.touches?.[0];
    if (!t) return;
    touch.current.x0 = t.clientX;
    touch.current.y0 = t.clientY;
    touch.current.t0 = Date.now();
    touch.current.edge = t.clientX <= 24; // borde izquierdo
  }

  function onTouchEnd(e) {
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touch.current.x0;
    const dy = t.clientY - touch.current.y0;
    const dt = Date.now() - touch.current.t0;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // gesto horizontal claro y rápido
    if (dt > 650) return;
    if (absX < 60) return;
    if (absY > 55) return;

    // swipe back desde borde
    if (touch.current.edge && dx > 0) {
      nav(-1);
      return;
    }

    // swipe entre chats
    if (dx < 0 && nextId) {
      nav(`/mensajes/${nextId}`, { replace: true, state: { threadIds } });
      return;
    }
    if (dx > 0 && prevId) {
      nav(`/mensajes/${prevId}`, { replace: true, state: { threadIds } });
      return;
    }
  }

  return (
    <div
      className="page chat-page"
      style={{ paddingBottom: 96 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="chat-hero quartz-surface">
        <div className="chat-heroTop">
          <button type="button" className="chat-back" onClick={() => nav(-1)} aria-label="Volver" title="Volver">
            ‹
          </button>

          <div className="chat-titleWrap">
            <div className="chat-title">{thread.name}</div>
            <div className="chat-sub">
              {isTyping ? "escribiendo…" : "Activo"}
            </div>
          </div>

          <div className="chat-ava" aria-label="Avatar chat">
            <span>{initials(thread.name)}</span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="chat-list">
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} className={`chat-row ${mine ? "mine" : "theirs"}`}>
              {!mine && (
                <div className="chat-miniAva" aria-hidden="true">
                  {initials(thread.name)}
                </div>
              )}

              <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                <div className="chat-text">{m.text}</div>

                <div className="chat-metaRow">
                  <div className="chat-time">{timeTiny(m.created_at)}</div>
                  {mine && m.status ? (
                    <div className={`chat-status ${m.status === "read" ? "read" : ""}`}>
                      {statusGlyph(m.status)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing bubble */}
        {isTyping && (
          <div className="chat-row theirs">
            <div className="chat-miniAva" aria-hidden="true">
              {initials(thread.name)}
            </div>
            <div className="chat-bubble theirs chat-typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer fijo */}
      <div className="chat-composer">
        <div className="chat-composerInner">
          <textarea
            className="chat-input"
            rows={1}
            placeholder="Mensaje…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="chat-send"
            onClick={send}
            disabled={sending || !text.trim()}
            aria-label="Enviar"
            title="Enviar"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
