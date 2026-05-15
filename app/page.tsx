"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Bounty } from "@/lib/types/bounty";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  WalletIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { AnimateCount } from "@/components/unlumen-ui/animate-count";
import { ShimmerSkeleton } from "@/components/unlumen-ui/shimmer-skeleton";
import { GlowingBadge } from "@/components/unlumen-ui/glowing-badge";
import { COPY } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import NearbyJobsMap from "@/components/map/NearbyJobsMap";

interface DashboardStats {
  activeBounties: number;
  inProgress: number;
  completed: number;
  accepted: number;
  totalEarnings: number;
}

interface StatCard {
  label: string;
  value: number;
  prefix?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
}

export default function Home() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    activeBounties: 0,
    inProgress: 0,
    completed: 0,
    accepted: 0,
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
          accepted:       bounties.filter((b) => b.status === "paid").length,
          totalEarnings:  bounties
            .filter((b) => b.status === "completed")
            .reduce((s: number, b: Bounty) => s + (b.price_max || b.price_min || 0), 0),
        });
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, [user]);

  const statCards: StatCard[] = [
    { label: COPY.HOME.ACTIVE_JOBS, value: stats.activeBounties, icon: BriefcaseIcon,   iconColor: "var(--primary)" },
    { label: COPY.HOME.IN_PROGRESS, value: stats.inProgress,     icon: ClockIcon,       iconColor: "var(--warning)" },
    { label: COPY.HOME.COMPLETED,   value: stats.completed,      icon: CheckCircleIcon, iconColor: "var(--positive)" },
    { label: COPY.HOME.ACCEPTED,    value: stats.accepted,       icon: CheckCircleIcon, iconColor: "var(--primary)" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="overflow-x-hidden bg-secondary">
        {/* Desktop: text + map */}
        <div className="hidden lg:mx-auto lg:flex lg:max-w-7xl lg:items-center lg:gap-8 lg:px-8 lg:py-20">
          <div className="max-w-2xl lg:w-1/2 lg:shrink-0">
          {user && (
            <div className="relative mb-3 inline-block">
              <GlowingBadge variant="info" dot={false} className="rounded-lg" style={{ marginBottom: 5 }}>
                {COPY.HOME.WELCOME(user?.firstName)}
              </GlowingBadge>
              <span className="absolute -bottom-0.5 left-3 h-2.5 w-2.5 bg-[#5E3AFF] rotate-45 rounded-sm" />
            </div>
          )}
          <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-foreground md:text-7xl">
            {COPY.HOME.HEADLINE}
          </h1>
          <p className="mt-6 mb-10 text-lg leading-relaxed text-muted-foreground max-w-xl">
              {COPY.HOME.SUBHEADLINE}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/bounties/create">
                  <PlusIcon className="h-4 w-4" />
                  {COPY.HOME.POST_A_JOB}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  {COPY.HOME.FIND_JOBS}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-background lg:flex-1">
            <NearbyJobsMap compact />
          </div>
        </div>

        {/* Mobile/tablet: hero text (no map) */}
        <div className="lg:hidden px-4 sm:px-6 py-12">
          {user && (
            <div className="relative mb-3 inline-block">
              <GlowingBadge variant="info" dot={false} className="rounded-lg" style={{ marginBottom: 5 }}>
                {COPY.HOME.WELCOME(user?.firstName)}
              </GlowingBadge>
              <span className="absolute -bottom-0.5 left-3 h-2.5 w-2.5 bg-[#5E3AFF] rotate-45 rounded-sm" />
            </div>
          )}
          <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-foreground md:text-7xl">
            {COPY.HOME.HEADLINE}
          </h1>
          <p className="mt-6 mb-10 text-lg leading-relaxed text-muted-foreground max-w-xl">
            {COPY.HOME.SUBHEADLINE}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/bounties/create">
                <PlusIcon className="h-4 w-4" />
                {COPY.HOME.POST_A_JOB}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">
                <MagnifyingGlassIcon className="h-4 w-4" />
                {COPY.HOME.FIND_JOBS}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats + Wallet */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 lg:flex lg:gap-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 flex-1">
            {statCards.map(({ label, value, icon: Icon, iconColor }) => (
              <div
                key={label}
                className="rounded-[24px] bg-background p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    {loading ? (
                      <ShimmerSkeleton className="mt-2 h-7 w-20" />
                    ) : (
                      <div className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
                        <AnimateCount>{value}</AnimateCount>
                      </div>
                    )}
                  </div>
                  <Icon className="h-8 w-8 opacity-80" style={{ color: iconColor }} />
                </div>
              </div>
            ))}
          </div>
          <div className="relative mt-8 overflow-hidden rounded-[24px] bg-black lg:mt-0 lg:w-72 lg:shrink-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-[0.04]"
              style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
            />
            <div className="relative flex flex-col justify-between p-5 min-h-[12rem] sm:min-h-[10rem]">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {COPY.HOME.TOTAL_EARNINGS}
                </p>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-auto">
                {loading ? (
                  <ShimmerSkeleton className="h-8 w-28" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-muted-foreground">₦</span>
                    <span className="text-3xl font-bold tracking-tight text-white">
                      <AnimateCount>{stats.totalEarnings}</AnimateCount>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[24px] bg-background p-8">
            <PlusIcon className="mb-4 h-10 w-10 opacity-80 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {COPY.HOME.POST_A_JOB}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {COPY.HOME.POST_JOB_DESC}
            </p>
            <Button asChild>
              <Link href="/bounties/create">
                {COPY.HOME.POST_A_JOB} <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[24px] bg-background p-8">
            <MagnifyingGlassIcon className="mb-4 h-10 w-10 opacity-80 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {COPY.HOME.FIND_JOBS}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {COPY.HOME.FIND_JOBS_DESC}
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                {COPY.HOME.FIND_JOBS} <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
