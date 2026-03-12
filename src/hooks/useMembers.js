import { useState } from "react";
import { api } from "../services/api";

export function useMembers(token, toast) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  async function loadMembers(groupId) {
    if (!groupId || !token) return;

    setLoadingMembers(true);
    try {
      const data = await api(`/groups/${groupId}/members`, { token });
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.error?.(err.message);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function setRole(groupId, userId, role) {
    if (!groupId || !userId || !role) return;

    try {
      await api(
        `/groups/${groupId}/members/${userId}/role?role=${encodeURIComponent(
          role
        )}`,
        { method: "POST", token }
      );
      toast?.success?.("Rol actualizado");
      await loadMembers(groupId);
    } catch (err) {
      toast?.error?.(err.message);
    }
  }

  async function kick(groupId, userId) {
    if (!groupId || !userId) return;

    try {
      await api(
        `/groups/${groupId}/members/${userId}/kick`,
        { method: "POST", token }
      );
      toast?.success?.("Miembro expulsado");
      await loadMembers(groupId);
    } catch (err) {
      toast?.error?.(err.message);
    }
  }

  return {
    members,
    loadingMembers,
    loadMembers,
    setRole,
    kick,
  };
}