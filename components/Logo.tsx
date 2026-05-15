import Image from "next/image";

export function Logo({ className, showText = true, white }: { className?: string; showText?: boolean; white?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/logo.svg"
        alt="Synk"
        width={28}
        height={28}
        className={`size-7 ${white ? "brightness-0 invert" : ""}`}
        priority
      />
      {showText && (
        <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-google-sans-flex)" }}>
          Synk
        </span>
      )}
    </div>
  );
}
