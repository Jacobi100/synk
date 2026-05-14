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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompletePageProps {
  params: Promise<{ id: string }>;
}

type FraudOutcome = "hold" | "block" | null;
type PageState    = "idle" | "confirming" | "success" | "error";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Mark complete — calls completeBountyForPoster via the API
  // Handles fraud block/hold (402) distinctly from generic failures
  // -------------------------------------------------------------------------

  const handleMarkComplete = async () => {
    if (!bounty || bounty.status !== "paid") return;

    setPageState("confirming");
    setErrorMessage("");
    setFraudOutcome(null);

    try {
      const res  = await fetch("/api/bounties/complete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bountyId: id }),
      });

      const data = await res.json() as { error?: string; ok?: boolean };

      if (!res.ok) {
        if (res.status === 402) {
          // Fraud detection intercepted — determine hold vs block
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

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const escrowAmount   = bounty?.price_max ?? bounty?.price_min ?? 0;
  const platformFee    = Math.round(escrowAmount * 0.05 * 100) / 100;
  const providerPayout = Math.round((escrowAmount - platformFee) * 100) / 100;
  const currency       = bounty?.currency ?? "NGN";

  const formatNaira = (amount: number) =>
    `${currency} ${amount.toLocaleString("en-NG")}`;

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--violet)" }} />
          <p className="text-sm" style={{ color: "var(--text2)" }}>{COPY.LOADING}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Success
  // -------------------------------------------------------------------------

  if (pageState === "success") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-xl border p-10 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}
          >
            <CheckCircle2 className="h-14 w-14" style={{ color: "#16a34a" }} />
            <h2 className="text-2xl font-bold" style={{ color: "#14532d" }}>
              {COPY.COMPLETE.SUCCESS_TITLE}
            </h2>
            <p className="text-sm" style={{ color: "#15803d" }}>
              {COPY.COMPLETE.SUCCESS_BODY(formatNaira(providerPayout))}
            </p>

            {!reviewed ? (
              <div className="mt-6 w-full border-t border-green-200 pt-6 text-left">
                <h3 className="mb-3 text-sm font-bold text-green-900 uppercase tracking-wide">Rate your experience</h3>
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
                  className="w-full rounded-xl border border-green-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all placeholder:text-green-300"
                  placeholder="Tell us more about the service..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button
                  onClick={() => void handleSubmitReview()}
                  disabled={submittingReview}
                  className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#16a34a" }}
                >
                  {submittingReview ? "Saving..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold text-green-700 uppercase tracking-wider">
                  Feedback Received!
                </p>
              </div>
            )}

            <Link
              href="/dashboard"
              className="mt-4 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "#16a34a" }}
            >
              {COPY.COMPLETE.BACK_TO_FEED}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Fraud — hold
  // -------------------------------------------------------------------------

  if (pageState === "error" && fraudOutcome === "hold") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-xl border p-8 flex flex-col items-center gap-4 text-center"
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
              className="mt-2 rounded-lg border px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "#fed7aa", color: "#ea580c" }}
            >
              {COPY.COMPLETE.BACK_TO_JOB}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Fraud — block
  // -------------------------------------------------------------------------

  if (pageState === "error" && fraudOutcome === "block") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div
            className="rounded-xl border p-8 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
          >
            <ShieldX className="h-12 w-12" style={{ color: "#dc2626" }} />
            <h2 className="text-xl font-bold" style={{ color: "#7f1d1d" }}>
              {COPY.COMPLETE.BLOCK_TITLE}
            </h2>
            <p className="text-sm" style={{ color: "#991b1b" }}>
              {COPY.COMPLETE.BLOCK_BODY}
            </p>
            <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
              {COPY.COMPLETE.BLOCK_CONTACT(id)}
            </p>
            <Link
              href="/dashboard"
              className="mt-2 rounded-lg border px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "#fecaca", color: "#dc2626" }}
            >
              {COPY.BACK_TO_FEED}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Generic error
  // -------------------------------------------------------------------------

  if (pageState === "error" && !fraudOutcome) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
          <div
            className="rounded-xl border p-6 flex items-start gap-4"
            style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <div>
              <h3 className="font-semibold" style={{ color: "#7f1d1d" }}>
                {COPY.COMPLETE.ERROR_TITLE}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "#991b1b" }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setPageState("idle")}
                className="mt-3 text-sm font-medium underline"
                style={{ color: "#dc2626" }}
              >
                {COPY.COMPLETE.TRY_AGAIN}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Bounty not found
  // -------------------------------------------------------------------------

  if (!bounty) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-8">
          <p className="text-sm" style={{ color: "var(--text2)" }}>{COPY.COMPLETE.NOT_FOUND}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main confirmation screen
  // -------------------------------------------------------------------------

  const canComplete   = bounty.status === "paid";
  const needsPayment  = bounty.status === "in_progress";
  const isConfirming  = pageState === "confirming";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">

        {/* Back */}
        <Link
          href={`/bounties/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeft className="h-4 w-4" /> {COPY.COMPLETE.BACK_TO_JOB}
        </Link>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          {COPY.COMPLETE.PAGE_TITLE}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text2)" }}>
          {COPY.COMPLETE.PAGE_SUBTITLE}
        </p>

        <div
          className="rounded-xl border bg-white p-6 space-y-6"
          style={{ borderColor: "var(--border)", boxShadow: "var(--synk-shadow)" }}
        >
          {/* Bounty summary */}
          <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "var(--text3)" }}>
              {COPY.COMPLETE.SECTION_JOB}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {bounty.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
              {bounty.category}
            </p>
          </div>

          <div className="glow-divider" />

          {/* Payout breakdown */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text3)" }}>
              {COPY.COMPLETE.SECTION_BREAKDOWN}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text2)" }}>
                <Banknote className="h-4 w-4" />
                {COPY.COMPLETE.TOTAL_AMOUNT}
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {formatNaira(escrowAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text2)" }}>
                <Receipt className="h-4 w-4" />
                {COPY.COMPLETE.SERVICE_CHARGE}
              </div>
              <span className="text-sm" style={{ color: "var(--text2)" }}>
                − {formatNaira(platformFee)}
              </span>
            </div>

            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ backgroundColor: "var(--bg2)", borderTop: "1px solid var(--border)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {COPY.COMPLETE.HELPER_RECEIVES}
              </span>
              <span className="text-base font-bold" style={{ color: "var(--violet)" }}>
                {formatNaira(providerPayout)}
              </span>
            </div>
          </div>

          {/* Fraud check notice */}
          <div
            className="rounded-lg border p-4 flex items-start gap-3"
            style={{ backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" }}
          >
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--violet)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#5b21b6" }}>
              {COPY.COMPLETE.SAFETY_NOTICE}
            </p>
          </div>

          {/* Need to pay first */}
          {needsPayment && (
            <div className="space-y-3">
              <div
                className="rounded-lg border p-4 flex items-start gap-3"
                style={{ backgroundColor: "#fefce8", borderColor: "#fef08a" }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#ca8a04" }} />
                <p className="text-xs" style={{ color: "#854d0e" }}>
                  You need to fund the escrow before you can mark this job as complete.
                </p>
              </div>

              {payError && (
                <div
                  className="rounded-lg border p-3 text-sm"
                  style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
                >
                  {payError}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
              <Link
              href={`/bounties/${id}`}
              className="flex-1 flex items-center justify-center rounded-lg border py-3 text-sm font-medium transition-colors hover:border-[var(--violet)] hover:text-[var(--violet)]"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              {COPY.COMPLETE.CANCEL}
            </Link>

            {needsPayment ? (
              <button
                onClick={() => void handlePayNow()}
                disabled={paying}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  backgroundColor: "var(--violet)",
                  boxShadow: "var(--shadow-violet)",
                }}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
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
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  backgroundColor: canComplete ? "var(--violet)" : "#9ca3af",
                  boxShadow:       canComplete ? "var(--shadow-violet)" : "none",
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