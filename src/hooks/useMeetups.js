import { useState } from "react";
import { api } from "../services/api";
import { emit } from "../utils/events";

/**
 * Convierte un valor de <input type="datetime-local">
 * a ISO UTC correcto (regla de oro).
 *
 * Ejemplo:
 * "2026-02-10T19:00" (hora local)
 * -> "2026-02-10T18:00:00.000Z" (UTC)
 */
function toUtcIsoFromDatetimeLocal(value) {
  if (!value) return value;

  // Si ya viene con Z u offset, no tocamos
  if (value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const d = new Date(value); // interpreta como LOCAL
  return d.toISOString();   // lo convierte a UTC
}

export function useMeetups(token, toast) {
  const [meetups, setMeetups] = useState([]);
  const [loadingMeetups, setLoadingMeetups] = useState(false);

  async function loadMeetups(groupId) {
    if (!groupId || !token) return;

    setLoadingMeetups(true);
    try {
      const data = await api(`/groups/${groupId}/meetups`, { token });
      setMeetups(Array.isArray(data) ? data : []);
    } catch (e) {
      toast?.error?.(e.message || "Error cargando quedadas");
      setMeetups([]);
    } finally {
      setLoadingMeetups(false);
    }
  }

  async function createMeetup(groupId, payload) {
    if (!groupId || !token) return;

    try {
      const body = {
        ...payload,
        starts_at: toUtcIsoFromDatetimeLocal(payload.starts_at),
      };

      console.log("⏰ FRONT payload.starts_at =", payload.starts_at);
      console.log("🌍 FRONT body.starts_at =", body.starts_at);

      await api(`/groups/${groupId}/meetups`, {
        method: "POST",
        token,
        body,
      });

      toast?.success?.("Quedada creada");
      await loadMeetups(groupId);

      emit("meetup_changed", { type: "created", groupId });
    } catch (e) {
      toast?.error?.(e.message || "Error creando quedada");
      throw e;
    }
  }

  async function joinMeetup(id, groupId) {
    if (!id || !token) return;

    try {
      await api(`/meetups/${id}/join`, { method: "POST", token });
      toast?.success?.("Te has apuntado");
      if (groupId) await loadMeetups(groupId);

      emit("meetup_changed", { type: "joined", meetupId: id, groupId });
    } catch (e) {
      toast?.error?.(e.message || "Error al apuntarte");
      throw e;
    }
  }

  async function leaveMeetup(id, groupId) {
    if (!id || !token) return;

    try {
      await api(`/meetups/${id}/leave`, { method: "POST", token });
      toast?.info?.("Has salido");
      if (groupId) await loadMeetups(groupId);

      emit("meetup_changed", { type: "left", meetupId: id, groupId });
    } catch (e) {
      toast?.error?.(e.message || "Error al salir");
      throw e;
    }
  }

  async function cancelMeetup(id, groupId) {
    if (!id || !token) return;

    try {
      await api(`/meetups/${id}/cancel`, { method: "POST", token });
      toast?.info?.("Quedada cancelada");
      if (groupId) await loadMeetups(groupId);

      emit("meetup_changed", { type: "cancelled", meetupId: id, groupId });
    } catch (e) {
      toast?.error?.(e.message || "Error cancelando quedada");
      throw e;
    }
  }

  async function doneMeetup(id, groupId) {
    if (!id || !token) return;

    try {
      await api(`/meetups/${id}/done`, { method: "POST", token });
      toast?.success?.("Quedada marcada como hecha");
      if (groupId) await loadMeetups(groupId);

      emit("meetup_changed", { type: "done", meetupId: id, groupId });
    } catch (e) {
      toast?.error?.(e.message || "Error marcando como hecha");
      throw e;
    }
  }

  return {
    meetups,
    loadingMeetups,
    loadMeetups,
    createMeetup,
    joinMeetup,
    leaveMeetup,
    cancelMeetup,
    doneMeetup,
  };
}