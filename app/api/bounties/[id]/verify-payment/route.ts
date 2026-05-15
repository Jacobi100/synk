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
import { squadVerifyTransaction } from "@/lib/squad";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";

/**
 * POST /api/bounties/[id]/verify-payment
 * Body: { transaction_ref: string }
 *
 * Verifies a Squad transaction and, if successful, marks the bounty as paid.
 * Called by the frontend after Squad checkout closes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bountyId } = await params;
    const body = (await request.json()) as { transaction_ref?: string };
    const txRef = body.transaction_ref;

    if (!txRef) {
      return NextResponse.json(
        { error: "transaction_ref is required" },
        { status: 400 },
      );
    }

    const bounty = await getBountyById(bountyId);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const profileId = await getProfileUUID(userId);
    if (!profileId || bounty.poster_id !== profileId) {
      return NextResponse.json(
        { error: "Only the poster can verify payment" },
        { status: 403 },
      );
    }

    const tx = await getTransactionByBountyId(bountyId);
    if (!tx) {
      return NextResponse.json(
        { error: "No transaction found for this bounty" },
        { status: 400 },
      );
    }

    // Already paid — idempotent
    if (tx.status === "paid" || tx.status === "released") {
      return NextResponse.json({ ok: true, status: tx.status });
    }

    // Verify with Squad
    const verify = await squadVerifyTransaction(txRef);

    if (!verify.ok) {
      return NextResponse.json(
        { error: "Squad verification failed", detail: verify.raw },
        { status: 502 },
      );
    }

    // Squad success states: "success" | "completed"
    const isSuccess =
      verify.status === "success" ||
      verify.status === "completed" ||
      verify.status === "successful";

    if (!isSuccess) {
      return NextResponse.json(
        {
          ok: false,
          squad_status: verify.status,
          message: "Payment not yet confirmed by Squad",
        },
        { status: 200 },
      );
    }

    // Mark transaction as paid
    const updated = await updateTransactionPaid(tx.id, txRef);
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
      await updateBounty(bountyId, posterRow.clerk_id as string, {
        status: "paid",
      });
    }

    // Notify provider
    await createNotification({
      user_id: tx.provider_id,
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Payment confirmed. Proceed with the service.",
      related_bounty_id: bountyId,
    });

    const provider = await getProfileById(tx.provider_id);
    const phone = normalizeNigerianPhone(provider?.phone_number);
    if (phone) {
      await squadSendSms(phone, "Payment confirmed. Proceed with the service.");
    }

    return NextResponse.json({
      ok: true,
      status: "paid",
      squad_status: verify.status,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
