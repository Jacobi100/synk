"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { COPY } from "@/lib/copy";
import {
  AtSymbolIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { Hashvatar } from "hashvatar/react";
import { padBankCode } from "@/lib/nuban";

const STEPS = [COPY.ONBOARDING.STEP_ACCOUNT, COPY.ONBOARDING.STEP_PROFILE, COPY.ONBOARDING.STEP_DONE];

function AvatarPlaceholder({ userId, name }: { userId?: string | null; name?: string | null }) {
  return (
    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--positive)]">
      <Hashvatar hash={userId ?? name ?? "default"} size={76} mode="dither" />
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
              style={{
                background: i <= current ? "var(--primary)" : "var(--secondary)",
                color: i <= current ? "var(--primary-foreground)" : "var(--mute)",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: i <= current ? "var(--primary)" : "var(--mute)" }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="mb-4 h-px w-8 transition-all"
              style={{ background: i < current ? "var(--primary)" : "var(--border)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const SYMBOLS = [
  { sym: "∑", style: { top: "12%",  right: "18%", fontSize: 14, opacity: 0.3 } },
  { sym: "π", style: { top: "28%",  right: "28%", fontSize: 11, opacity: 0.2 } },
  { sym: "∞", style: { top: "55%",  right: "14%", fontSize: 16, opacity: 0.25 } },
  { sym: "λ", style: { top: "75%",  right: "30%", fontSize: 12, opacity: 0.2 } },
  { sym: "∫", style: { top: "40%",  right: "8%",  fontSize: 14, opacity: 0.25 } },
  { sym: "∂", style: { top: "15%",  left:  "12%", fontSize: 10, opacity: 0.15 } },
  { sym: "√", style: { top: "68%",  left:  "10%", fontSize: 12, opacity: 0.2 } },
];


export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [bankSelectOpen, setBankSelectOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const bankSelectRef = useRef<HTMLDivElement>(null);

  const inputBase =
    "w-full rounded-[24px] border bg-secondary px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:bg-background focus:shadow-[0_0_0_2px_var(--ring)]";
  const inputStyle: React.CSSProperties = {
    borderColor: "var(--border)",
    color: "var(--foreground)",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const phone_number = (form.elements.namedItem("phone_number") as HTMLInputElement).value;
    const date_of_birth = (form.elements.namedItem("date_of_birth") as HTMLInputElement).value;
    const account_number = (form.elements.namedItem("account_number") as HTMLInputElement).value;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone_number, date_of_birth, bank_code: selectedBankCode, account_number }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setError(error || COPY.ONBOARDING.ERROR);
      setLoading(false);
      return;
    }
    router.push("/");
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        const banks = data.banks ?? [];
        setBankList(banks);
      } catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBankCode || accountNumber.length !== 10) {
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
          body: JSON.stringify({ bank_code: selectedBankCode || "", account_number: accountNumber }),
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
  }, [selectedBankCode, accountNumber]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bankSelectRef.current && !bankSelectRef.current.contains(e.target as Node))
        setBankSelectOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0e0f0c]">
        <ArrowPathIcon className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

  return (
      <div className="flex min-h-[100dvh] font-sans">
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex md:w-[45%]"
          style={{ background: "linear-gradient(-45deg, #000000 0%, #5E3AFF 56%, #11073D 96%)" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.2)_0%,transparent_60%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"
          />

          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            {SYMBOLS.map(({ sym, style }) => (
              <span
                key={sym + JSON.stringify(style)}
                className="absolute font-mono text-white/20"
                style={{
                  ...style,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                {sym}
              </span>
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            <Logo showText={false} white />
            <span className="text-2xl font-semibold tracking-tight text-white">
              {COPY.ONBOARDING.BRAND}
            </span>
          </div>

          <div className="relative z-10 max-w-md">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tighter text-white md:text-6xl">
              Complete your
              <br />
              profile.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/70 md:text-lg">
              {COPY.ONBOARDING.SUBTITLE}
            </p>
          </div>

          <div className="relative z-10 text-sm font-medium text-white/30">
            &copy; 2026 Synk
          </div>
        </div>

        <div
          className="flex flex-1 items-center justify-center p-6 md:p-8 bg-secondary overflow-visible"
        >
          <div className="w-full max-w-md overflow-visible">
            <div className="mb-8 flex justify-center md:hidden">
              <div className="flex items-center gap-2.5">
                <Logo showText={false} />
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {COPY.ONBOARDING.BRAND}
                </span>
              </div>
            </div>

            <div
              className="rounded-[24px] border bg-background p-6 space-y-5 overflow-visible"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-center">
                <AvatarPlaceholder userId={user?.id} name={displayName} />
                <h1
                  className="mb-1 text-2xl font-bold text-foreground"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {COPY.ONBOARDING.TITLE}
                </h1>
              </div>

              <StepIndicator current={1} />

              <form onSubmit={handleSubmit} className="space-y-4 overflow-visible">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground" htmlFor="username">
                      <AtSymbolIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {COPY.PROFILE.FIELD_USERNAME}
                    </label>
                    <input
                      id="username" name="username" type="text"
                      placeholder="yourhandle"
                      required autoComplete="username"
                      className={inputBase}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground" htmlFor="phone_number">
                      <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {COPY.PROFILE.FIELD_PHONE}
                    </label>
                    <input
                      id="phone_number" name="phone_number" type="tel"
                      placeholder={COPY.ONBOARDING.PHONE_PLACEHOLDER}
                      required autoComplete="tel"
                      className={inputBase}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground" htmlFor="date_of_birth">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {COPY.ONBOARDING.FIELD_DOB}
                    </label>
                    <input
                      id="date_of_birth" name="date_of_birth" type="date"
                      required
                      className={inputBase}
                      style={inputStyle}
                    />
                  </div>

                  {/* Bank details section */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Bank Account (for receiving payments)
                    </p>

                    {/* Account Number — first, then bank selection */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground" htmlFor="account_number">
                        <CreditCardIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        Account Number
                      </label>
                      <input
                        id="account_number" name="account_number" type="text"
                        placeholder="0123456789"
                        maxLength={10}
                        className={inputBase}
                        style={inputStyle}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      />
                      {verifyingAccount && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--mute)" }} />
                          <span className="text-xs" style={{ color: "var(--mute)" }}>{COPY.ONBOARDING.VERIFYING_ACCOUNT}</span>
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
                    </div>

                    {/* Bank Name */}
                    <div className="mt-3">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground" htmlFor="bank_code">
                        <BuildingOffice2Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {COPY.PROFILE.FIELD_BANK_NAME}
                      </label>
                      <div className="relative" ref={bankSelectRef}>
                        <button
                          id="bank_code"
                          type="button"
                          onClick={() => {
                            if (!bankSelectOpen && bankSelectRef.current) {
                              const rect = bankSelectRef.current.getBoundingClientRect();
                              setDropUp(rect.top >= 250);
                            }
                            setBankSelectOpen(!bankSelectOpen);
                          }}
                          className={`${inputBase} flex w-full items-center justify-between pr-10 cursor-pointer focus:shadow-[0_0_0_2px_var(--ring)]`}
                          style={inputStyle}
                        >
                          <span style={{ color: selectedBankCode ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {selectedBankCode
                              ? bankList.find((b) => padBankCode(b.code) === selectedBankCode)?.name
                              : COPY.ONBOARDING.BANK_SELECT}
                          </span>
                          <ChevronDownIcon
                            className={`h-4 w-4 text-muted-foreground transition-transform ${bankSelectOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {bankSelectOpen && (
                          <div
                            className={`absolute left-0 right-0 z-50 rounded-[24px] border bg-background shadow-lg py-1 max-h-60 overflow-y-auto hide-scrollbar ${
                              dropUp
                                ? "bottom-full mb-1"
                                : "top-full mt-1"
                            }`}
                            style={inputStyle}
                          >
                            {bankList.map((bank) => (
                              <button
                                key={bank.code}
                                type="button"
                                onClick={() => {
                                  setSelectedBankCode(padBankCode(bank.code));
                                  setBankSelectOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-secondary ${
                                  padBankCode(bank.code) === selectedBankCode
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-foreground"
                                }`}
                              >
                                {bank.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p
                      className="rounded-[24px] border px-3 py-2.5 text-sm"
                      style={{
                        background: "color-mix(in srgb, var(--negative) 10%, transparent)",
                        borderColor: "color-mix(in srgb, var(--negative) 30%, transparent)",
                        color: "var(--negative)",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit" disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-[24px] py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "var(--primary)" }}
                  >
                    {loading ? (
                      <><ArrowPathIcon className="h-4 w-4 animate-spin" /> {COPY.PROFILE.SAVING}</>
                    ) : (
                      <>{COPY.ONBOARDING.CONTINUE} <ArrowRightIcon className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
            </div>

            <p className="mt-5 text-center text-xs text-mute">
              Your data is encrypted and never shared without your consent.
            </p>
          </div>
        </div>
      </div>
  );
}
