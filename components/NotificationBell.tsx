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
        className="relative rounded-[24px] p-2 transition-colors hover:bg-secondary text-muted-foreground"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-primary-foreground"
            style={{ background: "var(--primary)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[24px] border border-border bg-background shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">
              {COPY.NOTIFICATIONS.TITLE}
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                style={{ color: "var(--primary)" }}
                onClick={() => void markAllRead()}
              >
                {COPY.NOTIFICATIONS.MARK_ALL_READ}
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && recent.length === 0 ? (
              <div className="flex justify-center py-8">
                <ArrowPathIcon className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="block w-full border-b border-border px-4 py-3 text-left text-sm transition-colors hover:bg-secondary"
                  style={{
                    background: !n.read ? "var(--primary-pale)" : "transparent",
                  }}
                  onClick={() => {
                    setOpen(false);
                    if (n.related_bounty_id) router.push(`/bounties/${n.related_bounty_id}`);
                  }}
                >
                  <div
                    className="font-medium text-[13px]"
                    style={{ color: n.read ? "var(--muted-foreground)" : "var(--foreground)" }}
                  >
                    {n.title}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5 text-center">
            <button
              className="text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--primary)" }}
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
