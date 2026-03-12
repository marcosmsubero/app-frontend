import { useEffect } from "react";

export default function Toasts({ toasts, onRemove }) {
  useEffect(() => {
    if (!toasts?.length) return;

    const timers = toasts.map((t) =>
      setTimeout(() => onRemove(t.id), t.duration ?? 3500)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || "info"}`}>
          <div className="toast-title">{t.title}</div>
          {t.message ? <div className="toast-msg">{t.message}</div> : null}
          <button
            className="toast-x"
            onClick={() => onRemove(t.id)}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}