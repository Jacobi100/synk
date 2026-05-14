"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  MapPinIconIcon,
  ClockIconIcon,
  UsersIconIcon,
  PlusIconIcon,
  ArrowLeftIconIcon,
  InboxIconIcon,
} from "@heroicons/react/24/outline";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-emerald-50  text-emerald-700  border-emerald-200",
  in_progress: "bg-amber-50    text-amber-700    border-amber-200",
  paid:        "bg-violet-50   text-violet-700   border-violet-200",
  completed:   "bg-blue-50     text-blue-700     border-blue-200",
  cancelled:   "bg-neutral-100 text-neutral-500  border-neutral-200",
};

const STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  paid:        "Paid",
  completed:   "Completed",
  cancelled:   "Cancelled",
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
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm" style={{ color: "var(--text2)" }}>
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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
            >
              My Postings
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>
              Manage and track all bounties you have posted.
            </p>
          </div>
          <Link
            href="/bounties/create"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
          >
            <PlusIcon className="h-4 w-4" /> New bounty
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--violet)" }} />
          </div>
        ) : error ? (
          <div
            className="rounded-xl border p-6 flex items-start gap-4"
            style={{ background: "#fef2f2", borderColor: "#fecaca" }}
          >
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <p className="text-sm" style={{ color: "#991b1b" }}>{error}</p>
          </div>
        ) : bounties.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <InboxIcon className="mb-4 h-12 w-12 opacity-20" style={{ color: "var(--text)" }} />
            <h3 className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
              No bounties posted yet
            </h3>
            <p className="mb-5 text-sm" style={{ color: "var(--text2)" }}>
              Create your first bounty to start receiving applications.
            </p>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
            >
              <PlusIcon className="h-4 w-4" /> Create bounty
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
                  className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md animate-step-in"
                  style={{ borderColor: "var(--border)", animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                          {bounty.title}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                          {STATUS_LABELS[bounty.status] ?? bounty.status}
                        </span>
                      </div>
                      {bounty.description && (
                        <p className="text-sm line-clamp-2" style={{ color: "var(--text2)" }}>
                          {bounty.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold" style={{ color: "var(--violet)" }}>
                        {priceDisplay(bounty)}
                      </p>
                      <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${urgencyStyle}`}>
                        {bounty.urgency}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div
                    className="mt-4 flex flex-wrap gap-4 border-t border-b py-3 text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                  >
                    {bounty.location_name && (
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5" style={{ color: "var(--text3)" }} />
                        {bounty.location_name}
                      </div>
                    )}
                    {bounty.deadline && (
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5" style={{ color: "var(--text3)" }} />
                        {new Date(bounty.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="h-3.5 w-3.5" style={{ color: "var(--text3)" }} />
                      {bounty.slots_available} {bounty.slots_available !== 1 ? "slots" : "slot"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:border-[var(--violet)] hover:text-[var(--violet)]"
                      style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                    >
                      View details
                    </Link>
                    {bounty.status === "open" && (
                      <Link
                        href={`/bounties/${bounty.id}/applications`}
                        className="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
                      >
                        View applications
                      </Link>
                    )}
                    {bounty.status === "in_progress" && (
                      <>
                        <Link
                          href={`/bounties/${bounty.id}/payment`}
                          className="inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:border-[var(--violet)] hover:text-[var(--violet)]"
                          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                        >
                          Payment
                        </Link>
                        <Link
                          href={`/bounties/${bounty.id}/complete`}
                          className="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                          style={{ background: "var(--success-color)" }}
                        >
                          Mark complete
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
