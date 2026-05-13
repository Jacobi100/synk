import {
  getBountyById,
  getApplicationById,
  getProfileUUID,
  updateApplicationStatus,
  rejectOtherApplications,
  updateBounty,
  createTransactionRow,
  getProfileById,
} from "@/lib/bounty";
import { squadCreateVirtualAccount, squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";
import { createNotification } from "@/lib/notifications";

function splitName(full: string | null | undefined): { first: string; last: string } {
  if (!full?.trim()) return { first: "Synk", last: "Customer" };
  const p = full.trim().split(/\s+/);
  if (p.length === 1) return { first: p[0], last: "User" };
  return { first: p[0], last: p.slice(1).join(" ") };
}

export async function acceptBountyApplication(clerkUserId: string, bountyId: string, applicationId: string) {
  const bounty = await getBountyById(bountyId);
  if (!bounty) return { error: "Bounty not found" as const, status: 404 };

  const posterUUID = await getProfileUUID(clerkUserId);
  if (!posterUUID || bounty.poster_id !== posterUUID) {
    return { error: "Forbidden", status: 403 as const };
  }

  const application = await getApplicationById(applicationId);
  if (!application || application.bounty_id !== bountyId) {
    return { error: "Application not found", status: 404 as const };
  }
  if (application.status !== "pending") {
    return { error: "This application has already been reviewed", status: 400 as const };
  }

  const amount = Number(bounty.price_max ?? bounty.price_min ?? 0);
  if (!amount || amount <= 0) {
    return { error: "Set a price on the bounty before accepting a provider", status: 400 as const };
  }

  const platformFee = Math.round(amount * 0.05 * 100) / 100;
  const providerPayout = Math.round((amount - platformFee) * 100) / 100;

  const updatedApp = await updateApplicationStatus(applicationId, "accepted");
  if (!updatedApp) return { error: "Failed to accept application", status: 500 as const };

  await rejectOtherApplications(bountyId, applicationId);

  const poster = await getProfileById(posterUUID);
  const provider = await getProfileById(application.provider_id);
  if (!poster || !provider) return { error: "Profile missing", status: 500 as const };

  const { first: fn, last: ln } = splitName(poster.full_name);
  const mobile = normalizeNigerianPhone(poster.phone_number) ?? "08000000000";

  const beneficiary =
    process.env.SQUAD_MERCHANT_ACCOUNT ?? process.env.SQUAD_SETTLEMENT_ACCOUNT ?? "";
  const bankCode = process.env.SQUAD_MERCHANT_BANK_CODE ?? "058";
  const bvn = process.env.SQUAD_ESCROW_BVN ?? process.env.SQUAD_VA_BVN ?? "00000000000";

  let vaRef: string | null = null;
  if (beneficiary && bvn.length >= 10) {
    const va = await squadCreateVirtualAccount({
      customer_identifier: `bounty_${bountyId}`,
      first_name: fn,
      last_name: ln,
      mobile_num: mobile,
      email: poster.email || undefined,
      bvn,
      bank_code: bankCode,
      beneficiary_account: beneficiary.replace(/\D/g, "").slice(0, 10),
    });
    vaRef = va?.virtualAccountNumber ?? null;
  }

  if (!vaRef) {
    vaRef = `MOCKVA${bountyId.replace(/-/g, "").slice(0, 10)}`;
    console.warn("Squad VA unavailable — using mock account number for development");
  }

  const updatedBounty = await updateBounty(bountyId, clerkUserId, { status: "in_progress" });
  if (!updatedBounty) return { error: "Failed to update bounty", status: 500 as const };

  const tx = await createTransactionRow({
    bounty_id: bountyId,
    poster_id: posterUUID,
    provider_id: application.provider_id,
    squad_virtual_account_ref: vaRef,
    amount,
    platform_fee: platformFee,
    provider_payout: providerPayout,
  });
  if (!tx) return { error: "Failed to create transaction", status: 500 as const };

  await createNotification({
    user_id: application.provider_id,
    type: "application_accepted",
    title: "Application accepted",
    body: "Your application was accepted. Pay the poster’s virtual account to begin once they fund escrow.",
    related_bounty_id: bountyId,
  });

  const providerPhone = normalizeNigerianPhone(provider.phone_number);
  if (providerPhone) {
    await squadSendSms(
      providerPhone,
      `Your application for "${bounty.title}" was accepted. Check the app for payment instructions.`,
    );
  }

  return {
    ok: true as const,
    application: updatedApp,
    bounty: updatedBounty,
    transaction: tx,
    virtual_account_number: vaRef,
  };
}
