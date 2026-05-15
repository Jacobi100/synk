"use client";

import { useEffect, useState, use, type ChangeEvent } from "react";
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
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import NavigationMap from "@/components/map/NavigationMap";
import { motion, AnimatePresence } from "framer-motion";

type BountyDetail = Bounty & {
  poster_phone?: string | null;
  provider_profile?: { id: string; full_name?: string } | null;
  provider_phone?: string | null;
  transaction?: {
    id: string;
    status: string;
    provider_id?: string | null;
    assistance_requested_at?: string | null;
    assistance_requested_by?: string | null;
  } | null;
};

interface BountyDetailsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-50  text-emerald-700  border-emerald-200",
  in_progress: "bg-amber-50    text-amber-700    border-amber-200",
  paid: "bg-violet-50   text-violet-700   border-violet-200",
  completed: "bg-blue-50     text-blue-700     border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500  border-neutral-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: COPY.STATUS.open,
  in_progress: COPY.STATUS.in_progress,
  paid: COPY.STATUS.paid,
  completed: COPY.STATUS.completed,
  cancelled: COPY.STATUS.cancelled,
};

const URGENCY_STYLES: Record<string, string> = {
  asap: "bg-red-50   text-red-700   border-red-100",
  scheduled: "bg-sky-50   text-sky-700   border-sky-100",
  flexible: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function BountyDetailsPage({ params }: BountyDetailsPageProps) {
  const { id } = use(params);
  const { user } = useUser();

  const [bounty, setBounty] = useState<BountyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnBounty, setIsOwnBounty] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [negotiatePrice, setNegotiatePrice] = useState<number>(0);
  const [assistanceLoading, setAssistanceLoading] = useState(false);

  const handleRequestAssistance = async () => {
    if (!bounty?.transaction?.id) return;
    try {
      setAssistanceLoading(true);
      const res = await fetch(`/api/transactions/${bounty.transaction.id}/request-assistance`, {
        method: "POST"
      });
      if (res.ok) {
        // Refresh data
        const response = await fetch(`/api/bounties/${id}`);
        const data = await response.json();
        setBounty(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssistanceLoading(false);
    }
  };

  const STEP = 100;

  const handleOpenNegotiate = () => {
    setNegotiatePrice(bounty?.price_min ?? 0);
    setNegotiateOpen(true);
  };

  const handleNegotiateDecrease = () => {
    setNegotiatePrice((prev) => Math.max(bounty?.price_min ?? 0, prev - STEP));
  };

  const handleNegotiateIncrease = () => {
    setNegotiatePrice((prev) => prev + STEP);
  };

  const handleNegotiateInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setNegotiatePrice(bounty?.price_min ?? 0);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      setNegotiatePrice(Math.max(bounty?.price_min ?? 0, num));
    }
  };

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}`);
        if (!response.ok) throw new Error(COPY.JOB_DETAIL.ERROR_MESSAGE);
        const data = await response.json();
        setBounty(data);
        setNegotiatePrice(data.price_min ?? 0);
        if (user) {
          const check = await fetch(`/api/bounties/${id}/check-ownership`);
          if (check.ok) {
            const { isOwner } = await check.json();
            setIsOwnBounty(isOwner);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : COPY.JOB_DETAIL.ERROR_MESSAGE,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBounty();
  }, [id, user]);

  const handleApply = async () => {
    if (!user) {
      setApplyError(COPY.JOB_DETAIL.SIGN_IN_TO_APPLY);
      return;
    }
    try {
      setApplyLoading(true);
      setApplyError(null);
      const proposedPrice = bounty?.price_negotiable
        ? negotiatePrice
        : (bounty?.price_min ?? 0);
      const response = await fetch("/api/bounties/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId: id, proposed_price: proposedPrice }),
      });
      const data = await response.json();
      if (!response.ok) {
        setApplyError(data.error || COPY.JOB_DETAIL.APPLY_ERROR_GENERIC);
        return;
      }
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 5000);
    } catch (err) {
      setApplyError(
        err instanceof Error ? err.message : COPY.JOB_DETAIL.APPLY_ERROR_GENERIC,
      );
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ArrowPathIcon
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--primary)" }}
          />
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
            style={{
              background:
                "color-mix(in srgb, var(--negative) 10%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--negative) 30%, transparent)",
            }}
          >
            <ExclamationCircleIcon
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: "var(--negative)" }}
            />
            <div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--negative)" }}
                >
                  {COPY.JOB_DETAIL.ERROR_TITLE}
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--negative)" }}
                >
                  {error || COPY.JOB_DETAIL.NOT_FOUND}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
  }

  const priceDisplay = () => {
    if (!bounty.price_min && !bounty.price_max)
      return COPY.JOB_DETAIL.CONTACT_FOR_PRICE;
    if (bounty.price_min && bounty.price_max)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()} – ${bounty.price_max.toLocaleString()}`;
    if (bounty.price_min)
      return `${bounty.currency} ${bounty.price_min.toLocaleString()}+`;
    return `${bounty.currency} ${bounty.price_max?.toLocaleString()}`;
  };

  const statusStyle = STATUS_STYLES[bounty.status] ?? STATUS_STYLES.cancelled;
  const urgencyStyle =
    URGENCY_STYLES[bounty.urgency] ??
    "bg-neutral-100 text-neutral-500 border-neutral-200";

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

        {/* PROMPT: Escrow Funded Banner for Provider */}
        {isAcceptedProvider && bounty.status === "paid" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[24px] border p-5 flex items-start gap-4 shadow-sm"
            style={{ 
              backgroundColor: "color-mix(in srgb, var(--positive) 8%, white)", 
              borderColor: "color-mix(in srgb, var(--positive) 20%, transparent)" 
            }}
          >
            <div className="rounded-full p-2" style={{ backgroundColor: "color-mix(in srgb, var(--positive) 15%, transparent)" }}>
              <CheckCircleIcon className="h-6 w-6" style={{ color: "var(--positive)" }} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: "var(--positive-deep)" }}>
                {COPY.PAYMENT.PROVIDER_PAID_TITLE}
              </h3>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--positive-deep)", opacity: 0.9 }}>
                {COPY.PAYMENT.PROVIDER_PAID_BODY}
              </p>
            </div>
          </motion.div>
        )}

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
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bounty.category}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
                >
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

              {bounty.images && bounty.images.length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mute">
                    {COPY.JOB_DETAIL.IMAGES_TITLE}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {bounty.images.map((image, idx) => (
                      <div
                        key={idx}
                        className="relative h-48 w-full overflow-hidden rounded-[16px] bg-secondary"
                      >
                        <img
                          src={image}
                          alt={`${bounty.title} - Image ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {bounty.location_name && (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--secondary)",
                    }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                      <MapPinIcon className="h-3.5 w-3.5" /> {COPY.LOCATION}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {bounty.location_name}
                    </p>
                    {bounty.radius_km > 1 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {COPY.JOB_DETAIL.RADIUS_UP_TO(bounty.radius_km)}
                      </p>
                    )}
                  </div>
                )}

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--secondary)",
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                    <ClockIcon className="h-3.5 w-3.5" /> {COPY.URGENCY_LABEL}
                  </div>
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgencyStyle}`}
                  >
                    {bounty.urgency.charAt(0).toUpperCase() +
                      bounty.urgency.slice(1)}
                  </span>
                </div>

                {bounty.deadline && (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--secondary)",
                    }}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                      <CalendarDaysIcon className="h-3.5 w-3.5" />{" "}
                      {COPY.DEADLINE}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--secondary)",
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-mute">
                    <BriefcaseIcon className="h-3.5 w-3.5" />{" "}
                    {COPY.HELPERS_NEEDED}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {COPY.HELPERS_NEEDED_COUNT(bounty.slots_available)}
                  </p>
                </div>
              </div>

              {bounty.poster_phone && (
                <div
                  className="mt-5 rounded-[24px] border p-4"
                  style={{
                    background: "var(--primary-pale)",
                    borderColor:
                      "color-mix(in srgb, var(--primary) 30%, transparent)",
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--positive-deep)" }}
                  >
                    {COPY.CUSTOMER_CONTACT}
                  </p>
                  <p
                    className="mt-1 font-mono text-sm font-semibold"
                    style={{ color: "var(--positive-deep)" }}
                  >
                    {bounty.poster_phone}
                  </p>
                </div>
              )}

              {bounty.provider_phone && (
                <div
                  className="mt-5 rounded-[24px] border p-4"
                  style={{
                    background: "var(--primary-pale)",
                    borderColor:
                      "color-mix(in srgb, var(--primary) 30%, transparent)",
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--positive-deep)" }}
                  >
                    {COPY.HELPER_CONTACT}
                  </p>
                  <p
                    className="mt-1 font-mono text-sm font-semibold"
                    style={{ color: "var(--positive-deep)" }}
                  >
                    {bounty.provider_phone}
                  </p>
                </div>
              )}

                <div className="mt-5 text-xs text-mute">
                {COPY.JOB_DETAIL.POSTED(
                  formatDistanceToNow(new Date(bounty.created_at), {
                    addSuffix: true,
                  }),
                )}
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
            <div
              className="relative overflow-hidden rounded-[24px] border bg-background p-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-2xl"
                style={{ background: "rgba(94,58,255,0.08)" }}
              />
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {COPY.BUDGET}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-foreground break-words">
                {priceDisplay()}
              </h3>
              {bounty.price_negotiable && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {COPY.PRICE_NEGOTIABLE}
                </p>
              )}
            </div>

            {bounty.price_negotiable &&
              !isOwnBounty &&
              bounty.status === "open" && (
                <AnimatePresence initial={false}>
                  {!negotiateOpen ? (
                    <motion.button
                      key="negotiate-btn"
                      onClick={handleOpenNegotiate}
                      className="flex w-full items-center justify-center gap-2 rounded-[24px] border bg-background px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--muted-foreground)",
                      }}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {COPY.JOB_DETAIL.NEGOTIATE_PRICE}
                    </motion.button>
                  ) : (
                    <motion.div
                      key="negotiate-controls"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={handleNegotiateDecrease}
                        disabled={negotiatePrice <= (bounty?.price_min ?? 0)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-base transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                        aria-label={COPY.JOB_DETAIL.NEGOTIATE_DECREASE}
                      >
                        <MinusIcon className="size-4" />
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={negotiatePrice.toLocaleString()}
                          onChange={handleNegotiateInput}
                          className="flex h-10 w-full rounded-[12px] border bg-background px-3 py-2 text-center text-sm font-semibold tabular-nums ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={{ borderColor: "var(--border)" }}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-mute">
                          {bounty?.currency}
                        </span>
                      </div>
                      <button
                        onClick={handleNegotiateIncrease}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-base transition-all active:scale-[0.97]"

                        style={{
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                        aria-label={COPY.JOB_DETAIL.NEGOTIATE_INCREASE}
                      >
                        <PlusIcon className="size-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

            <div className="space-y-2.5">
              {isOwnBounty && bounty.status === "open" && (
                <Link
                  href={`/bounties/${id}/applications`}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--primary)" }}
                >
                  <BriefcaseIcon className="h-4 w-4" />{" "}
                  {COPY.JOB_DETAIL.VIEW_HELPERS}
                </Link>
              )}

              {isOwnBounty && bounty.status === "in_progress" && (
                <Link
                  href={`/bounties/${id}/payment`}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
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
                  <CheckCircleIcon className="h-4 w-4" />
                  {COPY.JOB_DETAIL.MARK_DONE}
                </Link>
              )}

              {applySuccess && (
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    background: "var(--primary-pale)",
                    borderColor:
                      "color-mix(in srgb, var(--primary) 30%, transparent)",
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--positive-deep)" }}
                  >
                    {COPY.JOB_DETAIL.APPLY_SUCCESS}
                  </p>
                </div>
              )}

              {applyError && (
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    background:
                      "color-mix(in srgb, var(--negative) 10%, transparent)",
                    borderColor:
                      "color-mix(in srgb, var(--negative) 30%, transparent)",
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--negative)" }}>
                    {applyError}
                  </p>
                </div>
              )}

              {!isOwnBounty && bounty.status === "open" && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--primary)" }}
                  disabled={applyLoading}
                  onClick={handleApply}
                >
                  {applyLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />{" "}
                      {COPY.JOB_DETAIL.APPLYING}
                    </>
                  ) : (
                    COPY.JOB_DETAIL.APPLY_BUTTON
                  )}
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
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <ShareIcon className="h-4 w-4" /> {COPY.JOB_DETAIL.SHARE}
              </button>
            </div>

            <div
              className="rounded-[24px] border p-4 space-y-1"
              style={{
                borderColor: "var(--border)",
                background: "var(--secondary)",
              }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-mute">
                {COPY.JOB_DETAIL.PAYMENT_INFO_TITLE}
              </h4>
              <p className="text-sm text-muted-foreground">
                {COPY.JOB_DETAIL.PAYMENT_INFO_BODY}
              </p>
            </div>

            {/* Ghosting Safeguard Section */}
            {bounty.transaction && bounty.transaction.status === "paid" && (
              <div
                className="rounded-[24px] border p-5 space-y-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--background)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                    <ClockIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                    Auto-Release Safeguard
                  </h4>
                </div>

                {!bounty.transaction.assistance_requested_at ? (
                  <>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      If the {isOwnBounty ? "helper has disappeared" : "poster is ghosting you"}, start a safeguard request. Funds release automatically in 48h.
                    </p>
                    <button
                      onClick={handleRequestAssistance}
                      disabled={assistanceLoading}
                      className="w-full rounded-[16px] border py-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {assistanceLoading ? "Notifying Support..." : isOwnBounty ? "Provider Missing?" : "Poster Ghosting Me?"}
                    </button>
                  </>
                ) : (
                  <div className="rounded-[16px] bg-blue-50 p-3 border border-blue-100">
                    <p className="text-[11px] font-bold text-blue-700">
                      Assistance Active
                    </p>
                    <p className="text-[10px] text-blue-600 mt-0.5 font-medium leading-snug">
                      Security timer started. Funds will be released automatically in <strong>47h 59m</strong> if no dispute is raised.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
