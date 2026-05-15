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
import { COPY } from "@/lib/copy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseVirtualAccountNumber(body: Record<string, unknown>): string | null {
  const n =
    body.virtual_account_number ??
    body.Virtual_Account_Number ??
    (body.data as Record<string, unknown> | undefined)?.virtual_account_number;
  return n != null && String(n).trim() ? String(n).trim() : null;
}

function parseTransactionRef(body: Record<string, unknown>): string | null {
  const data = (body.data ?? {}) as Record<string, unknown>;
  const r =
    body.transaction_ref ??
    body.transaction_reference ??
    body.reference ??
    body.TransactionRef ??
    data.transaction_ref ??
    data.transaction_reference ??
    data.reference;
  return r != null && String(r).trim() ? String(r).trim() : null;
}

function isChargeCompleted(body: Record<string, unknown>): boolean {
  const ev = String(body.Event ?? body.event ?? body.EventType ?? "").toLowerCase();
  if (ev === "charge_completed") return true;
  if (ev === "payment.success") return true;
  if (body.channel === "virtual-account" && body.transaction_indicator === "C") return true;
  const data = (body.data ?? {}) as Record<string, unknown>;
  const status = String(data.transaction_status ?? body.status ?? "").toLowerCase();
  if (status === "success" || status === "completed" || status === "successful") return true;
  return false;
}

// ---------------------------------------------------------------------------
// Core handler — extracted so it can be re-used by verify-payment route
// ---------------------------------------------------------------------------

async function handleSuccessfulPayment(
  tx: { id: string; bounty_id: string; provider_id: string; status: string },
  squadRef: string | null,
): Promise<{ ok: boolean; duplicate?: boolean }> {
  if (tx.status === "paid" || tx.status === "released") {
    return { ok: true, duplicate: true };
  }

  const updated = await updateTransactionPaid(tx.id, squadRef);
  if (!updated) return { ok: false };

  const bounty = await getBountyById(tx.bounty_id);
  if (!bounty) return { ok: false };

  const { data: posterRow } = await supabaseAdmin
    .from("profiles")
    .select("clerk_id")
    .eq("id", bounty.poster_id)
    .single();

  if (posterRow?.clerk_id) {
    await updateBounty(tx.bounty_id, posterRow.clerk_id as string, {
      status: "paid",
    });
  }

  await createNotification({
    user_id: tx.provider_id,
    type: "payment_confirmed",
    title: COPY.PAYMENT.PROVIDER_PAID_TITLE,
    body: COPY.PAYMENT.PROVIDER_PAID_BODY,
    related_bounty_id: tx.bounty_id,
  });

  const provider = await getProfileById(tx.provider_id);
  const phone = normalizeNigerianPhone(provider?.phone_number);
  if (phone) {
    await squadSendSms(phone, COPY.PAYMENT.PROVIDER_PAID_BODY);
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/squad
// ---------------------------------------------------------------------------

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

    const squadRef = parseTransactionRef(body);

    // ── Strategy 1: match by our transaction_ref stored on the tx row ──
    if (squadRef) {
      const { data: txRow } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("squad_transaction_ref", squadRef)
        .maybeSingle();

      if (txRow) {
        const result = await handleSuccessfulPayment(txRow, squadRef);
        if (!result.ok) {
          return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
        }
        return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false }, { status: 200 });
      }
    }

    // ── Strategy 2: match by virtual account number (VA flow) ──
    const va = parseVirtualAccountNumber(body);
    if (va) {
      const tx = await getTransactionByVirtualAccountRef(va);
      if (tx) {
        const result = await handleSuccessfulPayment(tx, squadRef);
        if (!result.ok) {
          return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
        }
        return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false }, { status: 200 });
      }
    }

    // ── Strategy 3: match by bounty_id in metadata ──
    const data = (body.data ?? {}) as Record<string, unknown>;
    const meta = (data.metadata ?? body.metadata ?? {}) as Record<string, unknown>;
    const bountyIdFromMeta = String(meta.bounty_id ?? "").trim() || null;

    if (bountyIdFromMeta) {
      const { data: txRow } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("bounty_id", bountyIdFromMeta)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (txRow) {
        const result = await handleSuccessfulPayment(txRow, squadRef);
        if (!result.ok) {
          return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
        }
        return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false }, { status: 200 });
      }
    }

    // Could not match — log and return 200 to avoid Squad retries
    console.warn("[squad-webhook] Could not match transaction for ref:", squadRef, "va:", va);
    return NextResponse.json({ ok: true, unmatched: true }, { status: 200 });
  } catch (error) {
    console.error("Squad webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
