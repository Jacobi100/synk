import { createHmac } from "crypto";

const SQUAD_BASE =
  process.env.SQUAD_API_BASE_URL ?? "https://sandbox-api-d.squadco.com";

function squadSecret(): string {
  const k = process.env.SQUAD_SECRET_KEY;
  if (!k) throw new Error("SQUAD_SECRET_KEY is not configured");
  return k;
}

function squadHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${squadSecret()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function squadSendSms(phone080: string, message: string): Promise<void> {
  const res = await fetch(`${SQUAD_BASE}/vas/sms`, {
    method: "POST",
    headers: squadHeaders(),
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
  try {
    const body = {
      ...payload,
      dob: payload.dob ?? process.env.SQUAD_VA_DOB ?? "01/01/1990",
      gender: payload.gender ?? "1",
      address: payload.address ?? "Lagos, Nigeria",
    };
    const res = await fetch(`${SQUAD_BASE}/virtual-account`, {
      method: "POST",
      headers: squadHeaders(),
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
  const res = await fetch(`${SQUAD_BASE}/payout/transfer`, {
    method: "POST",
    headers: squadHeaders(),
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

export function verifySquadWebhookSignature(
  rawBody: string,
  headerSig: string | null | undefined,
): boolean {
  const secret =
    process.env.SQUAD_WEBHOOK_SECRET ?? process.env.SQUAD_SECRET_KEY ?? "";
  if (!secret || !headerSig) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex").toUpperCase();
  return hash === headerSig.toUpperCase();
}
