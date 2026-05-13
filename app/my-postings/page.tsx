"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";

export default function MyPostingsPage() {
  const { user } = useUser();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/bounties?mine=true");

        if (!response.ok) {
          throw new Error("Failed to fetch bounties");
        }

        const data = await response.json();
        setBounties(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bounties",
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBounties();
    }
  }, [user]);

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

  const priceDisplay = (bounty: Bounty) => {
    if (!bounty.price_min && !bounty.price_max) return "Contact for price";
    if (bounty.price_min && bounty.price_max) {
      return `${bounty.currency} ${bounty.price_min.toLocaleString()} - ${bounty.price_max.toLocaleString()}`;
    }
    if (bounty.price_min)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-gray-600">
            Please sign in to view your postings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Posted Bounties
            </h1>
            <p className="text-gray-600">
              Manage and track all your posted bounties
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/bounties/create">Create New Bounty</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bounties posted yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first bounty to start receiving applications
            </p>
            <Button asChild>
              <Link href="/bounties/create">Create Bounty</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bounties.map((bounty) => (
              <div
                key={bounty.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {bounty.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          bounty.status,
                        )}`}
                      >
                        {bounty.status === "in_progress"
                          ? "In Progress"
                          : bounty.status.charAt(0).toUpperCase() +
                            bounty.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {bounty.description?.substring(0, 100)}
                      {bounty.description && bounty.description.length > 100
                        ? "..."
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 mb-1">
                      {priceDisplay(bounty)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(
                        bounty.urgency,
                      )}`}
                    >
                      {bounty.urgency.charAt(0).toUpperCase() +
                        bounty.urgency.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 py-3 border-t border-b border-gray-200">
                  {bounty.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {bounty.location_name}
                      </span>
                    </div>
                  )}
                  {bounty.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(bounty.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {bounty.slots_available} slot
                      {bounty.slots_available !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/bounties/${bounty.id}`}>View Details</Link>
                  </Button>
                  {bounty.status === "open" && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href={`/bounties/${bounty.id}/applications`}>
                        View Applications
                      </Link>
                    </Button>
                  )}
                  {bounty.status === "in_progress" && (
                    <>
                      <Button asChild variant="outline">
                        <Link href={`/bounties/${bounty.id}/payment`}>
                          View Payment
                        </Link>
                      </Button>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/bounties/${bounty.id}/complete`}>
                          Mark Complete
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
