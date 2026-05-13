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

export async function completeBountyForPoster(clerkUserId: string, bountyId: string) {
  const bounty = await getBountyById(bountyId);
  if (!bounty) return { error: "Bounty not found", status: 404 as const };

  const posterUUID = await getProfileUUID(clerkUserId);
  if (!posterUUID || bounty.poster_id !== posterUUID) {
    return { error: "Forbidden", status: 403 as const };
  }

  if (bounty.status !== "paid") {
    return { error: "Bounty must be paid before completion and payout", status: 400 as const };
  }

  const tx = await getTransactionByBountyId(bountyId);
  if (!tx || tx.status !== "paid") {
    return { error: "No paid transaction for this bounty", status: 400 as const };
  }

  const provider = await getProfileById(tx.provider_id);
  if (!provider) return { error: "Provider profile not found", status: 500 as const };

  const acct = (provider.account_number ?? "").replace(/\D/g, "");
  const bank = (provider.bank_code ?? "").trim();
  const payout = Number(tx.provider_payout ?? 0);
  if (!acct || acct.length < 10 || !bank) {
    return {
      error: "Provider must add bank_code and account_number on their profile to receive payout",
      status: 400 as const,
    };
  }

  const ref = `synk_${bountyId}_${Date.now()}`;
  const amountKobo = Math.max(1, Math.round(payout * 100));
  const transfer = await squadTransferPayout({
    transaction_reference: ref,
    amountKobo,
    bank_code: bank,
    account_number: acct,
    account_name: provider.full_name?.trim() || "Synk Provider",
    remark: `Payout bounty ${bounty.title.slice(0, 40)}`,
  });

  if (!transfer.ok) {
    return { error: "Squad transfer failed — check server logs", status: 502 as const, detail: transfer.raw };
  }

  const released = await updateTransactionReleased(tx.id, ref);
  if (!released) return { error: "Failed to update transaction", status: 500 as const };

  const updatedBounty = await updateBounty(bountyId, clerkUserId, { status: "completed" });
  if (!updatedBounty) return { error: "Failed to update bounty", status: 500 as const };

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

/** Resolve accepted provider for UI (e.g. phone reveal). */
export async function getAcceptedProviderId(bountyId: string) {
  const app = await getAcceptedApplicationForBounty(bountyId);
  return app?.provider_id ?? null;
}
