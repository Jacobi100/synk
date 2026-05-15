import {
  getBountyById,
  getProfileUUID,
  updateBounty,
  getTransactionByBountyId,
  updateTransactionReleased,
  getProfileById,
  getAcceptedApplicationForBounty,
} from "@/lib/bounty";
import { squadTransferPayout, squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";
import { createNotification } from "@/lib/notifications";
import { assessTransaction } from "@/lib/risk/scorer";
import { calculateTrustProfile } from "@/lib/trust/calculator";
import { supabaseAdmin } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Fraud check - runs before funds are released
// ---------------------------------------------------------------------------

async function runFraudCheck(params: {
  bountyId: string;
  transactionId: string;
  buyerId: string;
  providerId: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
}): Promise<{ recommendation: "approve" | "hold" | "block" }> {
  try {
    // How long since payment was confirmed
    const timeElapsedMinutes = Math.floor(
      (Date.now() - new Date(params.createdAt).getTime()) / 60_000
    );

    // How many previous transactions between this buyer and provider
    const { count: previousCount } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("poster_id", params.buyerId)
      .eq("provider_id", params.providerId)
      .eq("status", "released");

    const assessment = await assessTransaction({
      buyerId: params.buyerId,
      providerId: params.providerId,
      amount: params.amount,
      serviceDescription: params.description,
      category: params.category,
      timeElapsedMinutes,
      previousTransactionCount: previousCount ?? 0,
    });

    // Persist alert for held or blocked transactions
    if (
      assessment.recommendation === "hold" ||
      assessment.recommendation === "block"
    ) {
      const { error } = await supabaseAdmin.from("fraud_alerts").insert({
        transaction_id: params.transactionId,
        bounty_id: params.bountyId,
        buyer_id: params.buyerId,
        provider_id: params.providerId,
        amount: params.amount,
        final_score: assessment.finalScore,
        recommendation: assessment.recommendation,
        risk_factors: assessment.riskFactors,
        explanation: assessment.explanation,
        layer1_score: assessment.layer1Score,
        layer2_score: assessment.layer2Score,
        gemini_contribution: assessment.geminiContribution,
        signals: assessment.signals,
      });

      if (error) {
        console.error("[fraud] Failed to persist alert:", error.message);
      }
    }

    console.info(
      "[fraud] Check complete - recommendation:",
      assessment.recommendation,
      "| score:",
      assessment.finalScore
    );

    return { recommendation: assessment.recommendation };

  } catch (err) {
    // Never block a payment over a failed fraud check - log and approve
    console.error("[fraud] assessTransaction threw unexpectedly:", err);
    return { recommendation: "approve" };
  }
}

// ---------------------------------------------------------------------------
// Reputation update - runs after payout succeeds (fire and forget)
// ---------------------------------------------------------------------------

async function updateProviderReputation(providerId: string): Promise<void> {
  try {
    // Query provider's full transaction history
    const { data: txRows } = await supabaseAdmin
      .from("transactions")
      .select("id, poster_id, status")
      .eq("provider_id", providerId);

    if (!txRows || txRows.length === 0) return;

    const completed = txRows.filter((t) => t.status === "released").length;
    const disputed = txRows.filter((t) => t.status === "disputed").length;
    const total = txRows.length;
    const completionRate = total > 0 ? completed / total : 0;

    // Unique buyers
    const uniqueBuyerIds = [...new Set(txRows.map((t) => t.poster_id))];
    const totalUniqueBuyers = uniqueBuyerIds.length;

    // Repeat buyers - those who appear more than once
    const buyerCounts = txRows.reduce<Record<string, number>>((acc, t) => {
      acc[t.poster_id] = (acc[t.poster_id] ?? 0) + 1;
      return acc;
    }, {});
    const repeatBuyerCount = Object.values(buyerCounts).filter((c) => c > 1).length;
    const repeatBuyerRatio = totalUniqueBuyers > 0
      ? repeatBuyerCount / totalUniqueBuyers
      : 0;

    // Fraud flags from fraud_alerts table
    const { count: fraudFlags } = await supabaseAdmin
      .from("fraud_alerts")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId);

    // Account age & Ratings
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("created_at, average_rating, rating_count")
      .eq("id", providerId)
      .single();

    const accountAgeDays = profileRow
      ? Math.floor(
        (Date.now() - new Date(profileRow.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      : 0;

    const profile = calculateTrustProfile({
      providerId,
      completedJobs: completed,
      completionRate,
      totalUniqueBuyers,
      repeatBuyerCount,
      repeatBuyerRatio,
      disputeCount: disputed,
      fraudFlags: fraudFlags ?? 0,
      averageResponseTimeMinutes: 60, // default until response time tracking is added
      accountAgeDays,
      averageRating: Number(profileRow?.average_rating || 0),
      ratingCount: Number(profileRow?.rating_count || 0),
    });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        trust_badge: profile.badge,
        trust_score: profile.trustScore,
        trust_signals: profile.signals,
        trust_computed_at: new Date().toISOString(),
      })
      .eq("id", providerId);

    if (error) {
      console.error("[reputation] Failed to update trust profile:", error.message);
    } else {
      console.info(
        "[reputation] Trust profile updated - provider:",
        providerId,
        "| badge:",
        profile.badge,
        "| score:",
        profile.trustScore
      );
    }

  } catch (err) {
    console.error("[reputation] updateProviderReputation threw unexpectedly:", err);
  }
}

// ---------------------------------------------------------------------------
// Complete bounty - main function
// ---------------------------------------------------------------------------

export async function completeBountyForPoster(clerkUserId: string, bountyId: string) {
  const bounty = await getBountyById(bountyId);
  if (!bounty) return { error: "Bounty not found", status: 404 as const };

  const posterUUID = await getProfileUUID(clerkUserId);
  if (!posterUUID || bounty.poster_id !== posterUUID) {
    return { error: "Forbidden", status: 403 as const };
  }

  if (bounty.status !== "paid") {
    return {
      error: "Bounty must be paid before completion and payout",
      status: 400 as const,
    };
  }

  const tx = await getTransactionByBountyId(bountyId);
  if (!tx || tx.status !== "paid") {
    return { error: "No paid transaction for this bounty", status: 400 as const };
  }

  const provider = await getProfileById(tx.provider_id);
  if (!provider) return { error: "Provider profile not found", status: 500 as const };

  const acct = String(provider.account_number ?? "").replace(/\D/g, "");
  const bank = String(provider.bank_code ?? "").trim();
  const payout = Number(tx.provider_payout ?? 0);

  console.log("Provider payout debug:", {
    account_number: provider.account_number,
    bank_code: provider.bank_code,
    acct_digits: acct,
    bank_trimmed: bank,
  });

  if (!acct || acct.length < 9 || !bank) {
    return {
      error: `Provider must add bank_code and account_number on their profile to receive payout. Got acct=${acct} (len=${acct.length}), bank=${bank}`,
      status: 400 as const,
    };
  }

  // -------------------------------------------------------------------------
  // Fraud check - BEFORE releasing funds
  // -------------------------------------------------------------------------

  const fraud = await runFraudCheck({
    bountyId,
    transactionId: tx.id,
    buyerId: bounty.poster_id,
    providerId: tx.provider_id,
    amount: Number(tx.amount),
    description: bounty.description || "",
    category: bounty.category,
    createdAt: tx.created_at,
  });

  if (fraud.recommendation === "block") {
    return {
      error: "Payment could not be released - flagged by fraud detection. Contact support.",
      status: 402 as const,
    };
  }

  if (fraud.recommendation === "hold") {
    return {
      error: "Payment is under review. You will be notified once it is cleared.",
      status: 402 as const,
    };
  }

  // -------------------------------------------------------------------------
  // Fraud approved - release funds
  // -------------------------------------------------------------------------

  const ref = `synk_${bountyId}_${Date.now()}`;
  const amountKobo = Math.max(1, Math.round(payout * 100));

  const transfer = await squadTransferPayout({
    transaction_reference: ref,
    amountKobo,
    bank_code: bank,
    account_number: acct,
    account_name: String(provider.full_name ?? "Synk Provider").trim(),
    remark: `Payout bounty ${bounty.title.slice(0, 40)}`,
  });

  if (!transfer.ok) {
    return {
      error: "Squad transfer failed - check server logs",
      status: 502 as const,
      detail: transfer.raw,
    };
  }

  const released = await updateTransactionReleased(tx.id, ref);
  if (!released) return { error: "Failed to update transaction", status: 500 as const };

  const updatedBounty = await updateBounty(bountyId, clerkUserId, { status: "completed" });
  if (!updatedBounty) return { error: "Failed to update bounty", status: 500 as const };

  // -------------------------------------------------------------------------
  // Reputation update - fire and forget, never blocks the response
  // -------------------------------------------------------------------------

  void updateProviderReputation(tx.provider_id);

  // -------------------------------------------------------------------------
  // Notify provider
  // -------------------------------------------------------------------------

  await createNotification({
    user_id: tx.provider_id,
    type: "payout_sent",
    title: "Payout sent",
    body: `Your payment of ₦${payout.toLocaleString("en-NG")} has been sent to your account.`,
    related_bounty_id: bountyId,
  });

  const phone = normalizeNigerianPhone(provider.phone_number);
  if (phone) {
    await squadSendSms(
      phone,
      `Your payment of ₦${payout.toLocaleString("en-NG")} has been sent to your account.`,
    );
  }

  return { ok: true as const, bounty: updatedBounty, transaction: released };
}

// ---------------------------------------------------------------------------
// Resolve accepted provider for UI
// ---------------------------------------------------------------------------

export async function getAcceptedProviderId(bountyId: string) {
  const app = await getAcceptedApplicationForBounty(bountyId);
  return app?.provider_id ?? null;
}
