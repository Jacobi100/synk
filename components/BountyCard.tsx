"use client";

import Link from "next/link";
import type { Bounty, BountyFeedItem } from "@/lib/types/bounty";
import { MapPin, Clock, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BountyCardProps {
  bounty: Bounty | BountyFeedItem;
}

function isFeedItem(b: Bounty | BountyFeedItem): b is BountyFeedItem {
  return "poster_name" in b || "suggested_price_min" in b;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "asap":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "flexible":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-indigo-100 text-indigo-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const priceDisplay = () => {
    if (!bounty.price_min && !bounty.price_max) return "Contact for price";
    if (bounty.price_min && bounty.price_max) {
      return `${bounty.currency} ${bounty.price_min.toLocaleString()} - ${bounty.price_max.toLocaleString()}`;
    }
    if (bounty.price_min) return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  const feed = isFeedItem(bounty) ? bounty : null;

  return (
    <Link href={`/bounties/${bounty.id}`}>
      <div className="flex h-full cursor-pointer flex-col rounded-lg border border-gray-200 bg-white p-6 transition hover:border-blue-400 hover:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 hover:text-blue-600">{bounty.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{bounty.category}</p>
            {feed?.poster_name && <p className="mt-1 text-xs text-gray-500">by {feed.poster_name}</p>}
          </div>
          <div
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(bounty.status)}`}
          >
            {bounty.status === "in_progress"
              ? "In progress"
              : bounty.status === "paid"
                ? "Paid"
                : bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{bounty.description || "No description provided"}</p>

        <div className="mb-4 space-y-2">
          {bounty.location_name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              {bounty.location_name}
            </div>
          )}
          <div className="text-sm font-semibold text-gray-900">{priceDisplay()}</div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded px-2 py-1 text-xs font-medium ${getUrgencyColor(bounty.urgency)}`}>
              {bounty.urgency.charAt(0).toUpperCase() + bounty.urgency.slice(1)}
            </span>
            {bounty.price_negotiable && (
              <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">Negotiable</span>
            )}
            {feed?.suggested_price_min != null && feed.suggested_price_max != null && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-1 text-xs font-medium text-violet-900">
                <Sparkles className="h-3 w-3" />
                Suggested ₦{feed.suggested_price_min.toLocaleString("en-NG")}–
                {feed.suggested_price_max.toLocaleString("en-NG")}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="mr-1 h-3 w-3" />
            {formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}
          </div>
        </div>

        {bounty.slots_available > 0 && (
          <div className="mt-3 text-xs font-medium text-green-700">
            {bounty.slots_available} {bounty.slots_available === 1 ? "slot" : "slots"} available
          </div>
        )}
      </div>
    </Link>
  );
}
