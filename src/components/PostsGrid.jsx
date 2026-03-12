import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { API_BASE } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

/* =========================
   Helpers
========================= */
function safeUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizePost(p) {
  return {
    id: p.id ?? `${p.image_url}-${p.created_at ?? ""}`,
    image_url: safeUrl(p.image_url || p.url || p.image || p.src),
    caption: p.caption ?? "",
    created_at: p.created_at,
    likes_count: Number(p.likes_count ?? p.likes ?? 0),
    comments_count: Number(p.comments_count ?? p.comments ?? 0),
  };
}

/* =========================
   Crop helpers
========================= */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc, cropPixels, quality = 0.92) {
  const img = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo inicializar canvas");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("No se pudo recortar la imagen"));
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

/* =========================
   Elegant SVG Icons
========================= */
function IconHeart({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 8.6c0 5.2-8.8 11.2-8.8 11.2S3.2 13.8 3.2 8.6C3.2 6 5.3 4 7.8 4c1.5 0 2.9.7 3.7 1.9C12.3 4.7 13.7 4 15.2 4c2.5 0 4.6 2 5.6 4.6z" />
    </svg>
  );
}
function IconComment({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}
function IconChevronLeft({ size = 20 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight({ size = 20 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function IconPlus({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
function IconRefresh({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
function IconClose({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
function IconTrash({ size = 18 }) {
  return (
    <svg
      className="ui-ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/* =========================
   Component
========================= */
export default function PostsGrid() {
  const { token } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();

  const fileRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [caption, setCaption] = useState("");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [step, setStep] = useState("crop");

  const LIMIT = 18;
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const nextOffsetRef = useRef(0);

  const [activeId, setActiveId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const swipeRef = useRef({
    active: false,
    mode: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startT: 0,
    pointerId: null,
  });

  const [drag, setDrag] = useState({ x: 0, y: 0, mode: null, moving: false });

  const resetDrag = useCallback(() => {
    setDrag({ x: 0, y: 0, mode: null, moving: false });
    swipeRef.current = {
      active: false,
      mode: null,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      startT: 0,
      pointerId: null,
    };
  }, []);

  const normalized = useMemo(() => {
    return (Array.isArray(items) ? items : []).map(normalizePost).filter((p) => !!p.image_url);
  }, [items]);

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return normalized.findIndex((p) => String(p.id) === String(activeId));
  }, [normalized, activeId]);

  const activePost = activeIndex >= 0 ? normalized[activeIndex] : null;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < normalized.length - 1;

  function setPostParam(id) {
    const params = new URLSearchParams(location.search);
    if (id) params.set("post", String(id));
    else params.delete("post");
    const qs = params.toString();
    nav({ pathname: location.pathname, search: qs ? `?${qs}` : "" }, { replace: false });
  }

  function replacePostParam(idOrNull) {
    const params = new URLSearchParams(location.search);
    if (idOrNull) params.set("post", String(idOrNull));
    else params.delete("post");
    const qs = params.toString();
    nav({ pathname: location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
  }

  const openPost = (p) => {
    if (!p?.id) return;
    setActiveId(p.id);
    setPostParam(p.id);
  };

  const closePost = useCallback(() => {
    replacePostParam(null);
    setActiveId(null);
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    const id = normalized[activeIndex - 1]?.id;
    if (!id) return;
    setActiveId(id);
    replacePostParam(id);
  }, [canPrev, normalized, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (!canNext) return;
    const id = normalized[activeIndex + 1]?.id;
    if (!id) return;
    setActiveId(id);
    replacePostParam(id);
  }, [canNext, normalized, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("post");
    if (!q) {
      setActiveId(null);
      return;
    }
    setActiveId(q);
  }, [location.search]);

  useEffect(() => {
    resetDrag();
  }, [activeId, resetDrag]);

  const loadPage = useCallback(
    async (offset = 0, { replace = false } = {}) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      setErr("");
      try {
        const qs = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(offset),
        }).toString();

        const res = await fetch(`${API_BASE}/me/posts?${qs}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.status === 404) {
          setHasMore(false);
          if (replace) setItems([]);
          return;
        }

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Error ${res.status}`);
        }

        const data = await res.json();
        const pageItems = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const pageHasMore =
          typeof data?.has_more === "boolean" ? data.has_more : pageItems.length >= LIMIT;

        setHasMore(pageHasMore);
        nextOffsetRef.current = offset + pageItems.length;

        setItems((prev) => {
          if (replace) return pageItems;

          const seen = new Set((Array.isArray(prev) ? prev : []).map((x) => String(x.id ?? x.image_url)));
          const merged = [...(Array.isArray(prev) ? prev : [])];
          for (const it of pageItems) {
            const key = String(it.id ?? it.image_url);
            if (!seen.has(key)) merged.push(it);
          }
          return merged;
        });
      } catch (e) {
        setErr(e?.message || "No se pudo cargar publicaciones");
      } finally {
        loadingRef.current = false;
      }
    },
    [token]
  );

  useEffect(() => {
    nextOffsetRef.current = 0;
    setHasMore(true);
    setItems([]);
    loadPage(0, { replace: true });
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!hasMore) return;
        if (loadingRef.current) return;
        loadPage(nextOffsetRef.current);
      },
      { root: null, rootMargin: "900px 0px", threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadPage]);

  useEffect(() => {
    function onKey(e) {
      if (!activeId && !previewUrl) return;

      if (e.key === "Escape") {
        if (activeId) closePost();
        if (previewUrl) closeUploadModal();
      }
      if (activeId) {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, previewUrl, goPrev, goNext, closePost]);

  useEffect(() => {
    if (!previewUrl) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewUrl]);

  function openPicker() {
    fileRef.current?.click();
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast?.error?.("Selecciona una imagen");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast?.error?.("Máximo 8MB");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setCaption("");
    setCroppedBlob(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setStep("crop");

    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  function closeUploadModal() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setSelectedFile(null);
    setCaption("");
    setCroppedBlob(null);
    setStep("crop");
  }

  async function confirmCrop() {
    if (!previewUrl || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(previewUrl, croppedAreaPixels);
      setCroppedBlob(blob);
      setStep("caption");
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo recortar");
    }
  }

  async function upload() {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const form = new FormData();

      if (croppedBlob) {
        form.append("file", croppedBlob, "post.jpg");
      } else {
        form.append("file", selectedFile);
      }

      if (caption.trim()) form.append("caption", caption.trim());

      const res = await fetch(`${API_BASE}/me/posts`, {
        method: "POST",
        body: form,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 404) {
        toast?.info?.("Subida aún no disponible (falta endpoint /me/posts)");
        closeUploadModal();
        return;
      }

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo subir");
      }

      const created = await res.json();

      toast?.success?.("Publicación subida");
      closeUploadModal();

      if (created) {
        setItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        openPost({ id: created.id });
      } else {
        nextOffsetRef.current = 0;
        setHasMore(true);
        setItems([]);
        loadPage(0, { replace: true });
      }
    } catch (e) {
      toast?.error?.(e?.message || "Error subiendo");
    } finally {
      setUploading(false);
    }
  }

  const SWIPE_LOCK = 10;
  const SWIPE_X_GO = 70;
  const SWIPE_Y_CLOSE = 90;
  const SWIPE_VEL_GO = 0.55;

  function onSwipePointerDown(e) {
    if (e.pointerType !== "touch") return;
    if (!activePost) return;

    swipeRef.current.active = true;
    swipeRef.current.mode = null;
    swipeRef.current.startX = e.clientX;
    swipeRef.current.startY = e.clientY;
    swipeRef.current.lastX = e.clientX;
    swipeRef.current.lastY = e.clientY;
    swipeRef.current.startT = performance.now();
    swipeRef.current.pointerId = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDrag((d) => ({ ...d, moving: true }));
  }

  function onSwipePointerMove(e) {
    if (!swipeRef.current.active) return;
    if (e.pointerType !== "touch") return;

    const dx = e.clientX - swipeRef.current.startX;
    const dy = e.clientY - swipeRef.current.startY;

    swipeRef.current.lastX = e.clientX;
    swipeRef.current.lastY = e.clientY;

    if (!swipeRef.current.mode) {
      if (Math.abs(dx) < SWIPE_LOCK && Math.abs(dy) < SWIPE_LOCK) return;
      swipeRef.current.mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }

    e.preventDefault();

    if (swipeRef.current.mode === "h") {
      setDrag({ x: dx, y: 0, mode: "h", moving: true });
    } else {
      setDrag({ x: 0, y: Math.max(0, dy), mode: "v", moving: true });
    }
  }

  function onSwipePointerUp(e) {
    if (!swipeRef.current.active) return;
    if (e.pointerType !== "touch") return;

    const now = performance.now();
    const dt = Math.max(1, now - swipeRef.current.startT);

    const dx = swipeRef.current.lastX - swipeRef.current.startX;
    const dy = swipeRef.current.lastY - swipeRef.current.startY;

    const vx = Math.abs(dx) / dt;
    const vy = Math.abs(dy) / dt;

    const mode = swipeRef.current.mode;

    try {
      e.currentTarget.releasePointerCapture(swipeRef.current.pointerId);
    } catch {}

    if (mode === "h") {
      const go = Math.abs(dx) > SWIPE_X_GO || vx > SWIPE_VEL_GO;
      if (go) {
        setDrag({ x: dx > 0 ? 140 : -140, y: 0, mode: "h", moving: false });
        setTimeout(() => {
          if (dx > 0) goPrev();
          else goNext();
          resetDrag();
        }, 110);
        return;
      }
    }

    if (mode === "v") {
      const go = dy > SWIPE_Y_CLOSE || vy > SWIPE_VEL_GO;
      if (go) {
        setDrag({ x: 0, y: Math.max(120, dy), mode: "v", moving: false });
        setTimeout(() => {
          closePost();
          resetDrag();
        }, 120);
        return;
      }
    }

    setDrag({ x: 0, y: 0, mode: mode || null, moving: false });
    setTimeout(() => resetDrag(), 180);
  }

  async function deleteActivePost() {
    if (!activePost?.id) return;
    if (deleting) return;

    const ok = window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/me/posts/${activePost.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 404) {
        toast?.info?.("Ya no existe.");
      } else if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo eliminar");
      }

      setItems((prev) =>
        Array.isArray(prev) ? prev.filter((x) => String(x.id) !== String(activePost.id)) : []
      );
      toast?.success?.("Publicación eliminada");
      closePost();
    } catch (e) {
      toast?.error?.(e?.message || "Error eliminando");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="igpg">
      <div className="quartz-shell quartz-card">
        <div className="igpg-head">
          <div className="igpg-actions">
            <button
              type="button"
              className="pc-icon pc-gold"
              onClick={() => {
                nextOffsetRef.current = 0;
                setHasMore(true);
                setItems([]);
                loadPage(0, { replace: true });
              }}
              aria-label="Actualizar"
              title="Actualizar"
            >
              <IconRefresh />
            </button>

            <button
              type="button"
              className="pc-icon pc-gold"
              onClick={openPicker}
              aria-label="Nueva publicación"
              title="Nueva publicación"
            >
              <IconPlus />
            </button>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
          </div>
        </div>

        {err ? (
          <div className="auth-msg error" style={{ marginTop: 10 }}>
            {err}
          </div>
        ) : null}

        {normalized.length === 0 ? (
          <div className="ui-card igpg-empty igpg-empty--panel">
            Aún no tienes publicaciones. Pulsa el botón <b>+</b> para subir tu primera foto.
          </div>
        ) : (
          <div className="igpg-grid">
            {normalized.map((p) => (
              <button key={p.id} type="button" className="igpg-tile" onClick={() => openPost(p)} title="Ver">
                <img src={p.image_url} alt="post" loading="lazy" />

                {p.caption ? (
                  <div className="igpg-tileCaption" aria-hidden="true">
                    {p.caption}
                  </div>
                ) : null}

                <div className="igpg-overlay" aria-hidden="true">
                  <div className="igpg-oc">
                    <span className="igpg-ocItem">
                      <IconHeart size={16} />
                      <span className="igpg-ocN">{p.likes_count || 0}</span>
                    </span>
                    <span className="igpg-ocSep">·</span>
                    <span className="igpg-ocItem">
                      <IconComment size={16} />
                      <span className="igpg-ocN">{p.comments_count || 0}</span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
            <div ref={sentinelRef} className="igpg-sentinel" />
          </div>
        )}
      </div>

      {activePost ? (
        <div className="ui-modal" role="dialog" aria-modal="true" onMouseDown={closePost}>
          <div className="ui-glass ui-modalPanel igpg-modalPanel" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ui-iconBtn ui-iconBtn--gold igpg-closeBtn"
              onClick={closePost}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <IconClose />
            </button>

            <button
              type="button"
              className={`ui-iconBtn ui-iconBtn--gold ui-nav ui-nav--left ${canPrev ? "" : "is-disabled"}`}
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Anterior"
              title="Anterior"
            >
              <IconChevronLeft />
            </button>

            <button
              type="button"
              className={`ui-iconBtn ui-iconBtn--gold ui-nav ui-nav--right ${canNext ? "" : "is-disabled"}`}
              onClick={goNext}
              disabled={!canNext}
              aria-label="Siguiente"
              title="Siguiente"
            >
              <IconChevronRight />
            </button>

            <div className="igpg-modal__grid">
              <div
                className="igpg-modal__media igpg-swipeArea"
                onPointerDown={onSwipePointerDown}
                onPointerMove={onSwipePointerMove}
                onPointerUp={onSwipePointerUp}
                onPointerCancel={onSwipePointerUp}
                style={{
                  transform:
                    drag.mode === "h"
                      ? `translate3d(${drag.x}px, 0, 0)`
                      : `translate3d(0, ${drag.y}px, 0)`,
                  transition: drag.moving ? "none" : "transform 180ms ease",
                }}
              >
                <img src={activePost.image_url} alt="post" draggable={false} />
              </div>

              <div className="igpg-modal__side">
                <div className="igpg-side__top">
                  <div className="igpg-side__title">Publicación</div>
                  <div className="igpg-side__date">{fmtDate(activePost.created_at)}</div>
                </div>

                <div className="igpg-side__body">
                  <div className="igpg-side__stats">
                    <span className="igpg-side__stat">
                      <IconHeart size={16} /> <b>{activePost.likes_count || 0}</b>
                    </span>
                    <span className="igpg-side__dot">·</span>
                    <span className="igpg-side__stat">
                      <IconComment size={16} /> <b>{activePost.comments_count || 0}</b>
                    </span>
                  </div>

                  {activePost.caption ? <div className="igpg-captionView">{activePost.caption}</div> : null}
                </div>

                <div className="igpg-side__bottom">
                  <button
                    type="button"
                    className="ui-iconBtn ui-iconBtn--gold ui-iconBtn--lg"
                    onClick={() => toast?.info?.("Próximamente")}
                    aria-label="Me gusta"
                    title="Me gusta"
                  >
                    <IconHeart />
                  </button>

                  <button
                    type="button"
                    className="ui-iconBtn ui-iconBtn--gold ui-iconBtn--lg"
                    onClick={() => toast?.info?.("Próximamente")}
                    aria-label="Comentar"
                    title="Comentar"
                  >
                    <IconComment />
                  </button>

                  <button
                    type="button"
                    className="ui-iconBtn ui-iconBtn--gold ui-iconBtn--lg"
                    onClick={deleteActivePost}
                    aria-label="Eliminar"
                    title="Eliminar"
                    disabled={deleting}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>

            <div className="ui-indexPill">
              {activeIndex + 1}/{normalized.length}
            </div>
          </div>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="ui-modal" role="dialog" aria-modal="true" onMouseDown={closeUploadModal}>
          <div
            className="ui-glass ui-modalPanel ui-modalPanel--small igpg-uploadModal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ui-modalHead">
              <div className="ui-modalTitle">{step === "crop" ? "Recortar foto" : "Nueva publicación"}</div>
              <button
                type="button"
                className="ui-iconBtn ui-iconBtn--gold ui-iconBtn--sm"
                onClick={closeUploadModal}
                aria-label="Cerrar"
                title="Cerrar"
                disabled={uploading}
              >
                <IconClose />
              </button>
            </div>

            {step === "crop" ? (
              <>
                <div className="igpg-cropWrap">
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  />
                </div>

                <div className="igpg-cropControls">
                  <label className="igpg-cropLabel">
                    Zoom
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </label>
                </div>

                <div className="ui-modalActions">
                  <button type="button" onClick={closeUploadModal} disabled={uploading}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-primary" onClick={confirmCrop} disabled={uploading}>
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="igpg-uploadPreview">
                  <img src={previewUrl} alt="preview" />
                </div>

                <label className="igpg-captionLabel">
                  Estado
                  <textarea
                    className="igpg-caption"
                    rows={3}
                    placeholder="Escribe algo…"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={uploading}
                  />
                </label>

                <div className="ui-modalActions">
                  <button type="button" onClick={() => setStep("crop")} disabled={uploading}>
                    ← Editar
                  </button>
                  <button type="button" className="btn-primary" onClick={upload} disabled={uploading}>
                    {uploading ? "Subiendo…" : "Publicar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}