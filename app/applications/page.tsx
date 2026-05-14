"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { BountyApplication, Bounty, ProviderProfile } from "@/lib/types/bounty";
import Link from "next/link";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIconIcon,
  XCircleIconIcon,
  PhoneIconIcon,
  ArrowLeftIconIcon,
  InboxIconIcon,
} from "@heroicons/react/24/outline";

interface ApplicationWithDetails extends BountyApplication {
  bounty?: Bounty;
  provider_profile?: ProviderProfile | null;
  poster_phone?: string | null;
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700 border-amber-200",   label: "Pending" },
  accepted:  { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Accepted" },
  rejected:  { cls: "bg-red-50 text-red-700 border-red-200",         label: "Rejected" },
  withdrawn: { cls: "bg-neutral-100 text-neutral-500 border-neutral-200", label: "Withdrawn" },
};

export default function MyApplicationsPage() {
  const { user } = useUser();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [role, setRole] = useState<"poster" | "provider">("provider");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/applications?role=${role}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to fetch");
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void fetchApplications();
  }, [user, role]);

  const handleAccept = async (appId: string) => {
    const bountyId = applications.find((a) => a.id === appId)?.bounty_id;
    if (!bountyId) return;
    try {
      setActionLoading(appId);
      setActionError(null);
      const res = await fetch(`/api/bounties/${bountyId}/applications/${appId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setApplications((prev) =>
        prev.map((a) => {
          if (a.id === appId) return { ...a, status: "accepted" };
          if (a.bounty_id === bountyId && a.status === "pending") return { ...a, status: "rejected" };
          return a;
        })
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string) => {
    const bountyId = applications.find((a) => a.id === appId)?.bounty_id;
    if (!bountyId) return;
    try {
      setActionLoading(appId);
      setActionError(null);
      const res = await fetch(`/api/bounties/${bountyId}/applications/${appId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: "rejected" } : a)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text2)" }}>Sign in to view your applications.</p>
        </div>
      </div>
    );
  }

  const isPosterView = role === "poster";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Link>

        {/* Header + tab switcher */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
            >
              {isPosterView ? "Applications Received" : "My Applications"}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>
              {isPosterView
                ? "Review submissions from providers."
                : "Track bounties you have applied to."}
            </p>
          </div>

          {/* Segmented control */}
          <div
            className="inline-flex rounded-lg border p-0.5"
            style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
          >
            {(["poster", "provider"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  background: role === r ? "var(--violet)" : "transparent",
                  color: role === r ? "#fff" : "var(--text2)",
                  boxShadow: role === r ? "var(--shadow-violet)" : "none",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div
            className="mb-4 rounded-xl border p-4 text-sm"
            style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
          >
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--violet)" }} />
          </div>
        ) : error ? (
          <div
            className="rounded-xl border p-6 flex items-start gap-4"
            style={{ background: "#fef2f2", borderColor: "#fecaca" }}
          >
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <p className="text-sm" style={{ color: "#991b1b" }}>{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <InboxIcon className="mb-4 h-12 w-12 opacity-20" style={{ color: "var(--text)" }} />
            <h3 className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
              No applications yet
            </h3>
            <p className="mb-5 text-sm" style={{ color: "var(--text2)" }}>
              {isPosterView
                ? "Applications to your bounties will appear here."
                : "Browse bounties and apply to start earning."}
            </p>
            {!isPosterView && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
              >
                Browse bounties
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, i) => {
              const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.withdrawn;
              return (
                <div
                  key={app.id}
                  className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md animate-step-in"
                  style={{ borderColor: "var(--border)", animationDelay: `${i * 40}ms` }}
                >
                  {isPosterView && app.provider_profile ? (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                            {app.bounty?.title || `Bounty ${app.bounty_id.slice(0, 8)}…`}
                          </h3>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--text3)" }}>
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>

                          {/* Provider info box */}
                          <div
                            className="mt-3 rounded-lg border p-3 text-sm space-y-1"
                            style={{ background: "var(--violet-subtle)", borderColor: "rgba(94,58,255,0.3)" }}
                          >
                            <p className="font-semibold text-xs" style={{ color: "var(--violet)" }}>
                              Provider
                            </p>
                            <p style={{ color: "var(--text2)" }}>
                              ID: {app.provider_id.slice(0, 8)}…
                            </p>
                            {app.provider_profile.username && (
                              <p style={{ color: "var(--text2)" }}>
                                @{app.provider_profile.username}
                              </p>
                            )}
                            {app.status === "accepted" && app.provider_profile?.phone_number ? (
                              <p className="font-semibold" style={{ color: "var(--text)" }}>
                                📞 {app.provider_profile.phone_number}
                              </p>
                            ) : app.status === "pending" ? (
                              <p className="italic text-xs" style={{ color: "var(--text3)" }}>
                                PhoneIcon shown after acceptance
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      {app.status === "pending" && (
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => void handleAccept(app.id)}
                            disabled={actionLoading === app.id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                            style={{ background: "var(--success-color)" }}
                          >
                            {actionLoading === app.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => void handleReject(app.id)}
                            disabled={actionLoading === app.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                            style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {app.status === "accepted" && app.provider_profile?.phone_number && (
                        <div className="mt-4 rounded-lg border p-4" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                          <p className="mb-2 text-xs font-semibold" style={{ color: "#166534" }}>Call your provider</p>
                          <a
                            href={`tel:${app.provider_profile.phone_number}`}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-green-100"
                            style={{ borderColor: "#86efac", color: "#15803d" }}
                          >
                            <PhoneIcon className="h-4 w-4" />
                            {app.provider_profile.phone_number}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                            {app.bounty?.title || `Bounty ${app.bounty_id.slice(0, 8)}…`}
                          </h3>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--text3)" }}>
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <Link
                          href={`/bounties/${app.bounty_id}`}
                          className="inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:border-[var(--violet)] hover:text-[var(--violet)]"
                          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
                        >
                          View bounty
                        </Link>
                        {app.status === "accepted" && app.poster_phone && (
                          <a
                            href={`tel:${app.poster_phone}`}
                            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-green-50"
                            style={{ borderColor: "#86efac", color: "#15803d", background: "#f0fdf4" }}
                          >
                            <PhoneIcon className="h-4 w-4" />
                            Call poster
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
