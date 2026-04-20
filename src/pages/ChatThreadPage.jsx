import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMMessages, apiDMSend, apiDMThreads } from "../services/api";
import { useRealtimeChat } from "../hooks/useRealtimeChat";
import { useI18n } from "../i18n/index.jsx";
import { AnalyticsEvents } from "../services/analytics";
import haptic from "../utils/haptic";
import "../styles/chat.css";

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

function dayLabel(iso) {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";

    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
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
    text: String(msg?.text ?? msg?.body ?? msg?.content ?? ""),
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

function groupByDate(messages) {
  const groups = [];
  let currentDate = null;

  for (const m of messages) {
    const d = new Date(m.created_at).toDateString();
    if (d !== currentDate) {
      currentDate = d;
      groups.push({ type: "date", label: dayLabel(m.created_at), key: `date-${d}` });
    }
    groups.push({ type: "message", data: m, key: m.id });
  }

  return groups;
}

export default function ChatThreadPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { threadId } = useParams();
  const { token, me } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

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
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.visualViewport?.height || window.innerHeight || null;
  });

  const endRef = useRef(null);
  const composerRef = useRef(null);
  const listRef = useRef(null);
  const scrollRafRef = useRef(0);
  const resizeRafRef = useRef(0);
  const focusTimersRef = useRef([]);
  const touch = useRef({ x0: 0, y0: 0, t0: 0, edge: false });

  const isNearBottomRef = useRef(true);
  const shouldStickToBottomRef = useRef(true);

  const displayName = useMemo(() => getThreadDisplayName(thread), [thread]);
  const avatarUrl = useMemo(() => getThreadAvatar(thread), [thread]);
  const grouped = useMemo(() => groupByDate(messages), [messages]);

  function clearFocusTimers() {
    focusTimersRef.current.forEach((id) => window.clearTimeout(id));
    focusTimersRef.current = [];
  }

  function isNearBottom(el) {
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= 72;
  }

  function updateStickiness() {
    const el = listRef.current;
    const near = isNearBottom(el);
    isNearBottomRef.current = near;
    shouldStickToBottomRef.current = near;
  }

  function scrollToBottom(smooth = false) {
    const el = listRef.current;
    if (!el) return;

    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      const target = el.scrollHeight;
      el.scrollTo({
        top: target,
        behavior: smooth ? "smooth" : "auto",
      });
      isNearBottomRef.current = true;
    });
  }

  function stickToBottom(smooth = false) {
    shouldStickToBottomRef.current = true;
    scrollToBottom(smooth);
  }

  function syncTextareaHeight(el) {
    if (!el) return;
    if (resizeRafRef.current) {
      cancelAnimationFrame(resizeRafRef.current);
    }

    resizeRafRef.current = requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;

      if (shouldStickToBottomRef.current) {
        scrollToBottom(false);
      }
    });
  }

  function resetTextareaHeight() {
    if (!composerRef.current) return;
    composerRef.current.style.height = "auto";
  }

  function scheduleKeyboardSafeScroll() {
    // Only auto-scroll when the user was already near the bottom.
    // If they'd scrolled up to read older messages, respect that —
    // WhatsApp keeps the user's scroll position when the keyboard
    // opens so they can keep reading while typing. The user can tap
    // the jump-to-bottom affordance or send a message to snap back.
    if (!isNearBottomRef.current) {
      return;
    }

    clearFocusTimers();
    scrollToBottom(false);

    // Extra delayed scrolls catch the keyboard animation frames so the
    // last message settles above the keyboard on slow-animating
    // Android keyboards (~250-300ms).
    focusTimersRef.current.push(
      window.setTimeout(() => scrollToBottom(false), 80),
      window.setTimeout(() => scrollToBottom(false), 180),
      window.setTimeout(() => scrollToBottom(false), 320),
    );
  }

  useRealtimeChat(threadId, (newMsg) => {
    const normalized = {
      id: String(newMsg?.id ?? `msg_${Date.now()}`),
      from: String(newMsg?.sender_id) === String(me?.id) ? "me" : "them",
      sender_id: newMsg?.sender_id ?? null,
      text: String(newMsg?.body || newMsg?.content || newMsg?.text || ""),
      created_at: newMsg?.created_at || new Date().toISOString(),
      status: "delivered",
    };

    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(normalized.id))) return prev;
      return [...prev, normalized];
    });

    if (
      shouldStickToBottomRef.current ||
      String(newMsg?.sender_id) === String(me?.id)
    ) {
      stickToBottom(true);
    }
  });

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
    let cancelled = false;

    setMessages([]);
    setError("");
    setText("");
    shouldStickToBottomRef.current = true;
    isNearBottomRef.current = true;

    (async () => {
      if (!cancelled) await loadThreadMeta();
      if (!cancelled) await loadMessages();
    })();

    return () => {
      cancelled = true;
      clearFocusTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, token, me?.id]);

  useLayoutEffect(() => {
    stickToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useLayoutEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, viewportHeight]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    function handleViewportChange() {
      const nextHeight = vv.height || window.innerHeight;
      setViewportHeight(nextHeight);

      if (document.activeElement === composerRef.current) {
        scheduleKeyboardSafeScroll();
      } else if (shouldStickToBottomRef.current) {
        scrollToBottom(false);
      }
    }

    handleViewportChange();

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (composerRef.current) {
      syncTextareaHeight(composerRef.current);
    }

    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      clearFocusTimers();
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "manipulation";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, []);

  function handleTextChange(e) {
    const value = e.target.value;
    setText(value);
    syncTextareaHeight(e.target);
  }

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
      status: "sending",
    };

    setSending(true);
    setText("");
    resetTextareaHeight();

    setMessages((prev) => [...prev, optimistic]);
    stickToBottom(false);

    try {
      await apiDMSend(threadId, value, token);
      haptic.tick();
      AnalyticsEvents.messageSent?.(threadId);

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "delivered" } : m))
      );

      await loadMessages({ silent: true });
      stickToBottom(false);
    } catch (e) {
      haptic.warn();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText((prev) => (prev ? prev : value));
      toast?.error?.(e?.message || "No se pudo enviar el mensaje");

      window.setTimeout(() => {
        if (composerRef.current) {
          composerRef.current.value = value;
          syncTextareaHeight(composerRef.current);
        }
      }, 0);
    } finally {
      setSending(false);
      window.setTimeout(() => {
        composerRef.current?.focus();
        scheduleKeyboardSafeScroll();
      }, 0);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

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
      nav(`/mensajes/${nextId}`, { replace: true, state: { threadIds } });
      return;
    }

    if (dx > 0 && prevId) {
      nav(`/mensajes/${prevId}`, { replace: true, state: { threadIds } });
    }
  }

  return (
    <section
      className="chatPage"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      /* Don't apply inline visualViewport height. Modern iOS + the
         `interactive-widget=resizes-content` meta in index.html shrink
         the layout viewport correctly when the keyboard opens, so the
         CSS `height: 100dvh` already does the right thing. Forcing
         `visualViewport.height` on a position:fixed element was making
         the chat disappear on some devices because the fixed element
         stays anchored to the old layout viewport while iOS scrolls
         the window — the `scheduleKeyboardSafeScroll` effect below
         keeps the last message visible inside the shrunk chat. */
    >
      <div className="chatHeader">
        <button
          type="button"
          className="chatHeader__back"
          onClick={() => nav(-1)}
          aria-label="Volver"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="chatHeader__avatar" />
        ) : (
          <div className="chatHeader__avatar chatHeader__avatar--fallback">
            {initials(displayName)}
          </div>
        )}

        <div className="chatHeader__info">
          <h2 className="chatHeader__name">
            {loadingThread ? t("chat.loading") : displayName}
          </h2>
        </div>
      </div>

      <div
        className="chatMessages"
        ref={listRef}
        onScroll={updateStickiness}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {loadingMessages ? (
          <div className="chatMessages__state">
            <p>Cargando conversación…</p>
          </div>
        ) : error ? (
          <div className="chatMessages__state">
            <p>No se pudo abrir el chat</p>
            <p className="chatMessages__stateHint">{error}</p>
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() => loadMessages()}
              style={{ marginTop: 8 }}
            >
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="chatMessages__state">
            <p>Aún no hay mensajes</p>
            <p className="chatMessages__stateHint">Envía el primero para iniciar la conversación.</p>
          </div>
        ) : (
          grouped.map((item) => {
            if (item.type === "date") {
              return (
                <div key={item.key} className="chatDateSeparator">
                  <span>{item.label}</span>
                </div>
              );
            }

            const m = item.data;
            const mine = m.from === "me";

            return (
              <div
                key={item.key}
                className={`chatBubbleRow ${mine ? "chatBubbleRow--mine" : "chatBubbleRow--theirs"}`}
              >
                <div
                  className={`chatBubble${
                    mine && m.status ? ` chatBubble--${m.status}` : ""
                  }`}
                  data-status={mine ? m.status || "" : undefined}
                >
                  <span className="chatBubble__text">{m.text}</span>
                  <span className="chatBubble__meta">
                    {timeTiny(m.created_at)}
                    {mine && m.status ? ` ${statusGlyph(m.status)}` : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div ref={endRef} className="chatMessages__end" />
      </div>

      <div
        className="chatComposer"
        style={{
          flexShrink: 0,
        }}
      >
        <textarea
          ref={composerRef}
          rows={1}
          placeholder=""
          aria-label={t("chat.typeMessage")}
          value={text}
          onChange={handleTextChange}
          onKeyDown={onKeyDown}
          onFocus={scheduleKeyboardSafeScroll}
          disabled={!!error || sending}
          className="chatComposer__input"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
          inputMode="text"
          enterKeyHint="send"
        />
        <button
          type="button"
          className={`chatComposer__send${text.trim() ? " is-active" : ""}`}
          onClick={send}
          disabled={sending || !text.trim() || !!error}
          aria-label={text.trim() ? "Enviar" : "Micrófono"}
          title={text.trim() ? "Enviar" : "Micrófono"}
        >
          {text.trim() ? (
            // Send arrow (shown when input has text)
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          ) : (
            // Mic icon (WhatsApp-style placeholder; send morphs in when typing)
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21a1 1 0 1 0 2 0v-3.07A7 7 0 0 0 19 11z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
