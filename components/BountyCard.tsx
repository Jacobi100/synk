"use client";

import Link from "next/link";
import type { Bounty, BountyFeedItem } from "@/lib/types/bounty";
import {
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { useRef } from "react";
import { COPY } from "@/lib/copy";

interface BountyCardProps {
  bounty: Bounty | BountyFeedItem;
}

function isFeedItem(b: Bounty | BountyFeedItem): b is BountyFeedItem {
  return "poster_name" in b || "suggested_price_min" in b;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[var(--primary-pale)] text-[var(--positive-deep)]",
  in_progress: "bg-[#fff3cd] text-[#856404]",
  paid: "bg-[var(--primary-pale)] text-foreground",
  completed: "bg-[var(--primary-pale)] text-[var(--positive-deep)]",
  cancelled: "bg-muted text-mute",
};

const STATUS_LABELS: Record<string, string> = {
  open: COPY.STATUS.open,
  in_progress: COPY.STATUS.in_progress,
  paid: COPY.STATUS.paid,
  completed: COPY.STATUS.completed,
  cancelled: COPY.STATUS.cancelled,
};

const URGENCY_STYLES: Record<string, string> = {
  asap: "bg-[var(--negative)]/10 text-[var(--negative)]",
  scheduled: "bg-[var(--primary-pale)] text-foreground",
  flexible: "bg-[var(--primary-pale)] text-[var(--positive-deep)]",
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
    if (bounty.price_min)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  const feed = isFeedItem(bounty) ? bounty : null;
  const statusStyle = STATUS_STYLES[bounty.status] ?? STATUS_STYLES.cancelled;
  const urgencyStyle = URGENCY_STYLES[bounty.urgency] ?? "bg-muted text-mute";

  return (
    <Link href={`/bounties/${bounty.id}`} className="block h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] bg-background p-6 transition-all duration-200"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(300px circle at var(--mouse-x,50%) var(--mouse-y,50%), var(--primary-pale), transparent 60%)",
          }}
        />

        {bounty.images && bounty.images.length > 0 && (
          <div className="relative mb-4 h-32 w-full overflow-hidden rounded-[16px] bg-secondary">
            <img
              src={bounty.images[0]}
              alt={bounty.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors">
              {bounty.title}
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {bounty.category}
            </p>
            {feed?.poster_name && (
              <p className="mt-0.5 text-xs text-mute">
                {COPY.BOUNTY_CARD.POSTED_BY(feed.poster_name)}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
          >
            {STATUS_LABELS[bounty.status] ?? bounty.status}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {bounty.description || COPY.BOUNTY_CARD.NO_DESCRIPTION}
        </p>

        <div className="mb-4 space-y-1.5">
          {bounty.location_name && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-mute" />
              {bounty.location_name}
            </div>
          )}
          <div className="text-sm font-bold text-primary">{priceDisplay()}</div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${urgencyStyle}`}
            >
              {bounty.urgency}
            </span>
            {bounty.price_negotiable && (
              <span className="rounded-full bg-[var(--primary-pale)] px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-primary">
                {COPY.BOUNTY_FORM.FIELD_NEGOTIABLE}
              </span>
            )}
            {feed?.suggested_price_min != null &&
              feed.suggested_price_max != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-pale)] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <SparklesIcon className="h-3 w-3" />₦
                  {feed.suggested_price_min.toLocaleString("en-NG")}–
                  {feed.suggested_price_max.toLocaleString("en-NG")}
                </span>
              )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-mute">
            <ClockIcon className="h-3 w-3" />
            {formatDistanceToNow(new Date(bounty.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>

        {bounty.slots_available > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-primary">
            <UsersIcon className="h-3.5 w-3.5" />
            {COPY.BOUNTY_CARD.HELPERS_NEEDED(bounty.slots_available)}
          </div>
        )}
      </div>
    </Link>
  );
}
