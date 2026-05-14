"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const BLUR_MAP = {
  lightest: "blur-sm",
  lighter: "blur",
  light: "blur-md",
  normal: "blur-lg",
  strong: "blur-xl",
  stronger: "blur-2xl",
  strongest: "blur-3xl",
} as const;

export interface GlowEffectProps {
  colors?: string[];
  mode?: "rotate" | "static";
  blur?: keyof typeof BLUR_MAP;
  duration?: number;
  scale?: number;
  className?: string;
}

function conicSegment(colors: string[]): string {
  const seg = 360 / colors.length;
  return colors
    .map((c, i) => {
      const start = i * seg;
      const end = (i + 1) * seg;
      return `${c} ${start}deg ${end}deg`;
    })
    .join(", ");
}

export function GlowEffect({
  colors = ["#ff96a9", "#e8b4f0", "#ffb3c6", "#d44d8a", "#ff96a9"],
  mode = "rotate",
  blur = "strongest",
  duration = 5,
  scale = 1,
  className,
}: GlowEffectProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none size-full", className)}
    >
      <div
        className={cn("size-full", BLUR_MAP[blur])}
        style={{ scale }}
      >
        <div
          className="size-full"
          style={{
            background: `conic-gradient(${conicSegment(colors)})`,
            animation:
              mode === "rotate"
                ? `glow-rotate ${duration}s linear infinite`
                : undefined,
          }}
        />
      </div>
      <style>{`@keyframes glow-rotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
