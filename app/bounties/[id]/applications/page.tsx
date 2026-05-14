"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import type { BountyApplication, ProviderProfile } from "@/lib/types/bounty";

import Link from "next/link";
import { ArrowPathIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, UserIcon, PhoneIcon, CreditCardIcon, BuildingOffice2Icon, XCircleIcon } from "@heroicons/react/24/outline";
import { COPY } from "@/lib/copy";


type AppRow = BountyApplication & { 
  provider_profile?: ProviderProfile | null;
  risk?: {
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    factors: string[];
    recommendation: "accept" | "caution" | "reject";
  } | null;
};

interface ApplicationsPageProps {
  params: Promise<{ id: string }>;
}

export default function BountyApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();
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
          {COPY.BACK_TO_JOB}
        </Link>
        <h1 className="mt-6 mb-2 text-3xl font-bold text-gray-900">{COPY.APPLICATIONS.TITLE}</h1>
        <p className="mb-8 text-gray-600">{COPY.APPLICATIONS.SUBTITLE}</p>
        {actionError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{actionError}</p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">{COPY.APPLICATIONS.ERROR_TITLE}</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">
            {COPY.APPLICATIONS.EMPTY}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{providerLabel(app)}</h3>
                      <p className="text-sm text-gray-600">{COPY.APPLICATIONS.APPLIED_ON(new Date(app.created_at).toLocaleDateString())}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(app.status)}`}>
                    {COPY.APPLICATION_STATUS[app.status as keyof typeof COPY.APPLICATION_STATUS] ?? app.status}
                  </span>
                </div>

                {/* Risk Assessment */}
                {app.risk && (
                  <div className={`mb-6 rounded-xl border p-4 ${
                    app.risk.riskLevel === 'low' ? 'bg-emerald-50/50 border-emerald-100' :
                    app.risk.riskLevel === 'medium' ? 'bg-amber-50/50 border-amber-100' :
                    'bg-rose-50/50 border-rose-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          app.risk.riskLevel === 'low' ? 'bg-emerald-500' :
                          app.risk.riskLevel === 'medium' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          app.risk.riskLevel === 'low' ? 'text-emerald-700' :
                          app.risk.riskLevel === 'medium' ? 'text-amber-700' :
                          'text-rose-700'
                        }`}>
                          {app.risk.riskLevel} Risk Assessment
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">SCORE: {100 - app.risk.riskScore}/100</span>
                    </div>
                    <ul className="space-y-1.5">
                      {app.risk.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] leading-tight text-gray-700">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {app.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => void handleAccept(app.id)}
                      disabled={actionLoading === app.id}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                                Accepting…
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-2 h-4 w-4" />
                          {COPY.APPLICATIONS.ACCEPT}
                        </>
                      )}
                    </Button>
                    <Button onClick={() => void handleReject(app.id)} disabled={actionLoading === app.id} variant="outline">
                      {actionLoading === app.id ? (
                        <>
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting…
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="mr-2 h-4 w-4" />
                          {COPY.APPLICATIONS.DECLINE}
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
