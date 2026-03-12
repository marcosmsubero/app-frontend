import { useState } from "react";
import { api } from "../services/api";

export function useGroups(token, toast) {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningByInvite, setJoiningByInvite] = useState(false);

  const [invites, setInvites] = useState([]);

  // ✅ ahora acepta query opcional: "?sport=...&city=..."
  async function loadGroups(query = "") {
    if (loadingGroups) return;
    setLoadingGroups(true);
    try {
      const data = await api(`/groups${query}`, { token });
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.error?.(err.message);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }

  async function createGroup({ name, sport, city, is_private }) {
    if (creatingGroup) return;
    setCreatingGroup(true);
    try {
      const g = await api("/groups", {
        method: "POST",
        token,
        body: { name, sport, city, is_private },
      });
      toast?.success?.("Grupo creado");
      await loadGroups();
      return g;
    } catch (err) {
      toast?.error?.(err.message);
      throw err;
    } finally {
      setCreatingGroup(false);
    }
  }

  async function joinGroup(groupId) {
    try {
      const res = await api(`/groups/${groupId}/join`, {
        method: "POST",
        token,
      });
      toast?.success?.(res?.message || "Te has unido al grupo");
      await loadGroups();
      return res;
    } catch (err) {
      toast?.error?.(err.message);
      throw err;
    }
  }

  async function joinByInvite(inviteToken) {
    if (joiningByInvite) return;
    setJoiningByInvite(true);
    try {
      const res = await api(
        `/groups/join-by-invite/${encodeURIComponent(inviteToken)}`,
        { method: "POST", token }
      );
      toast?.success?.(res?.message || "Unido por invitación");
      await loadGroups();
      return res;
    } catch (err) {
      toast?.error?.(err.message);
      throw err;
    } finally {
      setJoiningByInvite(false);
    }
  }

  // ========== INVITES ==========
  async function loadInvites(groupId) {
    try {
      const data = await api(`/groups/${groupId}/invites`, { token });
      setInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.error?.(err.message);
      setInvites([]);
    }
  }

  async function createInvite(groupId, payload = {}) {
    try {
      const inv = await api(`/groups/${groupId}/invites`, {
        method: "POST",
        token,
        body: payload, // { expires_at, max_uses } opcional
      });
      toast?.success?.("Invitación creada");
      await loadInvites(groupId);
      return inv;
    } catch (err) {
      toast?.error?.(err.message);
      throw err;
    }
  }

  async function revokeInvite(groupId, inviteToken) {
    try {
      await api(
        `/groups/${groupId}/invites/${encodeURIComponent(inviteToken)}/revoke`,
        { method: "POST", token }
      );
      toast?.info?.("Invitación revocada");
      await loadInvites(groupId);
    } catch (err) {
      toast?.error?.(err.message);
      throw err;
    }
  }

  return {
    groups,
    loadGroups,
    createGroup,
    joinGroup,
    joinByInvite,

    loadingGroups,
    creatingGroup,
    joiningByInvite,

    invites,
    loadInvites,
    createInvite,
    revokeInvite,
  };
}