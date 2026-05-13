"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CreditCard,
  Shield,
  CheckCircle,
} from "lucide-react";

interface PaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BountyPaymentPage({ params }: PaymentPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bounties/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch bounty");
        }

        const data = await response.json();
        setBounty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBounty();
    }
  }, [user, id]);

  const handlePayment = async () => {
    setProcessing(true);
    // TODO: Integrate with Squad payment API
    // For now, just redirect to completion
    setTimeout(() => {
      // Simulate payment and redirect to mark complete
      window.location.href = `/bounty/${id}/complete`;
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error || "Bounty not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const amount = bounty.price_max || bounty.price_min || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/bounty/${id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Confirm Payment
        </h1>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Payment Summary */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Payment Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Bounty</span>
                <span className="font-medium text-gray-900">
                  {bounty.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium text-gray-900">
                  {bounty.selected_provider_id
                    ? `Provider ${bounty.selected_provider_id.slice(0, 8)}...`
                    : "Not selected"}
                </span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  {bounty.currency} {amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Escrow Protected
                </h3>
                <p className="text-sm text-gray-600">
                  Your payment is securely held until the service is complete
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Payment Terms</h3>
                <p className="text-sm text-gray-600">
                  Funds will be released to the provider only after you confirm
                  the work is complete
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Dispute Protection
                </h3>
                <p className="text-sm text-gray-600">
                  If there's an issue, we can help resolve it and protect your
                  funds
                </p>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-700">
              By confirming payment, you agree that:
            </p>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>• You have accepted a provider for this bounty</li>
              <li>• You understand the payment will be held in escrow</li>
              <li>• You will confirm when the service is complete</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="h-12">
              <Link href={`/bounty/${id}`}>Cancel</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Payment processing is secure and handled by Squad
          </p>
        </div>
      </div>
    </div>
  );
}
