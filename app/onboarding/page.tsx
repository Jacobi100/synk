"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COPY } from "@/lib/copy";
import {
  AtSymbolIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlobCard } from "@/components/unlumen-ui/blob-card";
import { ClippedCircle } from "@/components/unlumen-ui/clipped-circle";
import { GlowingBadge } from "@/components/unlumen-ui/glowing-badge";
import { AnimateCount } from "@/components/unlumen-ui/animate-count";
import {
  FloatingTooltip,
} from "@/components/unlumen-ui/floating-tooltip";

const STEPS = [COPY.ONBOARDING.STEP_ACCOUNT, COPY.ONBOARDING.STEP_PROFILE, COPY.ONBOARDING.STEP_DONE];

function AvatarPlaceholder({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div className="relative mx-auto mb-4 w-fit">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
        }}
      >
        {initials}
      </div>
      <div className="absolute -bottom-1 -right-1">
        <GlowingBadge variant="success" pulse={true} dot={true}>
          online
        </GlowingBadge>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            {i < current ? (
              <GlowingBadge variant="success" pulse={false} dot={false}>
                ✓
              </GlowingBadge>
            ) : i === current ? (
              <GlowingBadge variant="info" pulse={true} dot={true}>
                <AnimateCount>{i + 1}</AnimateCount>
              </GlowingBadge>
            ) : (
              <GlowingBadge variant="neutral" pulse={false} dot={false}>
                {i + 1}
              </GlowingBadge>
            )}
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

const CARD_LIGHT = ["#9fe870", "#b8f58e", "#7bcf50", "#cdffad"];
const CARD_DARK = ["#4a7a30", "#5e9e3e", "#3a6626", "#7bcf50"];
const CARD_GLOW = ["#9fe870", "#b8f58e", "#7bcf50", "#cdffad", "#9fe870"];

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
      setError(error || COPY.ONBOARDING.ERROR);
      setLoading(false);
      return;
    }
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0e0f0c]">
        <ArrowPathIcon className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

  return (
    <FloatingTooltip.Provider>
      <div className="flex min-h-[100dvh] font-sans">
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex md:w-[45%]"
          style={{ background: "linear-gradient(180deg, #0e0f0c 0%, #4a7a30 56%, #0e0f0c 96%)" }}
        >
          <ClippedCircle
            circleClassName="bg-white/10"
            circleSize={600}
          />
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
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[24px]"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <BoltIcon className="h-5 w-5 text-white" />
            </div>
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
          className="flex flex-1 items-center justify-center p-6 md:p-8 bg-[#0e0f0c]"
        >
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center md:hidden">
              <div
                className="flex items-center gap-2.5 rounded-[24px] px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <BoltIcon className="h-5 w-5 text-white" />
                <span className="text-[15px] font-bold tracking-tight text-white">
                  {COPY.ONBOARDING.BRAND}
                </span>
              </div>
            </div>

            <BlobCard
              lightColors={CARD_LIGHT}
              darkColors={CARD_DARK}
              glowColors={CARD_GLOW}
              headerHeight={200}
              header={
                <div className="pt-6 text-center">
                  <AvatarPlaceholder name={displayName} />
                  <h1
                    className="mb-1 text-2xl font-bold text-white"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {COPY.ONBOARDING.TITLE}
                  </h1>
                  <p className="text-sm text-white/70">
                    {COPY.ONBOARDING.STEP_OF(1, STEPS.length)}
                  </p>
                </div>
              }
            >
              <div className="px-8 pb-8 pt-6">
                <StepIndicator current={1} />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" style={{ color: "var(--foreground)" }}>
                      {COPY.PROFILE.FIELD_USERNAME}
                    </Label>
                    <FloatingTooltip.Trigger
                      content="Pick a unique handle"
                      description="This will be your public profile URL"
                    >
                      <div className="relative">
                        <AtSymbolIcon
                          className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
                          style={{ color: "var(--mute)" }}
                        />
                        <Input
                          id="username" name="username" type="text"
                          placeholder="yourhandle"
                          required autoComplete="username"
                          className="pl-9"
                        />
                      </div>
                    </FloatingTooltip.Trigger>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone_number" style={{ color: "var(--foreground)" }}>
                      {COPY.PROFILE.FIELD_PHONE}
                    </Label>
                    <FloatingTooltip.Trigger
                      content="Nigerian number preferred"
                      description={COPY.ONBOARDING.PHONE_HINT}
                    >
                      <div className="relative">
                        <PhoneIcon
                          className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
                          style={{ color: "var(--mute)" }}
                        />
                        <Input
                          id="phone_number" name="phone_number" type="tel"
                          placeholder={COPY.ONBOARDING.PHONE_PLACEHOLDER}
                          required autoComplete="tel"
                          className="pl-9"
                        />
                      </div>
                    </FloatingTooltip.Trigger>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" style={{ color: "var(--foreground)" }}>
                      {COPY.ONBOARDING.FIELD_DOB}
                    </Label>
                    <FloatingTooltip.Trigger
                      content="Must be 18+"
                      description={COPY.ONBOARDING.DOB_HINT}
                    >
                      <div className="relative">
                        <CalendarDaysIcon
                          className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
                          style={{ color: "var(--mute)" }}
                        />
                        <Input
                          id="date_of_birth" name="date_of_birth" type="date"
                          required
                          className="pl-9"
                        />
                      </div>
                    </FloatingTooltip.Trigger>
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
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-[24px] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
            </BlobCard>

            <p className="mt-5 text-center text-xs text-mute">
              Your data is encrypted and never shared without your consent.
            </p>
          </div>
        </div>
      </div>
    </FloatingTooltip.Provider>
  );
}
