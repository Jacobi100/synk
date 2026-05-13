"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import type { BountyApplication, ProviderProfile } from "@/lib/types/bounty";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle, XCircle, User } from "lucide-react";

type AppRow = BountyApplication & { provider_profile?: ProviderProfile | null };

interface ApplicationsPageProps {
  params: Promise<{ id: string }>;
}

export default function BountyApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const [applications, setApplications] = useState<AppRow[]>([]);
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
        const data = (await response.json()) as AppRow[];
        setApplications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    if (user) void fetchApplications();
  }, [user, id]);

  const handleAccept = async (appId: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);
      const response = await fetch(`/api/bounties/${id}/applications/${appId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept application");
      }
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: "accepted" } : app)));
      router.push(`/bounties/${id}/payment`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);
      const response = await fetch(`/api/bounties/${id}/applications/${appId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject application");
      }
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: "rejected" } : app)));
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

  const providerLabel = (app: AppRow) =>
    app.provider_profile?.full_name?.trim() ||
    app.provider_profile?.username?.trim() ||
    `Provider ${app.provider_id.slice(0, 8)}…`;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="px-4 py-8">
          <p className="text-gray-600">Please sign in to view applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/bounties/${id}`} className="font-medium text-blue-600 hover:text-blue-700">
          ← Back to bounty
        </Link>
        <h1 className="mt-6 mb-2 text-3xl font-bold text-gray-900">Applications</h1>
        <p className="mb-8 text-gray-600">Review providers who applied to this bounty.</p>
        {actionError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{actionError}</p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">
            No applications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{providerLabel(app)}</h3>
                      <p className="text-sm text-gray-600">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => void handleAccept(app.id)}
                      disabled={actionLoading === app.id}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button onClick={() => void handleReject(app.id)} disabled={actionLoading === app.id} variant="outline">
                      {actionLoading === app.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting…
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
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
