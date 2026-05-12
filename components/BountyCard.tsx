"use client";

import Link from "next/link";
import { Bounty } from "@/lib/types/bounty";
import { MapPin, DollarSign, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BountyCardProps {
  bounty: Bounty;
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
    if (bounty.price_min)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition p-6 cursor-pointer h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-blue-600">
              {bounty.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{bounty.category}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(bounty.status)}`}
          >
            {bounty.status === "in_progress"
              ? "In Progress"
              : bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {bounty.description || "No description provided"}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          {bounty.location_name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {bounty.location_name}
            </div>
          )}
          <div className="flex items-center text-sm font-semibold text-gray-900">
            <DollarSign className="w-4 h-4 mr-2" />
            {priceDisplay()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(bounty.urgency)}`}
            >
              {bounty.urgency.charAt(0).toUpperCase() + bounty.urgency.slice(1)}
            </span>
            {bounty.price_negotiable && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Negotiable
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {formatDistanceToNow(new Date(bounty.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>

        {/* Available Slots */}
        {bounty.slots_available > 0 && (
          <div className="mt-3 text-xs text-green-700 font-medium">
            {bounty.slots_available}{" "}
            {bounty.slots_available === 1 ? "slot" : "slots"} available
          </div>
        )}
      </div>
    </Link>
  );
}
