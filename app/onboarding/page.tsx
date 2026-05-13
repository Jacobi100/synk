"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Phone, Calendar, ArrowRight, Loader2, Zap } from "lucide-react";

const STEPS = ["Account", "Profile", "Done"];

function AvatarPlaceholder({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div className="relative mx-auto mb-6 w-fit">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, var(--violet), var(--violet2))",
          boxShadow: "var(--shadow-violet)",
        }}
      >
        {initials}
      </div>
      <span
        className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white"
        style={{ background: "var(--success-color)" }}
      >
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
              style={
                i < current
                  ? { background: "var(--success-color)", color: "#fff" }
                  : i === current
                  ? {
                      background: "var(--violet)",
                      color: "#fff",
                      boxShadow: "0 0 0 4px var(--violet-glow)",
                    }
                  : { background: "var(--bg3)", color: "var(--text3)" }
              }
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: i <= current ? "var(--violet)" : "var(--text3)" }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="mb-4 h-px w-10 transition-all"
              style={{ background: i < current ? "var(--violet)" : "var(--border)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const SYMBOLS = [
  { sym: "∑", style: { top: "10%", right: "8%",   fontSize: 13, opacity: 0.4 } },
  { sym: "π", style: { top: "25%", right: "16%",  fontSize: 10, opacity: 0.3 } },
  { sym: "∞", style: { top: "60%", right: "5%",   fontSize: 15, opacity: 0.35 } },
  { sym: "λ", style: { top: "75%", right: "20%",  fontSize: 11, opacity: 0.25 } },
  { sym: "∫", style: { top: "45%", right: "2%",   fontSize: 14, opacity: 0.3 } },
  { sym: "∂", style: { top: "15%", left:  "5%",   fontSize: 10, opacity: 0.2 } },
  { sym: "√", style: { top: "70%", left:  "3%",   fontSize: 12, opacity: 0.25 } },
];

const inputCls =
  "w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:opacity-50";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const phone_number = (form.elements.namedItem("phone_number") as HTMLInputElement).value;
    const date_of_birth = (form.elements.namedItem("date_of_birth") as HTMLInputElement).value;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone_number, date_of_birth }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setError(error || "Something went wrong");
      setLoading(false);
      return;
    }
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-ink)" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--violet3)" }} />
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--violet)";
    e.target.style.boxShadow = "0 0 0 3px var(--violet-glow)";
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "var(--bg2)" }}
    >
      {/* Subtle bg glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(94,58,255,0.07), transparent)",
        }}
      />

      {/* Floating symbols */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {SYMBOLS.map(({ sym, style }) => (
          <span
            key={sym + JSON.stringify(style)}
            className="absolute font-mono"
            style={{ ...style, color: "var(--symbol-float)", fontFamily: "var(--font-geist-mono, monospace)" }}
          >
            {sym}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-sm"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--violet2))" }}
            >
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
              Synk
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl bg-white p-8 shadow-xl"
          style={{ border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
        >
          <StepIndicator current={1} />
          <AvatarPlaceholder name={displayName} />

          <div className="mb-7 text-center">
            <h1
              className="mb-1.5 text-2xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
            >
              Complete your profile
            </h1>
            <p className="text-sm" style={{ color: "var(--text2)" }}>
              A few details to personalise your Synk experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
                Username
              </label>
              <div className="relative">
                <AtSign
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--text3)" }}
                />
                <input
                  id="username" name="username" type="text" placeholder="yourhandle"
                  required autoComplete="username"
                  className={inputCls}
                  style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
                  onFocus={focusInput} onBlur={blurInput}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
                Phone number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--text3)" }}
                />
                <input
                  id="phone_number" name="phone_number" type="tel"
                  placeholder="+234 801 234 5678" required autoComplete="tel"
                  className={inputCls}
                  style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
                  onFocus={focusInput} onBlur={blurInput}
                />
              </div>
            </div>

            {/* DOB */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
                Date of birth
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--text3)" }}
                />
                <input
                  id="date_of_birth" name="date_of_birth" type="date" required
                  className={inputCls}
                  style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
                  onFocus={focusInput} onBlur={blurInput}
                />
              </div>
            </div>

            {error && (
              <p
                className="rounded-lg border px-3 py-2.5 text-sm"
                style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: "var(--text3)" }}>
          Your data is encrypted and never shared without your consent.
        </p>
      </div>
    </main>
  );
}
