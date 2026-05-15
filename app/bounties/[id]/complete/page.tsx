"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShieldX,
  ArrowLeft,
  Banknote,
  Receipt,
} from "lucide-react";

interface CompletePageProps {
  params: Promise<{ id: string }>;
}

type FraudOutcome = "hold" | "block" | null;
type PageState    = "idle" | "confirming" | "success" | "error";

export default function BountyCompletePage({ params }: CompletePageProps) {
  const { id }   = use(params);
  const { user } = useUser();

  const [bounty, setBounty]           = useState<Bounty | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pageState, setPageState]     = useState<PageState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fraudOutcome, setFraudOutcome] = useState<FraudOutcome>(null);

  const [rating, setRating]           = useState(5);
  const [comment, setComment]         = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewed, setReviewed]       = useState(false);

  // Payment state for in_progress bounties
  const [paying, setPaying]           = useState(false);
  const [payError, setPayError]       = useState<string | null>(null);

  const fetchBounty = useCallback(async () => {
    try {
      const res = await fetch(`/api/bounties/${id}`);
      if (!res.ok) throw new Error("Failed to fetch bounty.");
      setBounty(await res.json());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load bounty.");
      setPageState("error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) return;
    void fetchBounty();
  }, [user, fetchBounty]);

  const handleMarkComplete = async () => {
    if (!bounty || bounty.status !== "paid") return;

    setPageState("confirming");
    setErrorMessage("");
    setFraudOutcome(null);

    try {
      const res  = await fetch(`/api/bounties/${id}/mark-complete`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json() as { error?: string; ok?: boolean };

      if (!res.ok) {
        if (res.status === 402) {
          const outcome: FraudOutcome =
            data.error?.toLowerCase().includes("review") ? "hold" : "block";
          setFraudOutcome(outcome);
        }
        throw new Error(data.error ?? "Failed to complete bounty.");
      }

      setPageState("success");

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      if (pageState !== "success") setPageState("error");
    }
  };

  // -------------------------------------------------------------------------
  // Pay now — for in_progress bounties that haven't been funded yet
  // -------------------------------------------------------------------------

  const handlePayNow = async () => {
    if (!bounty) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/bounties/${id}/simulate-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Payment failed. Please try again.");
        return;
      }
      // Refresh bounty to get updated status
      await fetchBounty();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/bounties/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) setReviewed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const escrowAmount   = bounty?.price_max ?? bounty?.price_min ?? 0;
  const platformFee    = Math.round(escrowAmount * 0.05 * 100) / 100;
  const providerPayout = Math.round((escrowAmount - platformFee) * 100) / 100;
  const currency       = bounty?.currency ?? "NGN";

  const formatNaira = (amount: number) =>
    `${currency} ${amount.toLocaleString("en-NG")}`;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm text-muted-foreground">{COPY.LOADING}</p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-[24px] border p-10 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: "var(--primary-pale)", backgroundColor: "color-mix(in srgb, var(--primary-pale) 50%, transparent)" }}
          >
            <CheckCircle2 className="h-14 w-14" style={{ color: "var(--positive)" }} />
            <h2 className="text-2xl font-bold" style={{ color: "var(--positive-deep)" }}>
              {COPY.COMPLETE.SUCCESS_TITLE}
            </h2>
            <p className="text-sm" style={{ color: "var(--positive-deep)" }}>
              {COPY.COMPLETE.SUCCESS_BODY(formatNaira(providerPayout))}
            </p>

            {!reviewed ? (
              <div className="mt-6 w-full border-t border-border pt-6 text-left">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--positive-deep)" }}>Rate your experience</h3>
                <div className="flex gap-1.5 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-110 active:scale-95"
                    >
                      {rating >= star ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full rounded-[24px] border bg-background p-3 text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "var(--primary-pale)", "--tw-ring-color": "var(--positive)" } as React.CSSProperties}
                  placeholder="Tell us more about the service..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button
                  onClick={() => void handleSubmitReview()}
                  disabled={submittingReview}
                  className="mt-4 w-full rounded-[24px] py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--positive)" }}
                >
                  {submittingReview ? "Saving..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: "var(--primary-pale)", color: "var(--positive-deep)" }}>
                  Feedback Received!
                </p>
              </div>
            )}

            <Link
              href="/dashboard"
              className="mt-4 rounded-[24px] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--positive)" }}
            >
              {COPY.COMPLETE.BACK_TO_FEED}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error" && fraudOutcome === "hold") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-[24px] border p-8 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}
          >
            <ShieldAlert className="h-12 w-12" style={{ color: "#ea580c" }} />
            <h2 className="text-xl font-bold" style={{ color: "#7c2d12" }}>
              {COPY.COMPLETE.HOLD_TITLE}
            </h2>
            <p className="text-sm" style={{ color: "#9a3412" }}>
              {COPY.COMPLETE.HOLD_BODY}
            </p>
            <p className="text-xs mt-1" style={{ color: "#c2410c" }}>
              {COPY.COMPLETE.HOLD_CONTACT(id)}
            </p>
            <Link
              href={`/bounties/${id}`}
              className="mt-2 rounded-[24px] border px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "#fed7aa", color: "#ea580c" }}
            >
              {COPY.COMPLETE.BACK_TO_JOB}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error" && fraudOutcome === "block") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-[24px] border p-8 flex flex-col items-center gap-4 text-center"
            style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)" }}
          >
            <ShieldX className="h-12 w-12" style={{ color: "var(--negative)" }} />
            <h2 className="text-xl font-bold" style={{ color: "var(--negative)" }}>
              {COPY.COMPLETE.BLOCK_TITLE}
            </h2>
            <p className="text-sm" style={{ color: "var(--negative)" }}>
              {COPY.COMPLETE.BLOCK_BODY}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--negative)" }}>
              {COPY.COMPLETE.BLOCK_CONTACT(id)}
            </p>
            <Link
              href="/dashboard"
              className="mt-2 rounded-[24px] border px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)", color: "var(--negative)" }}
            >
              {COPY.BACK_TO_FEED}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error" && !fraudOutcome) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
          <div
            className="rounded-[24px] border p-6 flex items-start gap-4"
            style={{ backgroundColor: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)" }}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--negative)" }} />
            <div>
              <h3 className="font-semibold" style={{ color: "var(--negative)" }}>
                {COPY.COMPLETE.ERROR_TITLE}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--negative)" }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setPageState("idle")}
                className="mt-3 text-sm font-medium underline"
                style={{ color: "var(--negative)" }}
              >
                {COPY.COMPLETE.TRY_AGAIN}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-8">
          <p className="text-sm text-muted-foreground">{COPY.COMPLETE.NOT_FOUND}</p>
        </div>
      </div>
    );
  }

  const canComplete   = bounty.status === "paid";
  const needsPayment  = bounty.status === "in_progress";
  const isConfirming  = pageState === "confirming";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">

        <Link
          href={`/bounties/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {COPY.COMPLETE.BACK_TO_JOB}
        </Link>

        <h1
          className="text-2xl font-bold mb-1 text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          {COPY.COMPLETE.PAGE_TITLE}
        </h1>
        <p className="text-sm mb-8 text-muted-foreground">
          {COPY.COMPLETE.PAGE_SUBTITLE}
        </p>

        <div
          className="rounded-[24px] border bg-background p-6 space-y-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-mute">
              {COPY.COMPLETE.SECTION_JOB}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {bounty.title}
            </p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              {bounty.category}
            </p>
          </div>

          <div className="glow-divider" />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">
              {COPY.COMPLETE.SECTION_BREAKDOWN}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4" />
                {COPY.COMPLETE.TOTAL_AMOUNT}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatNaira(escrowAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" />
                {COPY.COMPLETE.SERVICE_CHARGE}
              </div>
              <span className="text-sm text-muted-foreground">
                − {formatNaira(platformFee)}
              </span>
            </div>

            <div
              className="flex items-center justify-between rounded-[24px] p-3"
              style={{ backgroundColor: "var(--secondary)", borderTop: "1px solid var(--border)" }}
            >
              <span className="text-sm font-semibold text-foreground">
                {COPY.COMPLETE.HELPER_RECEIVES}
              </span>
              <span className="text-base font-bold" style={{ color: "var(--primary)" }}>
                {formatNaira(providerPayout)}
              </span>
            </div>
          </div>

          <div
            className="rounded-[24px] border p-4 flex items-start gap-3"
            style={{ backgroundColor: "var(--primary-pale)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
          >
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--positive-deep)" }}>
              {COPY.COMPLETE.SAFETY_NOTICE}
            </p>
          </div>

          {needsPayment && (
            <div className="space-y-3">
              <div
                className="rounded-[24px] border p-4 flex items-start gap-3"
                style={{ backgroundColor: "#fffbeb", borderColor: "#fed7aa" }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                <p className="text-xs" style={{ color: "#92400e" }}>
                  {COPY.COMPLETE.CANNOT_PAY_YET(bounty.status.replace("_", " "))}
                </p>
              </div>

              {payError && (
                <div
                  className="rounded-[24px] border p-3 text-sm"
                  style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
                >
                  {payError}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
              <Link
              href={`/bounties/${id}`}
              className="flex-1 flex items-center justify-center rounded-[24px] border py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
              {COPY.COMPLETE.CANCEL}
            </Link>

            {needsPayment ? (
              <button
                onClick={() => void handlePayNow()}
                disabled={paying}
                className="flex-1 flex items-center justify-center gap-2 rounded-[24px] py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  backgroundColor: "var(--primary)",
                }}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {COPY.COMPLETE.PROCESSING}
                  </>
                ) : (
                  <>
                    <Banknote className="h-4 w-4" />
                    Pay {formatNaira(escrowAmount)}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => void handleMarkComplete()}
                disabled={!canComplete || isConfirming}
                className="flex-1 flex items-center justify-center gap-2 rounded-[24px] py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  backgroundColor: canComplete ? "var(--primary)" : "#9ca3af",
                }}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {COPY.COMPLETE.PROCESSING}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {COPY.COMPLETE.CONFIRM_BUTTON}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
