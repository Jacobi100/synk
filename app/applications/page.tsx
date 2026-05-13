"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { BountyApplication, Bounty, ProviderProfile } from "@/lib/types/bounty";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
} from "lucide-react";

interface ApplicationWithDetails extends BountyApplication {
  bounty?: Bounty;
  provider_profile?: ProviderProfile | null;
  poster_phone?: string | null;
}

export default function MyApplicationsPage() {
  const { user } = useUser();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [role, setRole] = useState<'poster' | 'provider'>('provider');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/applications?role=${role}`);

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof data?.error === "string" ? data.error : "Failed to fetch applications",
          );
        }

        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load applications",
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user, role]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "withdrawn":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Withdrawn
          </span>
        );
      default:
        return null;
    }
  };

  const handleAccept = async (appId: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);

      const response = await fetch(
        `/api/bounties/${applications.find((app) => app.id === appId)?.bounty_id}/applications/${appId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept application");
      }

      setApplications((prev) => {
        const acceptedApp = prev.find((app) => app.id === appId);
        if (!acceptedApp) return prev;

        return prev.map((app) => {
          if (app.id === appId) {
            return { ...app, status: "accepted" };
          }
          if (app.bounty_id === acceptedApp.bounty_id && app.status === "pending") {
            return {
              ...app,
              status: "rejected",
            };
          }
          return app;
        });
      });
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
        `/api/bounties/${applications.find((app) => app.id === appId)?.bounty_id}/applications/${appId}/reject`,
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
        prev.map((app) => (app.id === appId ? { ...app, status: "rejected" } : app)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-gray-600">
            Please sign in to view your applications.
          </p>
        </div>
      </div>
    );
  }

  const isPosterView = role === 'poster';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isPosterView ? 'Applications Received' : 'My Applications'}
            </h1>
            <p className="text-gray-600">
              {isPosterView
                ? 'Review applications submitted to your bounties.'
                : 'Track all bounties you have applied to.'}
            </p>
          </div>
          <div className="inline-flex rounded-md bg-white shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => setRole('poster')}
              className={`px-4 py-2 text-sm font-medium transition ${
                isPosterView
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Poster
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`px-4 py-2 text-sm font-medium transition ${
                !isPosterView
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Provider
            </button>
          </div>
        </div>

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
              {isPosterView ? 'No applications yet' : 'No applications yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isPosterView
                ? 'Applications from providers will appear here. If you meant jobs you applied to, switch to Provider.'
                : 'Browse bounties and apply to start earning.'}
            </p>
            {!isPosterView && (
              <Button asChild>
                <Link href="/dashboard">Browse Bounties</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                {isPosterView && app.provider_profile ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Bounty: {app.bounty?.title || `ID: ${app.bounty_id.slice(0, 8)}...`}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Provider Profile
                          </p>
                          <div className="space-y-1 text-sm text-gray-700">
                            <p>
                              <strong>ID:</strong> {app.provider_id.slice(0, 8)}...
                            </p>
                            {app.status === "accepted" && app.provider_profile?.phone_number && (
                              <p>
                                <strong>Phone:</strong> {app.provider_profile.phone_number}
                              </p>
                            )}
                            {app.status === "pending" && (
                              <p className="text-gray-600 italic">Provider phone is shown after you accept.</p>
                            )}
                            {app.provider_profile.username && (
                              <p>
                                <strong>Username:</strong> {app.provider_profile.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    {app.status === 'pending' && (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAccept(app.id)}
                            disabled={actionLoading === app.id}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === app.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept Application
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
                      </div>
                    )}
                    {app.status === 'accepted' && app.provider_profile?.phone_number && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-semibold text-green-900 mb-2">Call your provider</p>
                        <Button asChild variant="outline" className="border-green-300 hover:bg-green-100">
                          <a href={`tel:${app.provider_profile.phone_number}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            {app.provider_profile.phone_number}
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {app.bounty?.title || `Bounty: ${app.bounty_id.slice(0, 8)}...`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <Button asChild variant="outline">
                        <Link href={`/bounties/${app.bounty_id}`}>View Bounty</Link>
                      </Button>
                      {app.status === "accepted" && app.poster_phone && (
                        <Button asChild variant="outline" className="border-green-300 bg-green-50 hover:bg-green-100">
                          <a href={`tel:${app.poster_phone}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call poster
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
