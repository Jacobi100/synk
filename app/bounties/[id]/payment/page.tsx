"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import { ArrowPathIcon, ExclamationCircleIcon, ShieldCheckIconCheckIcon, CheckCircleIconIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
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

export default function BountyPaymentPage({ params }: PaymentPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [escrow, setEscrow] = useState<EscrowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [br, er] = await Promise.all([
          fetch(`/api/bounties/${id}`),
          fetch(`/api/bounties/${id}/escrow`),
        ]);
        if (!br.ok) throw new Error("Failed to fetch bounty");
        setBounty(await br.json());
        if (er.ok) setEscrow(await er.json());
        else setEscrow(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    if (user) void load();
  }, [user, id]);

  const copyVa = () => {
    if (escrow?.virtual_account_number) {
      void navigator.clipboard.writeText(escrow.virtual_account_number);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error || "Bounty not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/bounties/${id}`} className="font-medium text-blue-600 hover:text-blue-700">
            {COPY.BACK_TO_JOB}
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">{COPY.PAYMENT.SAFE_PAYMENT_TITLE}</h1>
        <p className="mb-8 text-gray-600">
          Transfer the agreed amount to the Squad virtual account below. We will notify the provider when payment
          clears.{/* COPY.PAYMENT — no key for this full sentence */}
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="mb-6 space-y-2 border-b border-gray-100 pb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{COPY.COMPLETE.SECTION_JOB}</span>
              <span className="font-medium text-gray-900">{bounty.title}</span>
            </div>
            {escrow && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{COPY.COMPLETE.TOTAL_AMOUNT}</span>
                  <span className="font-semibold text-gray-900">
                    ₦{Number(escrow.amount).toLocaleString("en-NG")}
                  </span>
                </div>
                {escrow.platform_fee != null && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{COPY.COMPLETE.SERVICE_CHARGE}</span>
                    <span>₦{Number(escrow.platform_fee).toLocaleString("en-NG")}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {escrow?.virtual_account_number ? (
            <div className="mb-8 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6">
              <p className="mb-1 text-sm font-medium text-indigo-900">Virtual account number{/* COPY.PAYMENT.VIRTUAL_ACCOUNT_LABEL — key missing from lib/copy.ts */}</p>
              <div className="flex items-center gap-2">
                <code className="text-xl font-bold tracking-wide text-indigo-950">
                  {escrow.virtual_account_number}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyVa} className="shrink-0">
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-indigo-800">
                {COPY.PAYMENT.TRANSFER_INSTRUCTION} Status:{" "}
                <strong>{escrow.status}</strong>
              </p>
            </div>
          ) : (
            <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-900">
                {COPY.PAYMENT.NOT_AVAILABLE}
              </p>
            </div>
          )}

          <div className="mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Squad escrow</h3>
                <p className="text-sm text-gray-600">{COPY.PAYMENT.HELD_NOTICE}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Webhook</h3>
                <p className="text-sm text-gray-600">
                  Configure your Squad webhook to this deployment&apos;s{" "}
                  <code className="rounded bg-gray-100 px-1">/api/webhooks/squad</code> URL (e.g. via ngrok).
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full">
            <Link href={`/bounties/${id}`}>Done</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
