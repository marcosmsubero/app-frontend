import "./toasts.css";

function normalizeMessage(message) {
  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" · ");
  }

  if (typeof message === "string") {
    return message;
  }

  return "";
}

function getToneClass(type) {
  if (type === "success") return "toast toast--success";
  if (type === "error") return "toast toast--error";
  if (type === "warn" || type === "warning") return "toast toast--warning";
  return "toast toast--info";
}

function ToastIcon({ type }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    );
  }

  if (type === "warn" || type === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7h.01" />
    </svg>
  );
}

export default function Toasts({ toasts = [], onClose }) {
  if (!Array.isArray(toasts) || toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const title = toast?.title || "Actualización";
        const message = normalizeMessage(toast?.message);

        return (
          <article key={toast.id} className={getToneClass(toast?.type)} role="status">
            <div className="toast__body">
              <div className="toast__icon" aria-hidden="true">
                <ToastIcon type={toast?.type} />
              </div>

              <div className="toast__content">
                <strong className="toast__title">{title}</strong>
                {message ? <p className="toast__message">{message}</p> : null}
              </div>
            </div>

            <button
              type="button"
              className="toast__close"
              onClick={() => onClose?.(toast.id)}
              aria-label="Cerrar aviso"
              title="Cerrar"
            >
              ×
            </button>
          </article>
        );
      })}
    </div>
  );
}
