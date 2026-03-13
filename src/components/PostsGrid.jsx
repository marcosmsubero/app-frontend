import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { API_BASE } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { Button, EmptyState } from "./ui";

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
    cropPixels.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("No se pudo recortar la imagen"));
        resolve(blob);
      },
      "image/jpeg",
      quality,
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
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" />
      <path d="M18 6l-1 13a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 6" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </svg>
  );
}

/* =========================
   Simple Dialog Shell
========================= */
function Dialog({
  open,
  title,
  children,
  onClose,
  width = "min(960px, calc(100vw - 24px))",
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modalBackdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ui-modal" style={{ width }}>
        {children}
      </div>
    </div>
  );
}

/* =========================
   Main component
========================= */
export default function PostsGrid() {
  const { accessToken } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [openItem, setOpenItem] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  const [rawFile, setRawFile] = useState(null);
  const [localSrc, setLocalSrc] = useState("");
  const [caption, setCaption] = useState("");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [hasMore, setHasMore] = useState(true);
  const limit = 12;
  const nextOffsetRef = useRef(0);
  const sentinelRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const normalized = useMemo(() => items.map(normalizePost), [items]);

  const loadPage = useCallback(
    async (offset = 0, { replace = false } = {}) => {
      if (!accessToken) return;
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/posts?offset=${offset}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("No se pudieron cargar tus publicaciones");
        const data = await res.json();
        const page = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];

        setItems((prev) => (replace ? page : [...prev, ...page]));
        nextOffsetRef.current = offset + page.length;
        if (page.length < limit) setHasMore(false);
      } catch (e) {
        setErr(e.message || "Error cargando publicaciones");
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    nextOffsetRef.current = 0;
    setHasMore(true);
    setItems([]);
    loadPage(0, { replace: true });
  }, [loadPage]);

  useEffect(() => {
    const fromStatePostId = location.state?.openPostId;
    if (!fromStatePostId || normalized.length === 0) return;
    const p = normalized.find((x) => x.id === fromStatePostId);
    if (p) setOpenItem(p);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, normalized]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting && !loading && hasMore) {
          loadPage(nextOffsetRef.current);
        }
      },
      { rootMargin: "600px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadPage]);

  const openPost = useCallback((p) => setOpenItem(p), []);
  const closePost = useCallback(() => setOpenItem(null), []);

  const currentIndex = useMemo(() => {
    if (!openItem) return -1;
    return normalized.findIndex((x) => x.id === openItem.id);
  }, [normalized, openItem]);

  const prevPost = useCallback(() => {
    if (currentIndex <= 0) return;
    setOpenItem(normalized[currentIndex - 1]);
  }, [currentIndex, normalized]);

  const nextPost = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= normalized.length - 1) return;
    setOpenItem(normalized[currentIndex + 1]);
  }, [currentIndex, normalized]);

  const resetComposer = () => {
    setRawFile(null);
    setLocalSrc("");
    setCaption("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
  };

  const onPickFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      push({ type: "error", message: "Selecciona una imagen válida" });
      return;
    }
    if (localSrc) URL.revokeObjectURL(localSrc);
    const url = URL.createObjectURL(file);
    setRawFile(file);
    setLocalSrc(url);
    setNewOpen(true);
  };

  useEffect(() => {
    return () => {
      if (localSrc) URL.revokeObjectURL(localSrc);
    };
  }, [localSrc]);

  const onUpload = async () => {
    if (!rawFile || !localSrc || !croppedPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(localSrc, croppedPixels, 0.9);
      const form = new FormData();
      form.append("file", blob, "post.jpg");
      form.append("caption", caption || "");

      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo subir la publicación");
      }

      push({ type: "success", message: "Publicación subida" });
      setNewOpen(false);
      resetComposer();

      nextOffsetRef.current = 0;
      setHasMore(true);
      setItems([]);
      await loadPage(0, { replace: true });
    } catch (e) {
      push({ type: "error", message: e.message || "Error subiendo publicación" });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (postId) => {
    if (!postId) return;
    const ok = window.confirm("¿Eliminar esta publicación?");
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo eliminar");
      }

      push({ type: "success", message: "Publicación eliminada" });
      setItems((prev) => prev.filter((p) => normalizePost(p).id !== postId));
      if (openItem?.id === postId) setOpenItem(null);
    } catch (e) {
      push({ type: "error", message: e.message || "Error eliminando publicación" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="postsGrid">
      <div className="postsGrid__header">
        <div className="postsGrid__titleBlock">
          <p className="postsGrid__eyebrow">Perfil</p>
          <h2 className="postsGrid__title">Publicaciones</h2>
          <p className="postsGrid__description">
            Grid visual de tus fotos con una presentación más limpia y social.
          </p>
        </div>

        <div className="postsGrid__toolbar">
          <span className="postsGrid__metaPill">
            {normalized.length} {normalized.length === 1 ? "post" : "posts"}
          </span>

          <label className="ui-btn ui-btn--soft ui-btn--sm postsGrid__fileTrigger">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <IconPlus />
            Nueva publicación
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              nextOffsetRef.current = 0;
              setHasMore(true);
              setItems([]);
              loadPage(0, { replace: true });
            }}
          >
            <IconRefresh />
            Actualizar
          </Button>
        </div>
      </div>

      {err ? <div className="postsGrid__error">{err}</div> : null}

      {normalized.length === 0 ? (
        <div className="postsGrid__empty">
          <EmptyState
            title="Aún no hay publicaciones"
            subtitle="Sube tu primera foto para empezar a llenar tu perfil."
            action={
              <label className="ui-btn ui-btn--brand postsGrid__fileTrigger">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <IconPlus />
                Crear publicación
              </label>
            }
          />
        </div>
      ) : (
        <div className="postsGrid__gridWrap">
          <div className="postsGrid__grid">
            {normalized.map((p) => (
              <button
                key={p.id}
                className="postsGrid__tile"
                onClick={() => openPost(p)}
                title="Ver publicación"
              >
                <img className="postsGrid__image" src={p.image_url} alt={p.caption || "Publicación"} />
                <div className="postsGrid__overlay">
                  <div className="postsGrid__overlayStats">
                    <span className="postsGrid__overlayItem">
                      <IconHeart size={15} /> {p.likes_count || 0}
                    </span>
                    <span className="postsGrid__overlayItem">
                      <IconComment size={15} /> {p.comments_count || 0}
                    </span>
                  </div>
                  {p.caption ? <div className="postsGrid__captionPreview">{p.caption}</div> : null}
                </div>
              </button>
            ))}
            {hasMore ? <div ref={sentinelRef} className="postsGrid__sentinel" aria-hidden="true" /> : null}
          </div>
        </div>
      )}

      <Dialog
        open={!!openItem}
        title="Publicación"
        onClose={closePost}
        width="min(1100px, calc(100vw - 24px))"
      >
        {openItem ? (
          <div className="postsGridModal">
            <button className="ui-btn ui-btn--soft ui-btn--icon postsGridModal__close" onClick={closePost}>
              <IconClose />
            </button>

            <div className="postsGridModal__grid">
              <div className="postsGridModal__media">
                {currentIndex > 0 ? (
                  <button className="ui-btn ui-btn--soft ui-btn--icon ui-navArrow ui-navArrow--left" onClick={prevPost}>
                    <IconChevronLeft />
                  </button>
                ) : null}

                <img src={openItem.image_url} alt={openItem.caption || "Publicación"} />

                {currentIndex < normalized.length - 1 ? (
                  <button className="ui-btn ui-btn--soft ui-btn--icon ui-navArrow ui-navArrow--right" onClick={nextPost}>
                    <IconChevronRight />
                  </button>
                ) : null}
              </div>

              <aside className="postsGridModal__side">
                <div className="postsGridModal__top">
                  <div className="postsGridModal__title">Tu publicación</div>
                  <div className="postsGridModal__date">{fmtDate(openItem.created_at)}</div>
                </div>

                <div className="postsGridModal__body">
                  <div className="postsGridModal__stats">
                    <span className="postsGridModal__stat">
                      <IconHeart /> {openItem.likes_count || 0}
                    </span>
                    <span className="postsGridModal__dot">•</span>
                    <span className="postsGridModal__stat">
                      <IconComment /> {openItem.comments_count || 0}
                    </span>
                  </div>

                  {openItem.caption ? (
                    <div className="postsGridModal__caption">{openItem.caption}</div>
                  ) : (
                    <div className="postsGridModal__caption postsGridModal__caption--muted">Sin descripción</div>
                  )}
                </div>

                <div className="postsGridModal__bottom">
                  <Button variant="danger" size="sm" onClick={() => onDelete(openItem.id)} disabled={busy}>
                    <IconTrash />
                    Eliminar
                  </Button>
                  <div className="postsGridModal__counter">
                    {currentIndex + 1} / {normalized.length}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={newOpen}
        title="Nueva publicación"
        onClose={() => {
          setNewOpen(false);
          resetComposer();
        }}
        width="min(560px, calc(100vw - 24px))"
      >
        <div className="ui-card postsGridUpload">
          <div className="ui-card__header">
            <div className="ui-card__title">Nueva publicación</div>
            <div className="ui-card__sub">Recorta tu imagen y añade una descripción opcional.</div>
          </div>

          <div className="ui-stack">
            {localSrc ? (
              <>
                <div className="postsGridUpload__cropWrap">
                  <Cropper
                    image={localSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedPixels(croppedAreaPixels)}
                    showGrid={false}
                    objectFit="contain"
                  />
                </div>

                <div className="postsGridUpload__controls">
                  <label className="postsGridUpload__zoomLabel">
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

                <label className="postsGridUpload__captionLabel">
                  Descripción
                  <textarea
                    className="postsGridUpload__caption"
                    placeholder="Escribe algo sobre esta foto…"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <div className="postsGridUpload__preview">
                <img
                  alt="Vista previa"
                  src="data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8' ?><svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='100%' height='100%' fill='%230b1220'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239fb0c7' font-family='Arial' font-size='28'>Selecciona una imagen</text></svg>"
                />
              </div>
            )}

            <div className="ui-row ui-row--end">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewOpen(false);
                  resetComposer();
                }}
              >
                Cancelar
              </Button>
              <Button variant="brand" onClick={onUpload} disabled={busy || !localSrc || !croppedPixels}>
                {busy ? "Subiendo…" : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
