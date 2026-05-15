import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getBountyById,
  getProfileUUID,
  getTransactionByBountyId,
  updateTransactionPaid,
  updateBounty,
  getProfileById,
} from "@/lib/bounty";
import { squadSimulatePayment } from "@/lib/squad";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";

/**
 * POST /api/bounties/[id]/simulate-payment
 *
 * Simulates a payment for a bounty in development / sandbox mode.
  * - If the VA is a real Squad VA: calls Squad's simulate endpoint
 *   (Squad will then fire its webhook to /api/webhooks/squad).
  * - If the VA is a mock (MOCKVA*): runs the webhook handler logic
 *   directly so the bounty transitions to "paid" immediately.
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
        { error: "Only the poster can simulate payment" },
        { status: 403 },
      );
    }

    const tx = await getTransactionByBountyId(bountyId);
    if (!tx) {
      return NextResponse.json(
        { error: "No payment yet. Accept a helper first" },
        { status: 400 },
      );
    }

    if (tx.status === "paid" || tx.status === "released") {
      return NextResponse.json(
        { error: "Payment already completed", status: tx.status },
        { status: 400 },
      );
    }

    const va = tx.squad_virtual_account_ref;
    if (!va) {
      return NextResponse.json(
        { error: "No virtual account number on transaction" },
        { status: 400 },
      );
    }

    const amount = Number(tx.amount);

    // Call Squad simulate (or get mock response)
    const sim = await squadSimulatePayment(va, amount);
    if (!sim.ok) {
      return NextResponse.json(
        {
          error: "Squad simulation failed",
          detail: sim.raw,
        },
        { status: 502 },
      );
    }

    // For real Squad VAs, the webhook will arrive separately from Squad
    if (!sim.isMock) {
      return NextResponse.json({
        ok: true,
        message:
          "Simulation sent to Squad. The webhook will fire shortly and update the bounty status.",
        simulated_via: "squad_api",
      });
    }

    // For mock VAs, we need to run the webhook logic ourselves
    const mockRef = `SIM_${bountyId}_${Date.now()}`;

    const updated = await updateTransactionPaid(tx.id, mockRef);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update transaction" },
        { status: 500 },
      );
    }

    // Update bounty status to "paid"
    const { data: posterRow } = await supabaseAdmin
      .from("profiles")
      .select("clerk_id")
      .eq("id", bounty.poster_id)
      .single();

    if (posterRow?.clerk_id) {
      await updateBounty(
        bountyId,
        posterRow.clerk_id as string,
        { status: "paid" },
      );
    }

    // Notify provider
    await createNotification({
      user_id: tx.provider_id,
      type: "payment_confirmed",
      title: "Money received",
      body: "Money received. You can start the job now.",
      related_bounty_id: bountyId,
    });

    const provider = await getProfileById(tx.provider_id);
    const phone = normalizeNigerianPhone(provider?.phone_number);
    if (phone) {
      await squadSendSms(
        phone,
        "Money received. You can start the job now.",
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment done. This job is now paid.",
      simulated_via: "mock",
      transaction_status: "paid",
    });
  } catch (error) {
    console.error("Simulate payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
