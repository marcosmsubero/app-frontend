/**
 * useRealtimeChat — Supabase Realtime subscription for DM messages.
 *
 * Listens to INSERT events on the `dm_messages` table filtered by thread_id.
 * Falls back gracefully if Supabase Realtime is unavailable.
 */

import { useEffect, useRef } from "react";
import { supabase, hasSupabaseEnv } from "../lib/supabase";

/**
 * @param {string|number} threadId - The DM thread to subscribe to
 * @param {(message: object) => void} onNewMessage - Called when a new message arrives
 */
export function useRealtimeChat(threadId, onNewMessage) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!threadId || !hasSupabaseEnv || !supabase) return;

    const channel = supabase
      .channel(`dm-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (payload?.new) {
            callbackRef.current?.(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [threadId]);
}

/**
 * useRealtimeThreadList — Listens for new messages across ALL threads
 * to update unread counts / thread previews in real time.
 */
export function useRealtimeThreadList(userId, onNewMessage) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!userId || !hasSupabaseEnv || !supabase) return;

    const channel = supabase
      .channel(`dm-inbox-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
        },
        (payload) => {
          if (payload?.new) {
            callbackRef.current?.(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
