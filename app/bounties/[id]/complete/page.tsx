"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CompletePageProps {
  params: Promise<{ id: string }>;
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
        if (!response.ok) throw new Error("Failed to fetch bounty");
        setBounty(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };
    if (user) void fetchBounty();
  }, [user, id]);

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      setError(null);
      const response = await fetch("/api/bounties/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to complete bounty");
      setCompleted(true);
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold text-green-900">Bounty completed</h2>
            <p className="mb-6 text-green-700">Payout was sent to the provider via Squad Transfer.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard">Back to feed</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-gray-600">Bounty not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/bounties/${id}`} className="font-medium text-blue-600 hover:text-blue-700">
          ← Back
        </Link>
        <h1 className="mt-6 mb-8 text-3xl font-bold text-gray-900">Mark bounty complete</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="mb-8 space-y-4 border-b border-gray-200 pb-8">
            <div className="flex justify-between">
              <span className="text-gray-600">Bounty</span>
              <span className="font-medium text-gray-900">{bounty.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-gray-900 capitalize">{bounty.status.replace("_", " ")}</span>
            </div>
          </div>
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-900">
              This triggers a Squad Transfer to the provider&apos;s bank on file (minus the 5% platform fee).
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => void handleMarkComplete()}
              disabled={completing || bounty.status !== "paid"}
              className="h-12 flex-1 bg-green-600 hover:bg-green-700"
            >
              {completing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark complete & pay provider
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="h-12">
              <Link href={`/bounties/${id}`}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
