"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { COPY } from "@/lib/copy";
import { WalletIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "@heroicons/react/24/outline";
import { AnimateCount } from "@/components/unlumen-ui/animate-count";
import { ShimmerSkeleton } from "@/components/unlumen-ui/shimmer-skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  provider_payout: number;
  status: string;
  poster_id: string;
  provider_id: string;
  bounty: { title: string };
}

interface WalletData {
  totalEarned: number;
  totalSpent: number;
  pending: number;
  transactions: Transaction[];
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wallet");
        const json = await res.json();
        setData(json);
        
        // Extract profileId from the first transaction if available to determine direction
        if (json.transactions?.length > 0) {
          // This is a bit of a hack, better if API returned profileId
          // But we can guess from the first transaction
          // If we are getting this data, we are the user.
        }
        
        // To get profileId reliably, we'd need another API or pass it from route
        // For now let's just fetch it if needed or assume we'll identify by comparing IDs
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    
    // Fetch profile info to identify transaction direction
    fetch("/api/profile").then(res => res.json()).then(p => setProfileId(p.id));
  }, []);

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          {COPY.WALLET.TITLE}
        </h1>

        <div className="grid gap-6">
          {/* Main Balance Card - matching home page style */}
          <div className="relative overflow-hidden rounded-[24px] bg-black p-6 shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
              style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
            />
            
            <div className="relative flex flex-col justify-between min-h-[140px]">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
                  {COPY.WALLET.TOTAL_EARNED}
                </p>
                <div className="rounded-full bg-white/10 p-2 text-white/80">
                  <WalletIcon className="h-5 w-5" />
                </div>
              </div>
              
              <div className="mt-auto">
                {loading ? (
                  <ShimmerSkeleton className="h-10 w-40 bg-white/10" />
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-muted-foreground">₦</span>
                    <span className="text-5xl font-bold tracking-tighter text-white">
                      <AnimateCount>{data?.totalEarned || 0}</AnimateCount>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] bg-background p-5 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {COPY.WALLET.TOTAL_SPENT}
              </p>
              {loading ? (
                <ShimmerSkeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-bold text-foreground">
                  ₦<AnimateCount>{data?.totalSpent || 0}</AnimateCount>
                </p>
              )}
            </div>
            <div className="rounded-[24px] bg-background p-5 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {COPY.WALLET.PENDING}
              </p>
              {loading ? (
                <ShimmerSkeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-bold text-warning" style={{ color: "var(--warning)" }}>
                  ₦<AnimateCount>{data?.pending || 0}</AnimateCount>
                </p>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="mt-4">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              {COPY.WALLET.HISTORY}
            </h2>
            
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-[24px] bg-background p-4 border border-border flex items-center gap-4">
                    <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <ShimmerSkeleton className="h-4 w-1/2" />
                      <ShimmerSkeleton className="h-3 w-1/4" />
                    </div>
                    <ShimmerSkeleton className="h-5 w-20" />
                  </div>
                ))
              ) : data?.transactions.length === 0 ? (
                <div className="rounded-[24px] bg-background py-12 text-center border border-border">
                  <p className="text-sm font-medium text-foreground">{COPY.WALLET.EMPTY}</p>
                  <p className="text-xs text-muted-foreground mt-1">{COPY.WALLET.EMPTY_SUB}</p>
                </div>
              ) : (
                data?.transactions.map((tx) => {
                  const isEarned = tx.provider_id === profileId;
                  const amount = isEarned ? tx.provider_payout : tx.amount;
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="group flex items-center gap-4 rounded-[24px] bg-background p-4 border border-border transition-colors hover:bg-secondary/50"
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isEarned ? "bg-positive/10 text-positive" : "bg-primary/10 text-primary"
                      )} style={{ 
                        backgroundColor: isEarned ? "color-mix(in srgb, var(--positive) 10%, transparent)" : "color-mix(in srgb, var(--primary) 10%, transparent)",
                        color: isEarned ? "var(--positive)" : "var(--primary)"
                      }}>
                        {isEarned ? (
                          <ArrowDownLeftIcon className="h-5 w-5" />
                        ) : (
                          <ArrowUpRightIcon className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {tx.bounty?.title || "Unknown Job"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-sm font-bold",
                          isEarned ? "text-positive" : "text-foreground"
                        )} style={{ color: isEarned ? "var(--positive)" : undefined }}>
                          {isEarned ? "+" : "-"}₦{amount?.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {tx.status.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
