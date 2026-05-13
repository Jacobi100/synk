"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";

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
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void markAllRead()}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && recent.length === 0 ? (
              <div className="flex justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`block w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${
                    n.read ? "text-gray-600" : "bg-blue-50/50 font-medium text-gray-900"
                  }`}
                  onClick={() => {
                    setOpen(false);
                    if (n.related_bounty_id) {
                      router.push(`/bounties/${n.related_bounty_id}`);
                    }
                  }}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-gray-500">{n.body}</div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 text-center">
            <Link href="/dashboard" className="text-xs font-medium text-blue-600 hover:underline">
              Go to feed
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
