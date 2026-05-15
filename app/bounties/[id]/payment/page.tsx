"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { COPY } from "@/lib/copy";

interface EscrowPayload {
  virtual_account_number: string | null;
  amount: number;
  platform_fee: number | null;
  provider_payout: number | null;
  status: string;
  bounty_status: string;
}

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

// Extend window for Squad JS SDK
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    squad: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SquadSDK: any;
  }
}

export default function BountyPaymentPage({ params }: PaymentPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [escrow, setEscrow] = useState<EscrowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment flow state
  const [initiating, setInitiating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payResult, setPayResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const txRefRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [br, er] = await Promise.all([
        fetch(`/api/bounties/${id}`),
        fetch(`/api/bounties/${id}/escrow`),
      ]);
      if (!br.ok) {
        const contentType = br.headers.get("content-type") || "";
        const errorText = contentType.includes("application/json")
          ? (await br.json()).error
          : COPY.PAYMENT.LOAD_ERROR;
        throw new Error(errorText || COPY.PAYMENT.LOAD_ERROR);
      }
      setBounty(await br.json());
      if (er.ok) setEscrow(await er.json());
      else setEscrow(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.PAYMENT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) void loadData();
  }, [user, loadData]);

  const copyVa = () => {
    if (escrow?.virtual_account_number) {
      void navigator.clipboard.writeText(escrow.virtual_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * After Squad checkout fires onclose/oncomplete, verify on our backend.
   */
  const verifyPayment = async (txRef: string) => {
    setVerifying(true);
    setPayResult(null);
    try {
      const res = await fetch(`/api/bounties/${id}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_ref: txRef }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayResult({ ok: false, message: data.error || "Verification failed" });
        return;
      }
      if (data.ok && data.status === "paid") {
        setPayResult({
          ok: true,
          message: "🎉 Payment confirmed! The provider has been notified.",
        });
        await loadData();
      } else {
        setPayResult({
          ok: false,
          message: `Payment not yet confirmed (Squad status: ${data.squad_status ?? "pending"}). Please wait or refresh.`,
        });
      }
    } catch (err) {
      setPayResult({
        ok: false,
        message: err instanceof Error ? err.message : "Verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Initiate Squad checkout and open the inline widget.
   */
  const handlePayNow = async () => {
    setInitiating(true);
    setPayResult(null);

    try {
      // 1. Get a checkout URL + transaction_ref from our backend
      const res = await fetch(`/api/bounties/${id}/initiate-payment`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setPayResult({
          ok: false,
          message: data.error || "Failed to initiate payment",
        });
        return;
      }

      // Already paid
      if (data.status === "paid" || data.status === "released") {
        setPayResult({ ok: true, message: "This bounty is already funded!" });
        await loadData();
        return;
      }

      const { checkout_url, transaction_ref, amount_ngn } = data as {
        checkout_url: string | null;
        transaction_ref: string;
        amount_ngn: number;
      };

      txRefRef.current = transaction_ref;

      // 2. Load Squad SDK and open checkout inline
      await loadSquadSDK();

      if (typeof window.squad === "undefined" && typeof window.SquadSDK === "undefined") {
        // Fallback: open checkout URL in new tab if SDK fails to load
        if (checkout_url) {
          window.open(checkout_url, "_blank");
          setPayResult({
            ok: true,
            message: "Checkout opened in a new tab. After payment, click verify below.",
          });
        } else {
          setPayResult({ ok: false, message: "Squad SDK unavailable. Please try again." });
        }
        return;
      }

      // Squad inline SDK — fires callbacks when done
      const SDKClass = window.squad ?? window.SquadSDK;
      const squadInstance = new SDKClass({
        onLoad: () => {
          console.log("[Squad] Checkout loaded");
        },
        // Squad SDK REQUIRES onSuccess (the primary required callback)
        onSuccess: (response: Record<string, unknown>) => {
          console.log("[Squad] onSuccess", response);
          const ref = String(
            (response.data as Record<string, unknown> | undefined)?.transaction_ref ??
            response.transaction_ref ??
            transaction_ref,
          );
          txRefRef.current = ref;
          void verifyPayment(ref);
        },
        onClose: () => {
          console.log("[Squad] Checkout closed without payment");
          // If user closed the modal without paying, just reset loading state
          setInitiating(false);
          setVerifying(false);
        },
        key: process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY ?? "",
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        amount: Math.round(amount_ngn * 100), // kobo
        currency_code: "NGN",
        transaction_ref: transaction_ref,
        payment_channels: ["card", "bank", "ussd", "transfer"],
      });

      squadInstance.setup();
      squadInstance.open();

    } catch (err) {
      setPayResult({
        ok: false,
        message: err instanceof Error ? err.message : "Payment failed",
      });
    } finally {
      setInitiating(false);
    }
  };

  const isPaid =
    escrow?.status === "paid" ||
    escrow?.status === "released" ||
    escrow?.bounty_status === "paid" ||
    escrow?.bounty_status === "completed";

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ArrowPathIcon className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error || COPY.PAYMENT.NOT_FOUND}</p>
          </div>
        </div>
      </div>
    );
  }

  const fmtNGN = (n: number) =>
    `₦${Number(n).toLocaleString("en-NG")}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-10">

        {/* Back link */}
        <Link
          href={`/bounties/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "var(--muted-foreground)" }}
        >
          ← {COPY.BACK_TO_JOB}
        </Link>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
        >
          {COPY.PAYMENT.TITLE}
        </h1>
        <p className="mb-8 text-gray-600">
          {COPY.PAYMENT.INTRO}
        </p>

        <div
          className="rounded-[24px] border bg-background p-6 space-y-6"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Job summary */}
          <div className="space-y-2 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              {COPY.COMPLETE.SECTION_JOB}
            </p>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {bounty.title}
            </p>
          </div>

          {/* Amount breakdown */}
          {escrow && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                {COPY.COMPLETE.SECTION_BREAKDOWN}
              </p>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>{COPY.COMPLETE.TOTAL_AMOUNT}</span>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {fmtNGN(escrow.amount)}
                </span>
              </div>
              {escrow.platform_fee != null && (
                <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span>{COPY.COMPLETE.SERVICE_CHARGE} (5%)</span>
                  <span>− {fmtNGN(escrow.platform_fee)}</span>
                </div>
              )}
              {escrow.provider_payout != null && (
                <div
                  className="flex justify-between rounded-[16px] px-3 py-2 text-sm font-semibold"
                  style={{ background: "var(--secondary)", borderTop: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--foreground)" }}>{COPY.COMPLETE.HELPER_RECEIVES}</span>
                  <span style={{ color: "var(--primary)" }}>{fmtNGN(escrow.provider_payout)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Paid banner ── */}
          {isPaid && (
            <div
              className="flex items-start gap-3 rounded-[16px] border p-4"
              style={{ borderColor: "color-mix(in srgb, var(--positive) 30%, transparent)", background: "color-mix(in srgb, var(--positive) 10%, transparent)" }}
            >
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--positive)" }} />
              <div>
                <p className="font-semibold text-green-900">
                  {COPY.PAYMENT.PAID_TITLE}
                </p>
                <p className="text-sm text-green-800">
                  {COPY.PAYMENT.PAID_BODY}
                </p>
              </div>
            </div>
          )}

          {/* ── Virtual account (fallback display when no checkout) ── */}
          {escrow?.virtual_account_number && !escrow.virtual_account_number.startsWith("MOCKVA") && !isPaid && (
            <div
              className="rounded-[16px] border-2 p-5"
              style={{ borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)", background: "var(--primary-pale)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--positive-deep)" }}>
                {COPY.PAYMENT.ACCOUNT_NUMBER}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xl font-bold tracking-wider" style={{ color: "var(--foreground)" }}>
                  {escrow.virtual_account_number}
                </code>
                <button
                  type="button"
                  onClick={copyVa}
                  className="rounded-full p-1.5 transition-colors hover:opacity-70"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                </button>
                {copied && (
                  <span className="text-xs font-medium" style={{ color: "var(--positive)" }}>Copied!</span>
                )}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--positive-deep)" }}>
                {COPY.PAYMENT.TRANSFER_INSTRUCTION(escrow.status)}
              </p>
            </div>
          )}

          {/* ── Sandbox test card notice ── */}
          {!isPaid && (
            <div
              className="rounded-[16px] border p-4"
              style={{ borderColor: "#fed7aa", background: "#fffbeb" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#92400e" }}>
                🧪 Sandbox Demo — Test Card
              </p>
              <code className="text-sm font-mono font-bold" style={{ color: "#78350f" }}>
                5555 5555 5555 4444
              </code>
              <p className="text-xs mt-1" style={{ color: "#92400e" }}>
                Use any future expiry, any CVV, any OTP. No real money moves.
              </p>
            </div>
          )}

          {/* ── Result banner ── */}
          {payResult && (
            <div
              className="rounded-[16px] border p-4 text-sm"
              style={{
                borderColor: payResult.ok
                  ? "color-mix(in srgb, var(--positive) 30%, transparent)"
                  : "#fecaca",
                background: payResult.ok
                  ? "color-mix(in srgb, var(--positive) 10%, transparent)"
                  : "#fef2f2",
                color: payResult.ok ? "var(--positive-deep)" : "#b91c1c",
              }}
            >
              {payResult.message}
            </div>
          )}

          {/* ── Manual verify button (after close with no auto-verify) ── */}
          {txRefRef.current && !isPaid && !verifying && payResult && !payResult.ok && (
            <button
              type="button"
              onClick={() => void verifyPayment(txRefRef.current!)}
              className="w-full rounded-[16px] border py-2.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Re-check payment status
            </button>
          )}

          {/* ── Pay Now button ── */}
          {!isPaid && (
            <button
              id="squad-pay-btn"
              type="button"
              onClick={() => void handlePayNow()}
              disabled={initiating || verifying}
              className="w-full flex items-center justify-center gap-2 rounded-[24px] py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 24px color-mix(in srgb, var(--primary) 35%, transparent)",
              }}
            >
              {initiating || verifying ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  {initiating ? "Opening checkout…" : "Verifying payment…"}
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  Pay {escrow ? fmtNGN(escrow.amount) : ""}
                </>
              )}
            </button>
          )}

          {/* ── Already paid — go to completion ── */}
          {isPaid && (
            <Button
              asChild
              className="w-full py-4 text-base font-semibold rounded-[24px]"
              style={{ background: "var(--positive)", color: "#fff" }}
            >
              <Link href={`/bounties/${id}/complete`}>
                <CheckCircleIcon className="mr-2 h-5 w-5" />
                {COPY.JOB_DETAIL.CONFIRM_AND_PAY || "Confirm Done & Release Payment"}
              </Link>
            </Button>
          )}

          {/* Trust badges */}
          <div className="flex flex-col gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--positive)" }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {COPY.PAYMENT.SAFETY_TITLE || "Escrow Protected"}
                </h3>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {COPY.PAYMENT.HELD_NOTICE}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--positive)" }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  Secure Checkout
                </h3>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  256-bit SSL. Payments processed securely by Squad (powered by GTBank).
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full rounded-[24px]">
            <Link href={`/bounties/${id}`}>{COPY.BACK_TO_JOB}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamically load the Squad inline JS SDK
// ---------------------------------------------------------------------------

function loadSquadSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window.squad || window.SquadSDK)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.squadco.com/widget/squad.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("[Squad] Failed to load checkout SDK");
      resolve(); // resolve anyway — caller handles SDK absence
    };
    document.head.appendChild(script);
  });
}
