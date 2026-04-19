/**
 * Mobile-first modal that slides up from the bottom. Replaces the
 * desktop-style centered AvatarActionSheet / FilterPopup patterns.
 *
 * Features:
 *  - Tap on scrim or drag the grabber down to dismiss.
 *  - Body scroll is locked while open.
 *  - Safe-area aware: bottom padding respects the iOS home indicator.
 *  - Focus is moved into the sheet on open and Escape closes it.
 *
 * Props:
 *  - open: boolean — controls visibility.
 *  - onClose: () => void — called on scrim click, drag, or Escape.
 *  - title: optional heading rendered in a header slot.
 *  - children: body content.
 *  - footer: optional footer slot (fixed to the bottom of the sheet
 *    above the safe area).
 */

import { useEffect, useRef, useState } from "react";

const DRAG_DISMISS_THRESHOLD = 80; // pixels dragged before we close

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function BottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  className = "",
}) {
  const panelRef = useRef(null);
  const grabberRef = useRef(null);
  const [drag, setDrag] = useState({ startY: 0, deltaY: 0, active: false });

  // Lock body scroll while the sheet is open so the background
  // doesn't scroll under the finger.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape key closes.
  useEffect(() => {
    if (!open) return undefined;
    function handle(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Move focus into the panel so assistive tech announces it.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  function handleTouchStart(e) {
    const touch = e.touches[0];
    setDrag({ startY: touch.clientY, deltaY: 0, active: true });
  }

  function handleTouchMove(e) {
    if (!drag.active) return;
    const touch = e.touches[0];
    const deltaY = Math.max(0, touch.clientY - drag.startY);
    setDrag((prev) => ({ ...prev, deltaY }));
  }

  function handleTouchEnd() {
    if (!drag.active) return;
    if (drag.deltaY > DRAG_DISMISS_THRESHOLD) {
      onClose?.();
    }
    setDrag({ startY: 0, deltaY: 0, active: false });
  }

  const translate = drag.active ? drag.deltaY : 0;

  return (
    <div
      className="ui-sheet__overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || "Panel"}
        className={joinClasses("ui-sheet__panel", className)}
        style={{ transform: translate ? `translateY(${translate}px)` : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={grabberRef}
          className="ui-sheet__grabberWrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <span className="ui-sheet__grabber" aria-hidden="true" />
        </div>

        {title ? (
          <header className="ui-sheet__header">
            <h2 className="ui-sheet__title">{title}</h2>
          </header>
        ) : null}

        <div className="ui-sheet__body">{children}</div>

        {footer ? <footer className="ui-sheet__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
