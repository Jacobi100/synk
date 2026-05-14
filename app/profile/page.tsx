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
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--text)" }}>
        {Icon && <Icon className="h-3.5 w-3.5" style={{ color: "var(--text3)" }} />}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: "var(--text3)" }}>{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-[var(--text3)]";
const inputStyle = {
  background: "var(--bg2)",
  borderColor: "var(--border)",
  color: "var(--text)",
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
        <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--text2)" }}>
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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          {COPY.PROFILE.TITLE}
        </h1>
        <p className="mt-1 mb-8 text-sm" style={{ color: "var(--text2)" }}>
          {COPY.PROFILE.SUBTITLE}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <ArrowPathIcon className="h-7 w-7 animate-spin" style={{ color: "var(--violet)" }} />
          </div>
        ) : (
          <div
            className="rounded-xl border bg-white p-6 shadow-[var(--synk-shadow)] space-y-5"
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
                  e.target.style.borderColor = "var(--violet)";
                  e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
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
                  e.target.style.borderColor = "var(--violet)";
                  e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
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
                  e.target.style.borderColor = "var(--violet)";
                  e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </FormField>

            {/* Payout section */}
            <div
              className="rounded-lg border p-4 space-y-4"
              style={{ borderColor: "var(--border)", background: "var(--bg2)" }}
            >
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {COPY.PROFILE.PAYOUT_TITLE}
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text3)" }}>
                  {COPY.PROFILE.PAYOUT_SUBTITLE}
                </p>
              </div>

              <FormField label={COPY.PROFILE.FIELD_BANK_CODE} icon={BuildingOffice2Icon} hint="e.g. 058 for GTBank, 044 for Access Bank">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={bankCode}
                  placeholder="058"
                  onChange={(e) => setBankCode(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--violet)";
                    e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "var(--bg2)";
                  }}
                />
              </FormField>

              <FormField label={COPY.PROFILE.FIELD_ACCOUNT} icon={CreditCardIcon} hint="Must be exactly 10 digits.">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={accountNumber}
                  placeholder="0123456789"
                  maxLength={10}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--violet)";
                    e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "var(--bg2)";
                  }}
                />
              </FormField>
            </div>

            {/* Feedback */}
            {message && (
              <div
                className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                style={
                  message.type === "success"
                    ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" }
                    : { background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }
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
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
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
