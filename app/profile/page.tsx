"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import { ArrowPathIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, UserIcon, PhoneIcon, CreditCardIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";


function FormField({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-mute" />}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-[24px] border px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-mute";
const inputStyle = {
  background: "var(--secondary)",
  borderColor: "var(--border)",
  color: "var(--foreground)",
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>([]);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const p = await res.json();
        setUsername(p.username || "");
        setFullName(p.full_name || "");
        setPhone(p.phone_number || "");
        setAccountNumber(p.account_number || "");
        setBankCode(p.bank_code || "");
      }
      setLoading(false);
    })();
  }, [isLoaded, user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        setBankList(data.banks ?? []);
      } catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    if (!bankCode || accountNumber.length !== 10) {
      setAccountName(null);
      setAccountError("");
      return;
    }
    const timer = setTimeout(async () => {
      setVerifyingAccount(true);
      setAccountError("");
      try {
        const res = await fetch("/api/verify-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber }),
        });
        if (res.ok) {
          const data = await res.json();
          setAccountName(data.account_name);
          setAccountError("");
        } else {
          setAccountName(null);
          setAccountError("Could not resolve account name. Check the bank and account number.");
        }
      } catch {
        setAccountName(null);
        setAccountError("Could not verify account. Please try again.");
      } finally {
        setVerifyingAccount(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [bankCode, accountNumber]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        full_name: fullName,
        phone_number: phone,
        account_number: accountNumber,
        bank_code: bankCode,
      }),
    });
    setSaving(false);
    if (!res.ok) setMessage({ type: "error", text: COPY.PROFILE.ERROR });
    else setMessage({ type: "success", text: COPY.PROFILE.SUCCESS });
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Sign in to manage your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <h1
          className="text-2xl font-bold text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          {COPY.PROFILE.TITLE}
        </h1>
        <p className="mt-1 mb-8 text-sm text-muted-foreground">
          {COPY.PROFILE.SUBTITLE}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <ArrowPathIcon className="h-7 w-7 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <div
            className="rounded-[24px] border bg-background p-6 space-y-5"
            style={{ borderColor: "var(--border)" }}
          >
            <FormField label={COPY.PROFILE.FIELD_USERNAME} icon={UserIcon}>
              <input
                className={inputCls}
                style={inputStyle}
                value={username}
                placeholder="yourhandle"
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--ring)";
                  e.target.style.background = "var(--background)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--secondary)";
                }}
              />
            </FormField>

            <FormField label={COPY.PROFILE.FIELD_FULL_NAME} icon={UserIcon}>
              <input
                className={inputCls}
                style={inputStyle}
                value={fullName}
                placeholder="Your full name"
                onChange={(e) => setFullName(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--ring)";
                  e.target.style.background = "var(--background)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--secondary)";
                }}
              />
            </FormField>

            <FormField label={COPY.PROFILE.FIELD_PHONE} icon={PhoneIcon} hint="Used to contact you about accepted bounties.">
              <input
                className={inputCls}
                style={inputStyle}
                value={phone}
                placeholder="0801 234 5678"
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--ring)";
                  e.target.style.background = "var(--background)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--secondary)";
                }}
              />
            </FormField>

            <div
              className="rounded-[24px] border p-4 space-y-4"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {COPY.PROFILE.PAYOUT_TITLE}
                </h2>
                <p className="mt-0.5 text-xs text-mute">
                  {COPY.PROFILE.PAYOUT_SUBTITLE}
                </p>
              </div>

              <FormField label={COPY.PROFILE.FIELD_BANK_NAME} icon={BuildingOffice2Icon} hint={COPY.PROFILE.BANK_NAME_HINT}>
                <div className="relative">
                  <select
                    className={inputCls + " appearance-none"}
                    style={inputStyle}
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.boxShadow = "0 0 0 3px var(--ring)";
                      e.target.style.background = "var(--background)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "var(--secondary)";
                    }}
                  >
                    <option value="" disabled>Select your bank</option>
                    {bankList.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--mute)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </FormField>

              <FormField label={COPY.PROFILE.FIELD_ACCOUNT} icon={CreditCardIcon} hint="Must be exactly 10 digits.">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={accountNumber}
                  placeholder="0123456789"
                  maxLength={10}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 0 3px var(--ring)";
                    e.target.style.background = "var(--background)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "var(--secondary)";
                  }}
                />
                {verifyingAccount && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--mute)" }} />
                    <span className="text-xs" style={{ color: "var(--mute)" }}>{COPY.PROFILE.VERIFYING}</span>
                  </div>
                )}
                {accountName && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--positive)" }} />
                    <span className="text-xs" style={{ color: "var(--positive)" }}>{accountName}</span>
                  </div>
                )}
                {accountError && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--negative)" }} />
                    <span className="text-xs" style={{ color: "var(--negative)" }}>{accountError}</span>
                  </div>
                )}
              </FormField>
            </div>

            {message && (
              <div
                className="flex items-center gap-2 rounded-[24px] border p-3 text-sm"
                style={
                  message.type === "success"
                    ? { background: "var(--primary-pale)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)", color: "var(--positive-deep)" }
                    : { background: "color-mix(in srgb, var(--negative) 10%, transparent)", borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)", color: "var(--negative)" }
                }
              >
                {message.type === "success" ? (
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <button
              onClick={() => void save()}
              disabled={saving}
              className="w-full rounded-[24px] py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--primary)" }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" /> {COPY.PROFILE.SAVING}
                </span>
              ) : COPY.PROFILE.SAVE}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
