"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const recent = notifications.slice(0, 12);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative rounded-lg p-2 transition-colors hover:bg-[var(--bg2)]"
        style={{ color: "var(--text2)" }}
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--violet)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl"
          style={{
            background: "var(--bg-ink2)",
            borderColor: "var(--border-ink)",
            boxShadow: "var(--shadow-ink)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{ borderColor: "var(--border-ink)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-inv)" }}>
              {COPY.NOTIFICATIONS.TITLE}
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs hover:bg-white/10"
                style={{ color: "var(--violet3)" }}
                onClick={() => void markAllRead()}
              >
                {COPY.NOTIFICATIONS.MARK_ALL_READ}
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && recent.length === 0 ? (
              <div className="flex justify-center py-8">
                <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: "var(--violet3)" }} />
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-inv2)" }}>
                No notifications yet
              </p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="block w-full border-b px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                  style={{
                    borderColor: "var(--border-ink)",
                    background: !n.read ? "rgba(94,58,255,0.06)" : "transparent",
                  }}
                  onClick={() => {
                    setOpen(false);
                    if (n.related_bounty_id) router.push(`/bounties/${n.related_bounty_id}`);
                  }}
                >
                  <div
                    className="font-medium text-[13px]"
                    style={{ color: n.read ? "var(--text-inv2)" : "var(--text-inv)" }}
                  >
                    {n.title}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--text-inv2)" }}>
                    {n.body}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="border-t px-4 py-2.5 text-center"
            style={{ borderColor: "var(--border-ink)" }}
          >
            <button
              className="text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--violet3)" }}
              onClick={() => {
                setOpen(false);
                router.push("/dashboard");
              }}
            >
              {COPY.NOTIFICATIONS.VIEW_FEED}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
