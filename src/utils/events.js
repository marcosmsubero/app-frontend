// Event bus ultra simple (sin dependencias)
// Permite refrescar UI en base a acciones: create/join/leave/cancel/done...

const listeners = {};

export function on(event, fn) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(fn);

  return () => {
    listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
  };
}

export function emit(event, payload) {
  (listeners[event] || []).forEach((fn) => fn(payload));
}