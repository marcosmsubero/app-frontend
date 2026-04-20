import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiDMMessages, apiDMSend, apiDMThreads } from "../services/api";
import { uploadAudioBlobToSupabase } from "../services/storage";
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

/** Return the profile identifier of the other participant in a 1:1
 * thread. Prefers the handle (so URLs read nicely), falls back to the
 * numeric user id. Returns null if we can't infer one (group threads). */
function getThreadOtherProfileTarget(thread) {
  if (!thread) return null;
  const handle =
    thread.other_handle ||
    thread.peer_handle ||
    thread.participant_handle ||
    thread.user_handle;
  if (handle) return { kind: "handle", value: String(handle) };
  const id =
    thread.other_user_id ??
    thread.peer_user_id ??
    thread.participant_user_id ??
    thread.user_id;
  if (id != null) return { kind: "id", value: String(id) };
  return null;
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

  const [recording, setRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartRef = useRef(0);
  const recordingIntervalRef = useRef(0);
  const recordingCancelledRef = useRef(false);

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
  const otherProfileTarget = useMemo(
    () => getThreadOtherProfileTarget(thread),
    [thread],
  );

  function goToOtherProfile() {
    if (!otherProfileTarget) return;
    if (otherProfileTarget.kind === "handle") {
      nav(`/perfil/handle/${otherProfileTarget.value}`);
    } else {
      nav(`/perfil/${otherProfileTarget.value}`);
    }
  }
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

  async function sendAudio(audioUrl, durationMs) {
    if (!audioUrl || !token || !threadId) return;

    const tempId = `tmp_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const placeholder = `🎤 Audio (${Math.max(1, Math.round(durationMs / 1000))}s)`;

    const optimistic = {
      id: tempId,
      from: "me",
      sender_id: me?.id ?? null,
      text: placeholder,
      audio_url: audioUrl,
      created_at: nowIso,
      status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    stickToBottom(false);

    try {
      await apiDMSend(threadId, placeholder, token, audioUrl);
      haptic.tick();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "delivered" } : m)),
      );
      await loadMessages({ silent: true });
      stickToBottom(false);
    } catch (e) {
      haptic.warn();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast?.error?.(e?.message || "No se pudo enviar el audio");
    }
  }

  async function startRecording() {
    if (recording || sending || !token) return;

    // getUserMedia needs a secure context (HTTPS or localhost). Over a
    // plain-HTTP LAN URL (common in dev on phone) the API is absent and
    // we tell the user rather than silently doing nothing.
    const isSecure = window.isSecureContext === true ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      toast?.error?.(
        "La grabación necesita HTTPS. En móvil abre la app con una URL https://, no http://."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast?.error?.("Tu navegador no soporta grabación de audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recordingCancelledRef.current = false;
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationMs = Date.now() - recordingStartRef.current;
        if (recordingCancelledRef.current || durationMs < 400) {
          return; // too short or cancelled, ignore
        }
        const blob = new Blob(recordedChunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        try {
          const url = await uploadAudioBlobToSupabase(blob, me?.id);
          await sendAudio(url, durationMs);
        } catch (err) {
          toast?.error?.(err?.message || "No se pudo subir el audio");
        }
      };
      mediaRecorderRef.current = rec;
      recordingStartRef.current = Date.now();
      setRecordingElapsedMs(0);
      setRecording(true);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingElapsedMs(Date.now() - recordingStartRef.current);
      }, 200);
      rec.start();
      haptic.tick();
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo acceder al micrófono");
    }
  }

  function stopRecording(cancel = false) {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    recordingCancelledRef.current = !!cancel;
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = 0;
    }
    setRecording(false);
    setRecordingElapsedMs(0);
    try {
      if (rec.state !== "inactive") rec.stop();
    } catch {
      /* ignore */
    }
    mediaRecorderRef.current = null;
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

        <button
          type="button"
          className="chatHeader__identity"
          onClick={goToOtherProfile}
          disabled={!otherProfileTarget}
          aria-label={`Ver perfil de ${displayName}`}
        >
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
        </button>
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
                  }${m.audio_url ? " chatBubble--audio" : ""}`}
                  data-status={mine ? m.status || "" : undefined}
                >
                  {m.audio_url ? (
                    <audio
                      src={m.audio_url}
                      controls
                      preload="metadata"
                      className="chatBubble__audio"
                    />
                  ) : (
                    <span className="chatBubble__text">{m.text}</span>
                  )}
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
        {/* Mic button — always visible. Press-and-hold to record. */}
        <button
          type="button"
          className={`chatComposer__mic${recording ? " is-recording" : ""}`}
          onPointerDown={(e) => {
            e.preventDefault();
            startRecording();
          }}
          onPointerUp={() => {
            if (recording) stopRecording(false);
          }}
          onPointerLeave={() => {
            if (recording) stopRecording(false);
          }}
          onPointerCancel={() => {
            if (recording) stopRecording(true);
          }}
          disabled={sending || !!error}
          aria-label={recording ? "Soltar para enviar audio" : "Mantener pulsado para grabar audio"}
          title="Mantén pulsado para grabar"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21a1 1 0 1 0 2 0v-3.07A7 7 0 0 0 19 11z" />
          </svg>
        </button>

        {/* Send button — always visible, disabled when input is empty. */}
        <button
          type="button"
          className={`chatComposer__send${text.trim() ? " is-active" : ""}`}
          onClick={send}
          disabled={sending || !text.trim() || !!error}
          aria-label="Enviar"
          title="Enviar"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Recording indicator overlay — shows elapsed time while mic
          button is held. Released → recording stops + uploads. */}
      {recording ? (
        <div className="chatComposer__recordingBar" aria-live="polite">
          <span className="chatComposer__recordingDot" aria-hidden="true" />
          <span className="chatComposer__recordingLabel">
            Grabando {Math.floor(recordingElapsedMs / 1000)}s — suelta para enviar
          </span>
        </div>
      ) : null}
    </section>
  );
}
