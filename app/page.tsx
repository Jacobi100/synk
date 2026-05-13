"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  activeBounties: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
}

const SYMBOLS = [
  { sym: "∑", style: { top: "12%",  right: "8%",   fontSize: 14, opacity: 0.5 } },
  { sym: "π", style: { top: "28%",  right: "18%",  fontSize: 11, opacity: 0.35 } },
  { sym: "∞", style: { top: "55%",  right: "6%",   fontSize: 16, opacity: 0.4 } },
  { sym: "∂", style: { top: "70%",  right: "22%",  fontSize: 10, opacity: 0.3 } },
  { sym: "√", style: { top: "18%",  right: "32%",  fontSize: 12, opacity: 0.25 } },
  { sym: "λ", style: { top: "80%",  right: "12%",  fontSize: 13, opacity: 0.3 } },
  { sym: "∫", style: { top: "40%",  right: "3%",   fontSize: 15, opacity: 0.35 } },
  { sym: "ε", style: { top: "8%",   right: "46%",  fontSize: 10, opacity: 0.2 } },
];

export default function Home() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    activeBounties: 0,
    inProgress: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/bounties?limit=1000");
        const bounties = (await res.json()) as Bounty[];
        setStats({
          activeBounties: bounties.filter((b) => b.status === "open").length,
          inProgress:     bounties.filter((b) => b.status === "in_progress").length,
          completed:      bounties.filter((b) => b.status === "completed").length,
          totalEarnings:  bounties
            .filter((b) => b.status === "completed")
            .reduce((s: number, b: Bounty) => s + (b.price_max || b.price_min || 0), 0),
        });
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero — dark ink section */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--bg-ink)" }}
      >
        {/* Floating symbols */}
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          {SYMBOLS.map(({ sym, style }) => (
            <span
              key={sym + JSON.stringify(style)}
              className="absolute font-mono"
              style={{
                ...style,
                color: "var(--symbol-float-dark)",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {sym}
            </span>
          ))}
        </div>

        {/* Gradient orb */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(94,58,255,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-xl">
            <p
              className="mb-3 font-mono text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--violet3)" }}
            >
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1
              className="mb-4 text-4xl font-bold sm:text-5xl"
              style={{ color: "var(--text-inv)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              Your bounty<br />command centre
            </h1>
            <p className="mb-8 text-base leading-relaxed" style={{ color: "var(--text-inv2)" }}>
              Post tasks and earn money from professionals — all under escrow protection.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/bounties/create"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: "var(--violet)",
                  boxShadow: "var(--shadow-violet)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--violet2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--violet)")}
              >
                <Plus className="h-4 w-4" />
                Post a bounty
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: "var(--border-ink2)",
                  color: "var(--text-inv2)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--violet3)"; e.currentTarget.style.color = "var(--text-inv)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-ink2)"; e.currentTarget.style.color = "var(--text-inv2)"; }}
              >
                <Search className="h-4 w-4" />
                Browse feed
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
          {[
            { label: "Active Bounties", value: stats.activeBounties, icon: Briefcase, iconColor: "var(--violet)" },
            { label: "In Progress",     value: stats.inProgress,     icon: Clock,     iconColor: "#d97706" },
            { label: "Completed",       value: stats.completed,      icon: CheckCircle, iconColor: "var(--success-color)" },
            { label: "Total Earnings",  value: `₦${stats.totalEarnings.toLocaleString()}`, icon: TrendingUp, iconColor: "var(--violet)" },
          ].map(({ label, value, icon: Icon, iconColor }) => (
            <div
              key={label}
              className="rounded-xl border bg-white p-5"
              style={{ borderColor: "var(--border)", boxShadow: "var(--synk-shadow)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text3)" }}>{label}</p>
                  {loading ? (
                    <Loader2 className="mt-2 h-5 w-5 animate-spin" style={{ color: "var(--violet)" }} />
                  ) : (
                    <p className="mt-1.5 text-2xl font-bold" style={{ color: "var(--text)" }}>
                      {value}
                    </p>
                  )}
                </div>
                <Icon className="h-8 w-8 opacity-10" style={{ color: iconColor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action cards */}
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Post card */}
          <div
            className="relative overflow-hidden rounded-xl p-8"
            style={{ background: "var(--bg-ink2)", border: "1px solid var(--border-ink)" }}
          >
            <div
              className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "rgba(94,58,255,0.12)" }}
            />
            <Plus className="mb-4 h-10 w-10 opacity-70" style={{ color: "var(--violet3)" }} />
            <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-inv)" }}>
              Post a bounty
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-inv2)" }}>
              Offer your services or request help from skilled professionals.
            </p>
            <Link
              href="/bounties/create"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "var(--violet)", boxShadow: "var(--shadow-violet)" }}
            >
              Create bounty <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Browse card */}
          <div
            className="relative overflow-hidden rounded-xl border bg-white p-8"
            style={{ borderColor: "var(--border)", boxShadow: "var(--synk-shadow)" }}
          >
            <Search className="mb-4 h-10 w-10 opacity-20" style={{ color: "var(--violet)" }} />
            <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text)" }}>
              Browse bounties
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text2)" }}>
              Find open tasks near you and apply to start earning.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--violet)] hover:text-[var(--violet)]"
              style={{ borderColor: "var(--border2)", color: "var(--text)" }}
            >
              Browse feed <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
