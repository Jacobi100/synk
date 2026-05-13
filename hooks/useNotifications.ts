"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/bounty";

type ProfileRow = { id: string };

export function useNotifications() {
  const { isSignedIn, isLoaded } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = (await res.json()) as Notification[];
    setNotifications(data);
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const poll = setInterval(() => {
      void fetchNotifications();
    }, 20000);

    (async () => {
      setLoading(true);
      const pr = await fetch("/api/profile");
      if (cancelled) return;
      if (!pr.ok) {
        setLoading(false);
        return;
      }
      const p = (await pr.json()) as ProfileRow;
      setProfileId(p.id);
      await fetchNotifications();
      if (cancelled) return;
      setLoading(false);

      const ch = supabase
        .channel(`notifications:${p.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${p.id}`,
          },
          () => {
            void fetchNotifications();
          },
        )
        .subscribe();

      if (cancelled) {
        void supabase.removeChannel(ch);
        return;
      }
      channelRef.current = ch;
    })();

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isLoaded, isSignedIn, fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAllRead,
    loading,
    profileId,
    refresh: fetchNotifications,
  };
}
