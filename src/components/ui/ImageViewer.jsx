import { useEffect, useRef, useState } from "react";
import "../../styles/image-viewer.css";

/**
 * Reusable full-screen image viewer with pinch-to-zoom and pan.
 *
 * Props:
 * - src: image URL to display
 * - alt: accessible alt text
 * - onClose: callback invoked when the user dismisses the viewer
 * - actions?: optional array of { label, onClick } buttons rendered in the
 *   bottom action bar (e.g. "Descargar", "Cambiar")
 */
export default function ImageViewer({ src, alt = "", onClose, actions = [] }) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Wheel-zoom (desktop trackpad). Non-passive so preventDefault works.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      setScale((prev) => clamp(prev + delta, MIN_SCALE, MAX_SCALE));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pinch zoom + pan.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastTouchDistance = null;
    let lastPanPoint = null;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        lastTouchDistance = touchDistance(e.touches);
      } else if (e.touches.length === 1 && scale > 1) {
        lastPanPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && lastTouchDistance != null) {
        e.preventDefault();
        const d = touchDistance(e.touches);
        const ratio = d / lastTouchDistance;
        setScale((prev) => clamp(prev * ratio, MIN_SCALE, MAX_SCALE));
        lastTouchDistance = d;
      } else if (e.touches.length === 1 && lastPanPoint && scale > 1) {
        const dx = e.touches[0].clientX - lastPanPoint.x;
        const dy = e.touches[0].clientY - lastPanPoint.y;
        setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPanPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      lastTouchDistance = null;
      lastPanPoint = null;
      // Snap back if we zoomed out to 1.
      setScale((prev) => {
        if (prev <= 1.01) {
          setTranslate({ x: 0, y: 0 });
          return 1;
        }
        return prev;
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scale]);

  function handleDoubleClick() {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }

  function resetZoom() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  return (
    <div
      className="imageViewer__overlay"
      onClick={onClose}
      role="dialog"
      aria-label={alt || "Ver imagen"}
    >
      <div
        ref={containerRef}
        className="imageViewer__container"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="imageViewer__image"
          draggable={false}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        />
      </div>

      <button
        type="button"
        className="imageViewer__close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {scale > 1 ? (
        <button
          type="button"
          className="imageViewer__reset"
          onClick={resetZoom}
          aria-label="Restablecer zoom"
        >
          Restablecer
        </button>
      ) : null}

      {actions.length > 0 ? (
        <div className="imageViewer__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="imageViewer__actionBtn"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick?.();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
