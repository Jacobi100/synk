import Image from "next/image";
import { useId } from "react";

const LOGO_PATH =
  "M902.674 3.28809L1799.17 1403.29L1801.64 1407.14H1087.78L1087.03 1406.09L995.568 1277.47V1622.14H802.068V1276.98L702.549 1406.16L701.798 1407.14H0L2.46289 1403.29L898.463 3.28906L900.567 0L902.674 3.28809ZM802.467 485.283L337.967 1206.78L335.485 1210.64H628.414L629.155 1209.51L806.655 940.514L807.068 939.888V478.135L802.467 485.283ZM988.568 939.888L988.981 940.514L1166.48 1209.51L1167.22 1210.64H1460.15L1457.67 1206.78L993.171 485.283L988.568 478.135V939.888Z";

export function Logo({
  className,
  showText = true,
  white,
  gradient,
  size,
}: {
  className?: string;
  showText?: boolean;
  white?: boolean;
  gradient?: boolean;
  size?: number;
}) {
  const gradId = useId();
  const s = size ?? 28;

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {gradient ? (
        <svg
          width={s}
          height={s}
          viewBox="0 0 1802 1623"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="56%" stopColor="#5E3AFF" />
              <stop offset="96%" stopColor="#11073D" />
            </linearGradient>
          </defs>
          <path d={LOGO_PATH} fill={`url(#${gradId})`} />
        </svg>
      ) : (
        <Image
          src="/logo.svg"
          alt="Synk"
          width={s}
          height={s}
          className={white ? "brightness-0 invert" : ""}
          priority
        />
      )}
      {showText && (
        <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-google-sans-flex)" }}>
          Synk
        </span>
      )}
    </div>
  );
}
