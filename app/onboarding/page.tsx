"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Phone,
  Calendar,
  ArrowRight,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEPS = ["Account", "Profile", "Done"];

function AvatarPlaceholder({ name }: { name?: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="relative mx-auto mb-6 size-20">
      <div className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xl font-semibold text-white shadow-lg ring-4 ring-white">
        {initials}
      </div>
      <span className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
        <span className="size-2 rounded-full bg-white" />
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
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                i < current
                  ? "bg-violet-600 text-white"
                  : i === current
                    ? "bg-violet-600 text-white ring-4 ring-violet-200"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                i <= current ? "text-violet-600" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mb-4 h-px w-10 transition-all",
                i < current ? "bg-violet-600" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const OnboardingPage = () => {
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
    const username = (
      form.elements.namedItem("username") as HTMLInputElement
    ).value;
    const phone_number = (
      form.elements.namedItem("phone_number") as HTMLInputElement
    ).value;
    const date_of_birth = (
      form.elements.namedItem("date_of_birth") as HTMLInputElement
    ).value;

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName =
    user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-violet-50 to-indigo-50 px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-indigo-600">
              <Zap className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Synk
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/90 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur-sm">
          <StepIndicator current={1} />

          <AvatarPlaceholder name={displayName} />

          <div className="mb-8 text-center">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-foreground">
              Complete your profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Just a few details to personalise your Synk experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="yourhandle"
                  required
                  autoComplete="username"
                  className="pl-9 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-foreground">
                Phone number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  required
                  autoComplete="tel"
                  className="pl-9 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Date of birth */}
            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth" className="text-foreground">
                Date of birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  required
                  className="pl-9 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="mt-2 w-full gap-2 bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data is encrypted and never shared without your consent.
        </p>
      </div>
    </main>
  );
};

export default OnboardingPage;
