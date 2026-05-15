"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlowingBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

interface GlowingBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: GlowingBadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<
  GlowingBadgeVariant,
  { badge: string; dot: string }
> = {
  default: {
    badge: "bg-foreground text-background",
    dot: "bg-background",
  },
  neutral: {
    badge: "bg-muted text-foreground border-muted",
    dot: "bg-foreground",
  },
  success: {
    badge: "bg-emerald-500 text-emerald-100",
    dot: "bg-emerald-200",
  },
  warning: {
    badge: "bg-amber-500 text-amber-100",
    dot: "bg-amber-200",
  },
  error: {
    badge: "bg-red-500 text-red-100",
    dot: "bg-red-200",
  },
  info: {
    badge: "bg-[#9fe870] text-[#0e0f0c]",
    dot: "bg-[#0e0f0c]",
  },
};

function GlowingBadge({
  variant = "default",
  pulse = true,
  dot = true,
  children,
  className,
  ...props
}: GlowingBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[24px] px-4 py-1.5 text-sm font-medium",
        styles.badge,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("inline-flex h-2 w-2 rounded-full", styles.dot)} />}
      {children}
    </span>
  );
}

export { GlowingBadge };
export type { GlowingBadgeProps, GlowingBadgeVariant };
