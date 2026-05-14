"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BountyCard } from "@/components/BountyCard";
import type { BountyFeedItem } from "@/lib/types/bounty";
import Link from "next/link";
import { ArrowPathIcon, PlusIconIcon, InboxIconIcon } from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const [items, setItems] = useState<BountyFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bounties/feed`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load feed");
      }
      const data = await res.json();
      setItems(data.bounties as BountyFeedItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
            >
              Available bounties
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>
              Open tasks — apply to start earning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadFeed}
              className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white"
              style={{ borderColor: "var(--border2)", color: "var(--text2)", background: "transparent" }}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
            >
              <PlusIcon className="h-4 w-4" />
              Post bounty
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 rounded-xl border px-4 py-3 text-sm"
            style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
          >
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--violet)" }} />
            <p className="text-sm" style={{ color: "var(--text3)" }}>Loading bounties…</p>
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <InboxIcon className="mb-4 h-12 w-12 opacity-20" style={{ color: "var(--text)" }} />
            <h3 className="mb-1 text-lg font-semibold" style={{ color: "var(--text)" }}>
              No bounties yet
            </h3>
            <p className="mb-6 text-sm" style={{ color: "var(--text2)" }}>
              Be the first to post a bounty in your area.
            </p>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
            >
              <PlusIcon className="h-4 w-4" />
              Post the first one
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((b, i) => (
              <div
                key={b.id}
                className="animate-step-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <BountyCard bounty={b} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
