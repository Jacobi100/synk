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
    <div className="min-h-screen overflow-x-hidden">
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

        </div>
      </div>


      {/* Mobile floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 border-t border-border bg-background/80 backdrop-blur-lg py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button size="lg" asChild className="flex-1">
              <Link href="/bounties/create">
                <PlusIcon className="h-4 w-4" />
                {COPY.HOME.POST_A_JOB}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="flex-1">
              <Link href="/dashboard">
                <MagnifyingGlassIcon className="h-4 w-4" />
                {COPY.HOME.FIND_JOBS}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
