"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletIcon } from "@heroicons/react/24/outline";
import { AnimateCount } from "@/components/unlumen-ui/animate-count";

export function WalletNavButton() {
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
      className="flex items-center px-3 py-1.5 text-sm font-bold transition-colors hover:bg-secondary text-foreground rounded-[24px]"
    >
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span>₦</span>
        <AnimateCount>{balance ?? 0}</AnimateCount>
      </div>
    </Link>
  );
}
