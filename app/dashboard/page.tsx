"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BountyCard } from "@/components/BountyCard";
import { COPY } from "@/lib/copy";
import type { BountyFeedItem } from "@/lib/types/bounty";
import Link from "next/link";
import { ArrowPathIcon, PlusIcon, InboxIcon } from "@heroicons/react/24/outline";

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

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              style={{ letterSpacing: "-0.03em" }}
            >
              {COPY.DASHBOARD.AVAILABLE_JOBS}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {COPY.DASHBOARD.AVAILABLE_JOBS_SUB}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadFeed}
              className="inline-flex items-center gap-2 rounded-[24px] border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--background)" }}
            >
              <ArrowPathIcon className="h-4 w-4" />
              {COPY.DASHBOARD.REFRESH}
            </button>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-[24px] px-4 py-2 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5"
              style={{ background: "var(--primary)" }}
            >
              <PlusIcon className="h-4 w-4" />
              {COPY.DASHBOARD.POST_JOB}
            </Link>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 rounded-[24px] border px-4 py-3 text-sm"
            style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)", color: "var(--negative)" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-sm text-mute">{COPY.LOADING}</p>
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[24px] border bg-background py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <InboxIcon className="mb-4 h-12 w-12 opacity-20" style={{ color: "var(--foreground)" }} />
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              {COPY.DASHBOARD.NO_JOBS}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {COPY.DASHBOARD.NO_JOBS_SUB}
            </p>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-[24px] px-5 py-2.5 text-sm font-semibold text-foreground"
              style={{ background: "var(--primary)" }}
            >
              <PlusIcon className="h-4 w-4" />
              {COPY.DASHBOARD.POST_FIRST}
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
