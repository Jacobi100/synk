import { createHmac } from "crypto";

const SQUAD_BASE =
  process.env.SQUAD_API_BASE_URL ?? "https://sandbox-api-d.squadco.com";

function squadSecret(): string | null {
  return process.env.SQUAD_SECRET_KEY || null;
}

function squadHeaders(secret: string): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function squadSendSms(phone080: string, message: string): Promise<void> {
  const secret = squadSecret();
  if (!secret) {
    console.log(`[MOCK SQUAD SMS] to ${phone080}: ${message}`);
    return;
  }
  const res = await fetch(`${SQUAD_BASE}/vas/sms`, {
    method: "POST",
    headers: squadHeaders(secret),
    body: JSON.stringify({
      phone_number: phone080,
      message,
      sender_id: "Bounty",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Squad SMS failed:", res.status, t);
  }
}

export type SquadVirtualAccountPayload = {
  customer_identifier: string;
  first_name: string;
  last_name: string;
  mobile_num: string;
  email?: string;
  bvn: string;
  bank_code: string;
  beneficiary_account: string;
  /** Optional fields Squad may require in production */
  dob?: string;
  gender?: string;
  address?: string;
};

/** Returns virtual account number / ref string, or null if API fails. */
export async function squadCreateVirtualAccount(
  payload: SquadVirtualAccountPayload,
): Promise<{ virtualAccountNumber: string; raw: unknown } | null> {
  const secret = squadSecret();
  if (!secret) {
    const mockVa = `MOCKVA${Date.now().toString().slice(-10)}`;
    console.log(`[MOCK SQUAD VA] Created for ${payload.customer_identifier}: ${mockVa}`);
    return { virtualAccountNumber: mockVa, raw: { mock: true, ...payload } };
  }

  try {
    const body = {
      ...payload,
      dob: payload.dob ?? process.env.SQUAD_VA_DOB ?? "01/01/1990",
      gender: payload.gender ?? "1",
      address: payload.address ?? "Lagos, Nigeria",
    };
    const res = await fetch(`${SQUAD_BASE}/virtual-account`, {
      method: "POST",
      headers: squadHeaders(secret),
      body: JSON.stringify(body),
    });
    const raw = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      console.error("Squad VA error:", res.status, raw);
      return null;
    }
    const data = (raw.data ?? raw) as Record<string, unknown>;
    const virtualAccountNumber = String(
      data.virtual_account_number ??
        data.account_number ??
        data.accountNumber ??
        data.reserved_account_number ??
        "",
    );
    if (!virtualAccountNumber) {
      console.error("Squad VA: missing account number in response", raw);
      return null;
    }
    return { virtualAccountNumber, raw };
  } catch (e) {
    console.error("Squad VA exception:", e);
    return null;
  }
}

export async function squadTransferPayout(params: {
  transaction_reference: string;
  amountKobo: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  remark?: string;
}): Promise<{ ok: boolean; raw: unknown }> {
  const secret = squadSecret();
  if (!secret) {
    console.log(`[MOCK SQUAD TRANSFER] ${params.amountKobo} kobo to ${params.account_number} (${params.bank_code}) - Ref: ${params.transaction_reference}`);
    return { ok: true, raw: { mock: true, ...params } };
  }

  const res = await fetch(`${SQUAD_BASE}/payout/transfer`, {
    method: "POST",
    headers: squadHeaders(secret),
    body: JSON.stringify({
      transaction_reference: params.transaction_reference,
      amount: params.amountKobo,
      bank_code: params.bank_code,
      account_number: params.account_number,
      account_name: params.account_name,
      currency_id: "NGN",
      remark: params.remark ?? "Synk bounty payout",
    }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Squad transfer error:", res.status, raw);
    return { ok: false, raw };
  }
  return { ok: true, raw };
}

/**
 * Simulate a payment into a virtual account.
 * - For real Squad VAs: calls Squad's sandbox simulate endpoint.
 * - For MOCKVA* accounts: returns a synthetic success so the caller
 *   can trigger the webhook handler directly.
 */
export async function squadSimulatePayment(
  virtualAccountNumber: string,
  amount: number,
): Promise<{ ok: boolean; isMock: boolean; raw: unknown }> {
  const isMock = virtualAccountNumber.startsWith("MOCKVA");

  if (isMock) {
    // No Squad API to call — the caller should invoke the webhook handler directly
    return {
      ok: true,
      isMock: true,
      raw: {
        simulated: true,
        virtual_account_number: virtualAccountNumber,
        amount,
      },
    };
  }

  // Real VA — call Squad sandbox simulate endpoint
  const secret = squadSecret();
  if (!secret) {
    console.error("[squad] No secret key for simulate payment");
    return { ok: false, isMock: false, raw: { error: "No SQUAD_SECRET_KEY" } };
  }

  try {
    const res = await fetch(`${SQUAD_BASE}/virtual-account/simulate/payment`, {
      method: "POST",
      headers: squadHeaders(secret),
      body: JSON.stringify({
        virtual_account_number: virtualAccountNumber,
        amount: String(amount),
      }),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Squad simulate payment error:", res.status, raw);
      return { ok: false, isMock: false, raw };
    }
    console.info("[squad] Simulate payment success:", raw);
    return { ok: true, isMock: false, raw };
  } catch (e) {
    console.error("Squad simulate payment exception:", e);
    return { ok: false, isMock: false, raw: { error: String(e) } };
  }
}

export function verifySquadWebhookSignature(
  rawBody: string,
  headerSig: string | null | undefined,
): boolean {
  const secret =
    process.env.SQUAD_WEBHOOK_SECRET ?? process.env.SQUAD_SECRET_KEY ?? "";
  if (!secret) return true; // Mock mode if no secret
  if (!headerSig) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex").toUpperCase();
  return hash === headerSig.toUpperCase();
}

