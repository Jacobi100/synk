import { NextRequest, NextResponse } from "next/server";
import { verifySquadWebhookSignature } from "@/lib/squad";
import {
  getTransactionByVirtualAccountRef,
  updateTransactionPaid,
  getBountyById,
  updateBounty,
  getProfileById,
} from "@/lib/bounty";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";

function parseVirtualAccountNumber(body: Record<string, unknown>): string | null {
  const n =
    body.virtual_account_number ??
    body.Virtual_Account_Number ??
    (body.data as Record<string, unknown> | undefined)?.virtual_account_number;
  return n != null && String(n).trim() ? String(n).trim() : null;
}

function isChargeCompleted(body: Record<string, unknown>): boolean {
  const ev = String(body.Event ?? body.event ?? body.EventType ?? "").toLowerCase();
  if (ev === "charge_completed") return true;
  if (body.channel === "virtual-account" && body.transaction_indicator === "C") return true;
  if (body.status === "success" || body.status === "completed") return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("x-squad-encrypted-body");

    if (process.env.SQUAD_SKIP_WEBHOOK_VERIFY !== "true") {
      if (!verifySquadWebhookSignature(rawBody, sig)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    if (!isChargeCompleted(body)) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const va = parseVirtualAccountNumber(body);
    if (!va) {
      return NextResponse.json({ error: "Missing virtual account number" }, { status: 400 });
    }

    const tx = await getTransactionByVirtualAccountRef(va);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (tx.status === "paid" || tx.status === "released") {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    const squadRef =
      (body.transaction_reference as string) ||
      (body.reference as string) ||
      (body.TransactionRef as string) ||
      null;

    const updated = await updateTransactionPaid(tx.id, squadRef);
    if (!updated) return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });

    const bounty = await getBountyById(tx.bounty_id);
    if (!bounty) return NextResponse.json({ error: "Bounty missing" }, { status: 500 });

    const { data: posterRow } = await supabaseAdmin
      .from("profiles")
      .select("clerk_id")
      .eq("id", bounty.poster_id)
      .single();

    if (posterRow?.clerk_id) {
      await updateBounty(tx.bounty_id, posterRow.clerk_id as string, { status: "paid" });
    }

    await createNotification({
      user_id: tx.provider_id,
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: "Payment confirmed. Proceed with the service.",
      related_bounty_id: tx.bounty_id,
    });

    const provider = await getProfileById(tx.provider_id);
    const phone = normalizeNigerianPhone(provider?.phone_number);
    if (phone) {
      await squadSendSms(phone, "Payment confirmed. Proceed with the service.");
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Squad webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
