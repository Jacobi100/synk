"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { BountyApplication } from "@/lib/types/bounty";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";

interface ApplicationsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BountyApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [applications, setApplications] = useState<BountyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}/applications`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch applications");
        }

        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user, id]);

  const handleAccept = async (appId: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);

      const response = await fetch(
        `/api/bounties/${id}/applications/${appId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept application");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: "accepted" } : app
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string, reason?: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);

      const response = await fetch(
        `/api/bounties/${id}/applications/${appId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject application");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: "rejected" } : app
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-gray-600">Please sign in to view applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/bounty/${id}`} className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Bounty
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
        <p className="text-gray-600 mb-8">Review and manage applications for this bounty</p>

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{actionError}</p>
          </div>
        )}

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
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No applications yet
            </h3>
            <p className="text-gray-600">
              Applications will appear here when providers apply to your bounty
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Provider {app.provider_id.slice(0, 8)}...
                      </h3>
                      <p className="text-sm text-gray-600">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      app.status
                    )}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAccept(app.id)}
                      disabled={actionLoading === app.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(app.id)}
                      disabled={actionLoading === app.id}
                      variant="outline"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
