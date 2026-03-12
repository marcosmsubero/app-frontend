import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export function useGroupMeetups(groupId, token) {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await api(`/groups/${groupId}/meetups`, { token });
      setMeetups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("load meetups", e);
      setMeetups([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { meetups, loading, reload, setMeetups };
}
