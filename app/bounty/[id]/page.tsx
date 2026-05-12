"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Share2,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BountyDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BountyDetailsPage({ params }: BountyDetailsPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnBounty, setIsOwnBounty] = useState(false);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}`);
        if (!response.ok) throw new Error("Failed to fetch bounty");

        const data = await response.json();
        setBounty(data);

        // Check if current user is the poster
        if (user) {
          const checkOwnership = await fetch(
            `/api/bounties/${id}/check-ownership`,
          );
          if (checkOwnership.ok) {
            const { isOwner } = await checkOwnership.json();
            setIsOwnBounty(isOwner);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };
    fetchBounty();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error || "Bounty not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <Link
            href="/bounty/browse"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Bounties
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {/* Title and Status */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {bounty.title}
                  </h1>
                  <p className="text-gray-600">{bounty.category}</p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    bounty.status,
                  )}`}
                >
                  {bounty.status === "in_progress"
                    ? "In Progress"
                    : bounty.status.charAt(0).toUpperCase() +
                      bounty.status.slice(1)}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {bounty.description || "No description provided"}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {/* Location */}
                {bounty.location_name && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {bounty.location_name}
                    </p>
                    {bounty.radius_km > 1 && (
                      <p className="text-sm text-gray-600">
                        Up to {bounty.radius_km}km
                      </p>
                    )}
                  </div>
                )}

                {/* Urgency */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-4 h-4 mr-2" />
                    Urgency
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${getUrgencyColor(
                      bounty.urgency,
                    )}`}
                  >
                    {bounty.urgency.charAt(0).toUpperCase() +
                      bounty.urgency.slice(1)}
                  </div>
                </div>

                {/* Deadline */}
                {bounty.deadline && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Deadline
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Available Slots */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Available Slots
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {bounty.slots_available}
                  </p>
                </div>
              </div>

              {/* Posted Info */}
              <div className="border-t border-gray-200 pt-6 text-sm text-gray-600">
                Posted{" "}
                {formatDistanceToNow(new Date(bounty.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
              <div className="flex items-center text-blue-100 mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                Estimated Budget
              </div>
              <h3 className="text-3xl font-bold mb-3">{priceDisplay()}</h3>
              {bounty.price_negotiable && (
                <p className="text-blue-100 text-sm">Price negotiable</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isOwnBounty}
                title={isOwnBounty ? "You cannot apply to your own bounty" : ""}
              >
                {isOwnBounty ? "You Posted This Bounty" : "Apply for Bounty"}
              </Button>
              <Button variant="outline" className="w-full h-10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Info Cards */}
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Payment</h4>
                <p className="text-sm text-gray-600">
                  Escrow protection for both parties
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">About This</h4>
                <p className="text-sm text-gray-600">
                  {bounty.slots_available} professional(s) can be selected for
                  this bounty
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
