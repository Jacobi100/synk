
"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import {
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShareIcon,
  BriefcaseIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
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

const STATUS_LABELS: Record<string, string> = {
  open:        COPY.STATUS.open,
  in_progress: COPY.STATUS.in_progress,
  paid:        COPY.STATUS.paid,
  completed:   COPY.STATUS.completed,
  cancelled:   COPY.STATUS.cancelled,
};

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
          <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm text-mute">{COPY.LOADING}</p>
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
            className="rounded-[24px] border p-6 flex items-start gap-4"
            style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)" }}
          >
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--negative)" }} />
            <div>
              <h3 className="font-semibold" style={{ color: "var(--negative)" }}>Error loading bounty</h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--negative)" }}>{error || "Bounty not found"}</p>
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

  const isAcceptedProvider =
    !isOwnBounty &&
    (bounty.status === "in_progress" || bounty.status === "paid") &&
    bounty.latitude != null &&
    bounty.longitude != null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-5">
            <div
              className="rounded-[24px] border bg-background p-7"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h1
                    className="text-2xl font-bold text-foreground"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {bounty.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{bounty.category}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                  {STATUS_LABELS[bounty.status] ?? bounty.status}
                </span>
              </div>

              <div className="glow-divider mb-5" />

              <div className="mb-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-mute">
                  {COPY.DESCRIPTION}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {bounty.description || COPY.NO_DESCRIPTION}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {bounty.location_name && (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                      <MapPinIcon className="h-3.5 w-3.5" /> {COPY.LOCATION}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {bounty.location_name}
                    </p>
                    {bounty.radius_km > 1 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Up to {bounty.radius_km} km
                      </p>
                    )}
                  </div>
                )}

                <div
                  className="rounded-[24px] border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                    <ClockIcon className="h-3.5 w-3.5" /> {COPY.URGENCY_LABEL}
                  </div>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgencyStyle}`}>
                    {bounty.urgency.charAt(0).toUpperCase() + bounty.urgency.slice(1)}
                  </span>
                </div>

                {bounty.deadline && (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                      <CalendarDaysIcon className="h-3.5 w-3.5" /> {COPY.DEADLINE}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div
                  className="rounded-[24px] border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                    <BriefcaseIcon className="h-3.5 w-3.5" /> {COPY.HELPERS_NEEDED}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {COPY.HELPERS_NEEDED_COUNT(bounty.slots_available)}
                  </p>
                </div>
              </div>

              {bounty.poster_phone && (
                <div
                  className="mt-5 rounded-[24px] border p-4"
                  style={{ background: "var(--primary-pale)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--positive-deep)" }}>
                    {COPY.CUSTOMER_CONTACT}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "var(--positive-deep)" }}>
                    {bounty.poster_phone}
                  </p>
                </div>
              )}

              {bounty.provider_phone && (
                <div
                  className="mt-5 rounded-[24px] border p-4"
                  style={{ background: "var(--primary-pale)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--positive-deep)" }}>
                    {COPY.HELPER_CONTACT}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold" style={{ color: "var(--positive-deep)" }}>
                    {bounty.provider_phone}
                  </p>
                </div>
              )}

              <div className="mt-5 text-xs text-mute">
                Posted {formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}
              </div>
            </div>

            {isAcceptedProvider && (
              <NavigationMap
                destinationLat={bounty.latitude!}
                destinationLng={bounty.longitude!}
                destinationLabel={bounty.location_name ?? undefined}
                bountyTitle={bounty.title}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[24px] bg-[#0e0f0c] p-6">
              <div
                className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-2xl"
                style={{ background: "rgba(159,232,112,0.12)" }}
              />
              <p className="text-xs font-medium uppercase tracking-wide text-[#868685]">
                {COPY.BUDGET}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#e8ebe6]">
                {priceDisplay()}
              </h3>
              {bounty.price_negotiable && (
                <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {COPY.PRICE_NEGOTIABLE}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              {isOwnBounty && bounty.status === "open" && (
                <Link
                  href={`/bounties/${id}/applications`}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--primary)" }}
                >
                  <BriefcaseIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.VIEW_HELPERS}
                </Link>
              )}

              {isOwnBounty && bounty.status === "in_progress" && (
                <Link
                  href={`/bounties/${id}/payment`}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--primary)" }}
                >
                  {COPY.JOB_DETAIL.MAKE_SAFE_PAYMENT}
                </Link>
              )}

              {isOwnBounty && bounty.status === "paid" && (
                <Link
                  href={`/bounties/${id}/complete`}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--positive)", color: "#fff" }}
                >
                  <CheckCircleIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.CONFIRM_AND_PAY}
                </Link>
              )}

              {applySuccess && (
                <div className="rounded-[24px] border p-4" style={{ background: "var(--primary-pale)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--positive-deep)" }}>
                    {COPY.JOB_DETAIL.APPLY_SUCCESS}
                  </p>
                </div>
              )}

              {applyError && (
                <div className="rounded-[24px] border p-4" style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)" }}>
                  <p className="text-sm" style={{ color: "var(--negative)" }}>{applyError}</p>
                </div>
              )}

              {!isOwnBounty && bounty.status === "open" && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--primary)" }}
                  disabled={applyLoading}
                  onClick={handleApply}
                >
                  {applyLoading ? (
                    <><ArrowPathIcon className="h-4 w-4 animate-spin" /> {COPY.JOB_DETAIL.APPLYING}</>
                  ) : COPY.JOB_DETAIL.APPLY_BUTTON}
                </button>
              )}

              {isOwnBounty && bounty.status === "open" && (
                <p className="text-center text-xs text-mute">
                  {COPY.JOB_DETAIL.YOU_POSTED}
                </p>
              )}

              {!isOwnBounty && bounty.status !== "open" && (
                <p className="text-center text-xs text-mute">
                  {COPY.JOB_DETAIL.NOT_TAKING_HELPERS}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-[24px] border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <ShareIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.SHARE}
              </button>
            </div>

            <div
              className="rounded-[24px] border p-4 space-y-1"
              style={{ borderColor: "var(--border)", background: "var(--secondary)" }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-mute">
                {COPY.JOB_DETAIL.PAYMENT_INFO_TITLE}
              </h4>
              <p className="text-sm text-muted-foreground">
                {COPY.JOB_DETAIL.PAYMENT_INFO_BODY}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
