"use client";

import Link from "next/link";
import type { Bounty, BountyFeedItem } from "@/lib/types/bounty";
import { MapPin, Clock, Sparkles, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRef } from "react";

interface BountyCardProps {
  bounty: Bounty | BountyFeedItem;
}

function isFeedItem(b: Bounty | BountyFeedItem): b is BountyFeedItem {
  return "poster_name" in b || "suggested_price_min" in b;
}

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

export function BountyCard({ bounty }: BountyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const priceDisplay = () => {
    if (!bounty.price_min && !bounty.price_max) return "Price on request";
    if (bounty.price_min && bounty.price_max)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()} – ${bounty.price_max.toLocaleString()}`;
    if (bounty.price_min) return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  const feed = isFeedItem(bounty) ? bounty : null;
  const statusStyle = STATUS_STYLES[bounty.status] ?? STATUS_STYLES.cancelled;
  const urgencyStyle = URGENCY_STYLES[bounty.urgency] ?? "bg-neutral-100 text-neutral-500 border-neutral-200";

  return (
    <Link href={`/bounties/${bounty.id}`} className="block h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="spotlight-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--violet)] hover:shadow-[var(--shadow-violet)]"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Spotlight overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(300px circle at var(--mouse-x,50%) var(--mouse-y,50%), var(--violet-subtle), transparent 60%)",
          }}
        />

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-[var(--violet)]"
              style={{ color: "var(--text)" }}
            >
              {bounty.title}
            </h3>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--text2)" }}>
              {bounty.category}
            </p>
            {feed?.poster_name && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--text3)" }}>
                by {feed.poster_name}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
          >
            {STATUS_LABELS[bounty.status] ?? bounty.status}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "var(--text2)" }}>
          {bounty.description || "No description provided."}
        </p>

        {/* Meta row */}
        <div className="mb-4 space-y-1.5">
          {bounty.location_name && (
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text2)" }}>
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text3)" }} />
              {bounty.location_name}
            </div>
          )}
          <div className="text-sm font-bold" style={{ color: "var(--violet)" }}>
            {priceDisplay()}
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${urgencyStyle}`}
            >
              {bounty.urgency}
            </span>
            {bounty.price_negotiable && (
              <span
                className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  background: "var(--violet-subtle)",
                  color: "var(--violet)",
                  borderColor: "var(--violet)",
                }}
              >
                Negotiable
              </span>
            )}
            {feed?.suggested_price_min != null && feed.suggested_price_max != null && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  background: "var(--violet-subtle)",
                  color: "var(--violet)",
                  borderColor: "var(--violet)",
                }}
              >
                <Sparkles className="h-3 w-3" />
                ₦{feed.suggested_price_min.toLocaleString("en-NG")}–
                {feed.suggested_price_max.toLocaleString("en-NG")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text3)" }}>
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}
          </div>
        </div>

        {bounty.slots_available > 0 && (
          <div
            className="mt-2.5 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--success-color)" }}
          >
            <Users className="h-3.5 w-3.5" />
            {bounty.slots_available} {bounty.slots_available === 1 ? "slot" : "slots"} available
          </div>
        )}
      </div>
    </Link>
  );
}
