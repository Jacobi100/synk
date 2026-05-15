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
    aiConfidence: number;
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
  params: Promise<{ id: string }>;
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
    <div className="min-h-screen bg-secondary font-sans">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/bounties/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← {COPY.BACK_TO_JOB}
        </Link>
        <h1 className="mt-6 mb-1 text-3xl font-bold text-gray-900 tracking-tight">
          {COPY.APPLICATIONS.TITLE}
        </h1>
        <p className="mb-8 text-sm text-slate-500">{COPY.APPLICATIONS.SUBTITLE}</p>

        {actionError && (
          <div className="mb-6 rounded-[24px] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-800">{actionError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-400">Analyzing applications…</p>
          </div>
        ) : error ? (
          <div className="flex gap-4 rounded-[24px] border border-rose-200 bg-rose-50 p-6">
            <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
            <div>
              <h3 className="font-semibold text-rose-900">
                {COPY.APPLICATIONS.ERROR_TITLE}
              </h3>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-background/50 p-16 text-center">
            <p className="text-slate-400 font-medium">{COPY.APPLICATIONS.EMPTY}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="group relative rounded-[32px] border border-slate-200 bg-background p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
                       <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary to-primary-deep text-white">
                        <UserIcon className="h-7 w-7" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {providerLabel(app)}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </span>
                        {(app.provider_profile?.trust_badge || typeof app.provider_profile?.trust_score === "number") && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className="inline-flex items-center rounded-full bg-slate-50 border px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              {getTrustBadgeLabel(app.provider_profile?.trust_badge)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}
                  >
                    {COPY.APPLICATION_STATUS[
                      app.status as keyof typeof COPY.APPLICATION_STATUS
                    ] ?? app.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   {/* Proposed Price */}
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {COPY.APPLICATIONS.THEIR_PRICE || "Proposed Amount"}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      ₦{Number(app.proposed_price || app.amount).toLocaleString()}
                    </p>
                  </div>

                  {/* AI Intelligence Layer */}
                  {app.risk && (
                    <div className="relative overflow-hidden rounded-[24px] border p-5 transition-all shadow-xs"
                      style={{
                        borderColor: app.risk.riskLevel === "low" ? "#bbf7d0" : app.risk.riskLevel === "medium" ? "#fef3c7" : "#fecaca",
                        background: app.risk.riskLevel === "low" ? "#f0fdf4" : app.risk.riskLevel === "medium" ? "#fffbeb" : "#fef2f2",
                      }}
                    >
                      {/* AI Glow Badge */}
                      <div className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black tracking-tighter uppercase text-white"
                        style={{ background: app.risk.riskLevel === "low" ? "var(--positive)" : app.risk.riskLevel === "medium" ? "var(--info)" : "var(--negative)" }}
                      >
                        AI INSIGHT
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          AI Intelligence Analysis
                        </span>
                      </div>

                      {/* Confidence Meter */}
                      <div className="mb-4">
                        <div className="flex justify-between items-end mb-1.5">
                           <span className="text-xs font-bold text-slate-700">Confidence Score</span>
                           <span className="text-xs font-black" style={{ color: app.risk.riskLevel === "low" ? "var(--positive-deep)" : app.risk.riskLevel === "medium" ? "#b45309" : "#b91c1c" }}>
                             {app.risk.aiConfidence}%
                           </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${app.risk.aiConfidence}%`,
                              background: app.risk.riskLevel === "low" ? "var(--positive)" : app.risk.riskLevel === "medium" ? "var(--info)" : "var(--negative)",
                              boxShadow: `0 0 12px ${app.risk.riskLevel === "low" ? "rgba(34,197,94,0.4)" : app.risk.riskLevel === "medium" ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)"}`
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {app.risk.factors.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircleIcon className="h-3 w-3 shrink-0" style={{ color: app.risk.riskLevel === "low" ? "var(--positive)" : "var(--mute)" }} />
                            <span className="text-xs font-medium text-slate-700 leading-tight">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/50">
                        <p className="text-[11px] font-bold uppercase tracking-tight"
                          style={{ color: app.risk.riskLevel === "low" ? "var(--positive-deep)" : app.risk.riskLevel === "medium" ? "#b45309" : "#b91c1c" }}
                        >
                          {app.risk.recommendation === "accept" 
                            ? (COPY.RISK?.RECOMMEND || "✓ System Recommended") 
                            : app.risk.recommendation === "caution" 
                              ? (COPY.RISK?.CAUTION || "⚠ Verification Recommended") 
                              : (COPY.RISK?.NOT_RECOMM || "✗ Not Recommended")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

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
