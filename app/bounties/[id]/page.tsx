
"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import {
  MapPinIconIcon,
  CalendarDaysIconDaysIcon,
  ClockIconIcon,
  ShareIcon,
  BriefcaseIconIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowLeftIconIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import NavigationMap from "@/components/map/NavigationMap";

type BountyDetail = Bounty & { poster_phone?: string | null; provider_phone?: string | null };

interface BountyDetailsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-emerald-50  text-emerald-700  border-emerald-200",
  in_progress: "bg-amber-50    text-amber-700    border-amber-200",
  paid:        "bg-violet-50   text-violet-700   border-violet-200",
  completed:   "bg-blue-50     text-blue-700     border-blue-200",
  cancelled:   "bg-neutral-100 text-neutral-500  border-neutral-200",
};

const STATUS_LABELS = COPY.STATUS;

const URGENCY_STYLES: Record<string, string> = {
  asap:      "bg-red-50   text-red-700   border-red-100",
  scheduled: "bg-sky-50   text-sky-700   border-sky-100",
  flexible:  "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function BountyDetailsPage({ params }: BountyDetailsPageProps) {
  const { id }   = use(params);
  const { user } = useUser();

  const [bounty, setBounty]         = useState<BountyDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isOwnBounty, setIsOwnBounty] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError]   = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}`);
        if (!response.ok) throw new Error("Failed to fetch bounty");
        const data = await response.json();
        setBounty(data);
        if (user) {
          const check = await fetch(`/api/bounties/${id}/check-ownership`);
          if (check.ok) {
            const { isOwner } = await check.json();
            setIsOwnBounty(isOwner);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };
    fetchBounty();
  }, [id, user]);

  const handleApply = async () => {
    if (!user) { setApplyError(COPY.JOB_DETAIL.SIGN_IN_TO_APPLY); return; }
    try {
      setApplyLoading(true);
      setApplyError(null);
      const response = await fetch("/api/bounties/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bountyId: id }),
      });
      const data = await response.json();
      if (!response.ok) { setApplyError(data.error || COPY.JOB_DETAIL.APPLY_ERROR_GENERIC); return; }
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 5000);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--violet)" }} />
          <p className="text-sm" style={{ color: "var(--text3)" }}>Loading bounty…</p>
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div
            className="rounded-xl border p-6 flex items-start gap-4"
            style={{ background: "#fef2f2", borderColor: "#fecaca" }}
          >
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <div>
              <h3 className="font-semibold" style={{ color: "#7f1d1d" }}>Error loading bounty</h3>
              <p className="text-sm mt-0.5" style={{ color: "#991b1b" }}>{error || "Bounty not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priceDisplay = () => {
    if (!bounty.price_min && !bounty.price_max) return "Contact for price";
    if (bounty.price_min && bounty.price_max)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()} – ${bounty.price_max.toLocaleString()}`;
    if (bounty.price_min) return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  const statusStyle  = STATUS_STYLES[bounty.status]  ?? STATUS_STYLES.cancelled;
  const urgencyStyle = URGENCY_STYLES[bounty.urgency] ?? "bg-neutral-100 text-neutral-500 border-neutral-200";

  // Show navigation map to the accepted provider only
  const isAcceptedProvider =
    !isOwnBounty &&
    (bounty.status === "in_progress" || bounty.status === "paid") &&
    bounty.latitude != null &&
    bounty.longitude != null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div
              className="rounded-xl border bg-white p-7"
              style={{ borderColor: "var(--border)", boxShadow: "var(--synk-shadow)" }}
            >
              {/* Title + status */}
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
                  >
                    {bounty.title}
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>{bounty.category}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                  {STATUS_LABELS[bounty.status] ?? bounty.status}
                </span>
              </div>

              <div className="glow-divider mb-5" />

              {/* Description */}
              <div className="mb-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text3)" }}>
                  {COPY.JOB_DETAIL.DESCRIPTION_TITLE}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                  {bounty.description || COPY.NO_DESCRIPTION}
                </p>
              </div>

              {/* Detail grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {bounty.location_name && (
                  <div
                    className="rounded-lg border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--text3)" }}>
                      <MapPinIcon className="h-3.5 w-3.5" /> {COPY.LOCATION}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {bounty.location_name}
                    </p>
                    {bounty.radius_km > 1 && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text2)" }}>
                        Up to {bounty.radius_km} km
                      </p>
                    )}
                  </div>
                )}

                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--text3)" }}>
                      <ClockIcon className="h-3.5 w-3.5" /> {COPY.URGENCY_LABEL}
                  </div>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgencyStyle}`}>
                    {bounty.urgency.charAt(0).toUpperCase() + bounty.urgency.slice(1)}
                  </span>
                </div>

                {bounty.deadline && (
                  <div
                    className="rounded-lg border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--text3)" }}>
                      <CalendarDaysIcon className="h-3.5 w-3.5" /> {COPY.DEADLINE}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--text3)" }}>
                      <BriefcaseIcon className="h-3.5 w-3.5" /> {COPY.HELPERS_NEEDED}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {COPY.HELPERS_NEEDED_COUNT(bounty.slots_available)}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              {bounty.poster_phone && (
                <div
                  className="mt-5 rounded-lg border p-4"
                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "#166534" }}>
                    {COPY.CUSTOMER_CONTACT}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "#15803d" }}>
                    {bounty.poster_phone}
                  </p>
                </div>
              )}

              {bounty.provider_phone && (
                <div
                  className="mt-5 rounded-lg border p-4"
                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "#166534" }}>
                    {COPY.HELPER_CONTACT}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "#15803d" }}>
                    {bounty.provider_phone}
                  </p>
                </div>
              )}

              <div className="mt-5 text-xs" style={{ color: "var(--text3)" }}>
                Posted {formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}
              </div>
            </div>

            {/* Navigation map — accepted provider only */}
            {isAcceptedProvider && (
              <NavigationMap
                destinationLat={bounty.latitude!}
                destinationLng={bounty.longitude!}
                destinationLabel={bounty.location_name ?? undefined}
                bountyTitle={bounty.title}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div
              className="relative overflow-hidden rounded-xl p-6"
              style={{ background: "var(--bg-ink2)", border: "1px solid var(--border-ink)" }}
            >
              <div
                className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-2xl"
                style={{ background: "rgba(94,58,255,0.15)" }}
              />
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-inv2)" }}>
                {COPY.BUDGET}
              </p>
              <h3 className="mt-1 text-2xl font-bold" style={{ color: "var(--text-inv)" }}>
                {priceDisplay()}
              </h3>
              {bounty.price_negotiable && (
                <p className="mt-1 text-xs" style={{ color: "var(--violet3)" }}>
                  {COPY.PRICE_NEGOTIABLE}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {isOwnBounty && bounty.status === "open" && (
                <Link
                  href={`/bounties/${id}/applications`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
                >
                  <BriefcaseIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.VIEW_HELPERS}
                </Link>
              )}

              {isOwnBounty && bounty.status === "in_progress" && (
                <Link
                  href={`/bounties/${id}/payment`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
                >
                      {COPY.JOB_DETAIL.MAKE_SAFE_PAYMENT}
                </Link>
              )}

              {isOwnBounty && bounty.status === "paid" && (
                <Link
                  href={`/bounties/${id}/complete`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--success-color)", color: "#fff" }}
                >
                  <CheckCircleIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.CONFIRM_AND_PAY}
                </Link>
              )}

              {applySuccess && (
                <div className="rounded-xl border p-4" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                  <p className="text-sm font-semibold" style={{ color: "#15803d" }}>
                    {COPY.JOB_DETAIL.APPLY_SUCCESS}
                  </p>
                </div>
              )}

              {applyError && (
                <div className="rounded-xl border p-4" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
                  <p className="text-sm" style={{ color: "#b91c1c" }}>{applyError}</p>
                </div>
              )}

              {!isOwnBounty && bounty.status === "open" && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
                  disabled={applyLoading}
                  onClick={handleApply}
                >
                    {applyLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {COPY.JOB_DETAIL.APPLYING}</>
                    ) : COPY.JOB_DETAIL.APPLY_BUTTON}
                </button>
              )}

              {isOwnBounty && bounty.status === "open" && (
                <p className="text-center text-xs" style={{ color: "var(--text3)" }}>
                  {COPY.JOB_DETAIL.YOU_POSTED}
                </p>
              )}

              {!isOwnBounty && bounty.status !== "open" && (
                <p className="text-center text-xs" style={{ color: "var(--text3)" }}>
                  {COPY.JOB_DETAIL.NOT_TAKING_HELPERS}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--violet)] hover:text-[var(--violet)]"
                style={{ borderColor: "var(--border2)", color: "var(--text2)" }}
              >
                <ShareIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.SHARE}
              </button>
            </div>

            {/* Payment info */}
            <div
              className="rounded-xl border p-4 space-y-1"
              style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text3)" }}>
                {COPY.JOB_DETAIL.PAYMENT_INFO_TITLE}
              </h4>
              <p className="text-sm" style={{ color: "var(--text2)" }}>
                {COPY.JOB_DETAIL.PAYMENT_INFO_BODY}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}