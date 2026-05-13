"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CompletePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BountyCompletePage({ params }: CompletePageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch bounty");
        }

        const data = await response.json();
        setBounty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBounty();
    }
  }, [user, id]);

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      setError(null);

      const response = await fetch(`/api/bounties/${id}/mark-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark bounty as complete");
      }

      setCompleted(true);
      setTimeout(() => {
        window.location.href = `/`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCompleting(false);
    }
  };

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

  if (error && !completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Bounty Completed!
            </h2>
            <p className="text-green-700 mb-6">
              Payment has been released to the provider. You can now rate each
              other.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">Bounty not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/bounty/${id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mark Bounty as Complete
        </h1>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Completion Summary */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Bounty Details
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Bounty</span>
                <span className="font-medium text-gray-900">
                  {bounty.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-gray-900">
                  {bounty.status === "paid"
                    ? "Paid (escrow)"
                    : bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium text-gray-900">Assigned provider</span>
              </div>
            </div>
          </div>

          {/* Completion Checklist */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Before marking complete, confirm:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  The service has been completed to your satisfaction
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  You've communicated with the provider about the final result
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Payment will be released immediately after confirmation
                </span>
              </li>
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Marking this bounty as complete will
              release the escrow payment to the provider. You won't be able to
              undo this action.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleMarkComplete}
              disabled={completing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {completing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="h-12">
              <Link href={`/bounty/${id}`}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
