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
        {/* Desktop: full-width map */}
        <div className="hidden lg:block">
          <NearbyJobsMap compact flush />
        </div>

        {/* Mobile/tablet: full-width map */}
        <div className="lg:hidden">
          <NearbyJobsMap compact flush />
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


    </div>
  );
}
