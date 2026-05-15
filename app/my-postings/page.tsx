"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { COPY } from "@/lib/copy";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  PlusIcon,
  ArrowLeftIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-emerald-50  text-emerald-700  border-emerald-200",
  in_progress: "bg-amber-50    text-amber-700    border-amber-200",
  paid:        "bg-violet-50   text-violet-700   border-violet-200",
  completed:   "bg-blue-50     text-blue-700     border-blue-200",
  cancelled:   "bg-neutral-100 text-neutral-500  border-neutral-200",
};

const STATUS_LABELS: Record<string, string> = {
  open:        COPY.STATUS.open,
  in_progress: COPY.STATUS.in_progress,
  paid:        COPY.STATUS.paid,
  completed:   COPY.STATUS.completed,
  cancelled:   COPY.STATUS.cancelled,
};

const URGENCY_STYLES: Record<string, string> = {
  asap:      "bg-red-50   text-red-700   border-red-100",
  scheduled: "bg-sky-50   text-sky-700   border-sky-100",
  flexible:  "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function MyPostingsPage() {
  const { user } = useUser();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bounties?mine=true");
        if (!res.ok) throw new Error("Failed to fetch bounties");
        setBounties(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const priceDisplay = (b: Bounty) => {
    if (!b.price_min && !b.price_max) return "Price on request";
    if (b.price_min && b.price_max) return `${b.currency} ${b.price_min.toLocaleString()} – ${b.price_max.toLocaleString()}`;
    if (b.price_min) return `${b.currency} ${b.price_min.toLocaleString()}+`;
    return `${b.currency} ${b.price_max?.toLocaleString()}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted-foreground">
          Sign in to view your postings.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              style={{ letterSpacing: "-0.03em" }}
            >
              {COPY.MY_POSTINGS.TITLE}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {COPY.MY_POSTINGS.SUBTITLE}
            </p>
          </div>
          <Link
            href="/bounties/create"
            className="inline-flex items-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "var(--primary)" }}
          >
            <PlusIcon className="h-4 w-4" /> {COPY.MY_POSTINGS.NEW_JOB}
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : error ? (
          <div
            className="rounded-[24px] border p-6 flex items-start gap-4"
            style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)" }}
          >
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--negative)" }} />
            <p className="text-sm" style={{ color: "var(--negative)" }}>{error}</p>
          </div>
        ) : bounties.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[24px] border bg-background py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <InboxIcon className="mb-4 h-12 w-12 opacity-20" style={{ color: "var(--foreground)" }} />
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {COPY.MY_POSTINGS.EMPTY_TITLE}
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {COPY.MY_POSTINGS.EMPTY_SUB}
            </p>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              <PlusIcon className="h-4 w-4" /> {COPY.MY_POSTINGS.NEW_JOB}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty, i) => {
              const statusStyle = STATUS_STYLES[bounty.status] ?? STATUS_STYLES.cancelled;
              const urgencyStyle = URGENCY_STYLES[bounty.urgency] ?? "bg-neutral-100 text-neutral-500 border-neutral-200";

              return (
                <div
                  key={bounty.id}
                  className="rounded-[24px] border bg-background p-6 transition-shadow hover:shadow-md animate-step-in"
                  style={{ borderColor: "var(--border)", animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {bounty.title}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                          {STATUS_LABELS[bounty.status] ?? bounty.status}
                        </span>
                      </div>
                      {bounty.description && (
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {bounty.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                        {priceDisplay(bounty)}
                      </p>
                      <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${urgencyStyle}`}>
                        {bounty.urgency}
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-4 flex flex-wrap gap-4 border-t border-b border-border py-3 text-sm text-muted-foreground"
                  >
                    {bounty.location_name && (
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5 text-mute" />
                        {bounty.location_name}
                      </div>
                    )}
                    {bounty.deadline && (
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-mute" />
                        {new Date(bounty.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="h-3.5 w-3.5 text-mute" />
                      {bounty.slots_available} {bounty.slots_available !== 1 ? "slots" : "slot"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="inline-flex items-center rounded-[24px] border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary text-muted-foreground"
                    >
                      View details
                    </Link>
                    {bounty.status === "open" && (
                      <Link
                        href={`/bounties/${bounty.id}/applications`}
                        className="inline-flex items-center rounded-[24px] px-3.5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: "var(--primary)" }}
                      >
                        {COPY.MY_POSTINGS.VIEW_HELPERS}
                      </Link>
                    )}
                    {bounty.status === "in_progress" && (
                      <>
                        <Link
                          href={`/bounties/${bounty.id}/payment`}
                          className="inline-flex items-center rounded-[24px] border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary text-muted-foreground"
                        >
                          {COPY.MY_POSTINGS.PAYMENT}
                        </Link>
                        <Link
                          href={`/bounties/${bounty.id}/complete`}
                          className="inline-flex items-center rounded-[24px] px-3.5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                          style={{ background: "var(--positive)" }}
                        >
                          {COPY.MY_POSTINGS.CONFIRM_DONE}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
