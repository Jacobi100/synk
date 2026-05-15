import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getBountyById,
  getProfileUUID,
  getTransactionByBountyId,
  getProfileById,
} from "@/lib/bounty";
import { squadInitiatePayment } from "@/lib/squad";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/bounties/[id]/initiate-payment
 *
 * Creates a Squad checkout session for the bounty's escrow amount.
 * Returns { checkout_url, transaction_ref } so the frontend can open
 * the Squad checkout inline widget.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bountyId } = await params;
    const bounty = await getBountyById(bountyId);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const profileId = await getProfileUUID(userId);
    if (!profileId || bounty.poster_id !== profileId) {
      return NextResponse.json(
        { error: "Only the poster can initiate payment" },
        { status: 403 },
      );
    }

    // Must have an accepted provider (transaction row exists)
    const tx = await getTransactionByBountyId(bountyId);
    if (!tx) {
      return NextResponse.json(
        { error: "No transaction found — accept a provider first" },
        { status: 400 },
      );
    }

    if (tx.status === "paid" || tx.status === "released") {
      return NextResponse.json(
        { message: "Already paid", status: tx.status },
        { status: 200 },
      );
    }

    // Poster profile for email/name
    const poster = await getProfileById(profileId);
    const email = poster?.email ?? "noreply@synk.app";
    const customerName = poster?.full_name ?? "Synk Customer";

    // Amount in kobo (Squad requires kobo)
    const amountNGN = Number(tx.amount);
    const amountKobo = Math.round(amountNGN * 100);

    // Unique ref — use existing tx.squad_transaction_ref if re-initiating
    const txRef = tx.squad_transaction_ref ?? `synk_pay_${tx.id}_${Date.now()}`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const result = await squadInitiatePayment({
      email,
      amount: amountKobo,
      transaction_ref: txRef,
      customer_name: customerName,
      currency: "NGN",
      initiate_type: "inline",
      callback_url: `${appUrl}/bounties/${bountyId}/payment`,
      payment_channels: ["card", "bank", "ussd", "transfer"],
      metadata: {
        bounty_id: bountyId,
        transaction_id: tx.id,
        poster_id: profileId,
        provider_id: tx.provider_id,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to initiate Squad payment", detail: result.raw },
        { status: 502 },
      );
    }

    // Persist the transaction_ref on our transaction row so the webhook
    // can match payment → bounty
    await supabaseAdmin
      .from("transactions")
      .update({ squad_transaction_ref: txRef })
      .eq("id", tx.id);

    return NextResponse.json({
      ok: true,
      checkout_url: result.checkout_url,
      transaction_ref: txRef,
      amount_kobo: amountKobo,
      amount_ngn: amountNGN,
    });
  } catch (error) {
    console.error("Initiate payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
