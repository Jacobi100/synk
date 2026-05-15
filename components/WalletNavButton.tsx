"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimateCount } from "@/components/unlumen-ui/animate-count";
import { cn } from "@/lib/utils";

type WalletNavButtonProps = {
  className?: string;
  onClick?: () => void;
};

export function WalletNavButton({ className, onClick }: WalletNavButtonProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setBalance(data.totalEarned || 0))
      .catch(() => setBalance(0));
  }, []);

  return (
    <Link
      href="/wallet"
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-1.5 text-sm font-bold transition-colors hover:bg-secondary text-foreground rounded-[24px]",
        className
      )}
    >
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span>₦</span>
        <AnimateCount>{balance ?? 0}</AnimateCount>
      </div>
    </Link>
  );
}
