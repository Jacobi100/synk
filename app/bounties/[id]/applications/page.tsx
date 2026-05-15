"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import type { BountyApplication, ProviderProfile } from "@/lib/types/bounty";

import Link from "next/link";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { COPY } from "@/lib/copy";

type ApplicantProviderProfile = ProviderProfile & {
  trust_badge?: string | null;
  trust_score?: number | null;
};

type AppRow = BountyApplication & {
  provider_profile?: ApplicantProviderProfile | null;
  risk?: {
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    factors: string[];
    recommendation: "accept" | "caution" | "reject";
  } | null;
};

const TRUST_BADGE_LABELS: Record<string, string> = {
  new: COPY.PROVIDER_PROFILE.BADGE_NEW_LABEL,
  active: COPY.PROVIDER_PROFILE.BADGE_ACTIVE_LABEL,
  trusted: COPY.PROVIDER_PROFILE.BADGE_TRUSTED_LABEL,
  community_trusted: COPY.PROVIDER_PROFILE.BADGE_TOP_LABEL,
};

function getTrustBadgeLabel(badge?: string | null) {
  if (!badge) return COPY.PROVIDER_PROFILE.BADGE_NEW_LABEL;
  return TRUST_BADGE_LABELS[badge] ?? COPY.PROVIDER_PROFILE.BADGE_NEW_LABEL;
}

interface ApplicationsPageProps {
  params: { id: string };
}

export default function BountyApplicationsPage({
  params,
}: ApplicationsPageProps) {
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
          throw new Error(data.error || COPY.APPLICATIONS.ERROR_LOAD);
        }
        const data = (await response.json()) as AppRow[];
        setApplications(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : COPY.APPLICATIONS.ERROR_LOAD,
        );
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
      const response = await fetch(
        `/api/bounties/${id}/applications/${appId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || COPY.APPLICATIONS.ERROR_LOAD);
      }
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: "accepted" } : app,
        ),
      );
      router.push(`/bounties/${id}/payment`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : COPY.APPLICATIONS.ERROR_TITLE,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      setActionLoading(appId);
      setActionError(null);
      const response = await fetch(
        `/api/bounties/${id}/applications/${appId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || COPY.APPLICATIONS.ERROR_LOAD);
      }
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: "rejected" } : app,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : COPY.APPLICATIONS.ERROR_TITLE,
      );
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
    `Helper ${app.provider_id.slice(0, 8)}...`;

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="px-4 py-8">
          <p className="text-gray-600">{COPY.MY_APPLICATIONS.SIGN_IN_REQUIRED}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/bounties/${id}`}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          {COPY.BACK_TO_JOB}
        </Link>
        <h1 className="mt-6 mb-2 text-3xl font-bold text-gray-900">
          {COPY.APPLICATIONS.TITLE}
        </h1>
        <p className="mb-8 text-gray-600">{COPY.APPLICATIONS.SUBTITLE}</p>
        {actionError && (
          <div className="mb-6 rounded-[24px] border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{actionError}</p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex gap-4 rounded-[24px] border border-red-200 bg-red-50 p-6">
            <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">
                {COPY.APPLICATIONS.ERROR_TITLE}
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-[24px] border border-gray-200 bg-background p-12 text-center text-gray-600">
            {COPY.APPLICATIONS.EMPTY}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-[24px] border border-gray-200 bg-background p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {providerLabel(app)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {COPY.APPLICATIONS.APPLIED_ON(
                          new Date(app.created_at).toLocaleDateString(),
                        )}
                      </p>
                      {(app.provider_profile?.trust_badge || typeof app.provider_profile?.trust_score === "number") && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold">
                            {getTrustBadgeLabel(app.provider_profile?.trust_badge)}
                          </span>
                          {typeof app.provider_profile?.trust_score === "number" && (
                            <span className="ml-2 text-gray-500">
                              {COPY.PROVIDER_PROFILE.REPUTATION_SCORE}: {app.provider_profile.trust_score}/100
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(app.status)}`}
                  >
                    {COPY.APPLICATION_STATUS[
                      app.status as keyof typeof COPY.APPLICATION_STATUS
                    ] ?? app.status}
                  </span>
                </div>

                {app.proposed_price != null && (
                  <div className="mb-4 rounded-[20px] border border-gray-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {COPY.APPLICATIONS.THEIR_PRICE}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      ₦{Number(app.proposed_price).toLocaleString()}
                    </p>
                  </div>
                )}
                {app.risk && (
                  <div
                    className={`mb-4 rounded-[24px] border p-4 ${
                      app.risk.riskLevel === "low"
                        ? "bg-emerald-50/50 border-emerald-100"
                        : app.risk.riskLevel === "medium"
                          ? "bg-amber-50/50 border-amber-100"
                          : "bg-rose-50/50 border-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            app.risk.riskLevel === "low"
                              ? "bg-emerald-500"
                              : app.risk.riskLevel === "medium"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            app.risk.riskLevel === "low"
                              ? "text-emerald-700"
                              : app.risk.riskLevel === "medium"
                                ? "text-amber-700"
                                : "text-rose-700"
                          }`}
                        >
                          {app.risk.riskLevel === "low"
                            ? COPY.RISK.LOW
                            : app.risk.riskLevel === "medium"
                              ? COPY.RISK.MEDIUM
                              : COPY.RISK.HIGH}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          app.risk.recommendation === "accept"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.risk.recommendation === "caution"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {app.risk.recommendation === "accept"
                          ? COPY.RISK.RECOMMEND
                          : app.risk.recommendation === "caution"
                            ? COPY.RISK.CAUTION
                            : COPY.RISK.NOT_RECOMM}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {app.risk.factors.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[13px] leading-tight text-gray-700"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-mono text-gray-400">
                        {COPY.RISK.SAFETY_SCORE(100 - app.risk.riskScore)}
                      </span>
                    </div>
                  </div>
                )}
                {app.status === "pending" && (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => void handleAccept(app.id)}
                      disabled={actionLoading === app.id}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                          {COPY.APPLICATIONS.ACCEPTING}
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-2 h-4 w-4" />
                          {COPY.APPLICATIONS.ACCEPT}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => void handleReject(app.id)}
                      disabled={actionLoading === app.id}
                      variant="outline"
                    >
                      {actionLoading === app.id ? (
                        <>
                          <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                          {COPY.APPLICATIONS.DECLINING}
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
