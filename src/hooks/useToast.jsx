import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

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

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function toastTitle(type) {
  if (type === "success") return "Hecho";
  if (type === "error") return "Error";
  return "Aviso";
}

function toneClass(type) {
  if (type === "success") return "toast toast--success";
  if (type === "error") return "toast toast--error";
  return "toast toast--info";
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function dismiss(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function push(type, message) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }

  const api = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <article key={t.id} className={toneClass(t.type)} role="status">
            <div className="toast__body">
              <div className="toast__icon" aria-hidden="true">
                <ToastIcon type={t.type} />
              </div>
              <div className="toast__content">
                <strong className="toast__title">{toastTitle(t.type)}</strong>
                {t.message ? <p className="toast__message">{t.message}</p> : null}
              </div>
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar aviso"
              title="Cerrar"
            >
              &times;
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
