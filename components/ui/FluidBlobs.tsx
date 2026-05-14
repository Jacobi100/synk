"use client";

import * as React from "react";
import { motion } from "motion/react";

export interface FluidBlobsProps {
  lightColors?: string[];
  darkColors?: string[];
  origins?: { x: number; y: number }[];
  margin?: number;
  blur?: number;
}

const ANGLES = [40, 100, 200, 290];

function r(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generatePath(ox: number, oy: number, spread: number) {
  const p1x = ox + r(-spread, spread);
  const p1y = oy + r(-spread, spread);
  const p2x = ox + r(-spread, spread);
  const p2y = oy + r(-spread, spread);
  const p3x = ox + r(-spread, spread);
  const p3y = oy + r(-spread, spread);
  return `M${ox},${oy} Q${p1x},${p1y} ${p2x},${p2y} T${p3x},${p3y} Z`;
}

export function FluidBlobs({
  lightColors = ["#ff0020", "#fc0f60", "#e8227a", "#ff85b3"],
  darkColors,
  origins = [
    { x: 50, y: -55 },
    { x: 50, y: -25 },
    { x: 50, y: -25 },
    { x: 50, y: -25 },
  ],
  margin = 60,
  blur = 50,
}: FluidBlobsProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="absolute inset-0 size-full" aria-hidden />;
  }

  return (
    <div className="absolute inset-0 size-full overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        style={{ filter: `blur(${blur}px)`, margin: -margin, width: `calc(100% + ${margin * 2}px)`, height: `calc(100% + ${margin * 2}px)` }}
      >
        {lightColors.map((color, i) => {
          const origin = origins[i] || origins[0];
          const ox = origin.x;
          const oy = origin.y;
          const spread = 40;
          return (
            <motion.path
              key={i}
              fill={color}
              d={generatePath(ox, oy, spread)}
              animate={{
                d: [
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                ],
              }}
              transition={{
                duration: r(8, 14),
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.33, 0.66, 1],
              }}
              className={darkColors ? "dark:hidden" : ""}
            />
          );
        })}
        {darkColors?.map((color, i) => {
          const origin = origins[i] || origins[0];
          const ox = origin.x;
          const oy = origin.y;
          const spread = 40;
          return (
            <motion.path
              key={`dark-${i}`}
              fill={color}
              d={generatePath(ox, oy, spread)}
              animate={{
                d: [
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                  generatePath(ox, oy, spread),
                ],
              }}
              transition={{
                duration: r(8, 14) + 2,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.33, 0.66, 1],
              }}
              className="hidden dark:block"
            />
          );
        })}
      </svg>
    </div>
  );
}
