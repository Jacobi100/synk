import Image from "next/image";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/logo.svg"
        alt="Synk"
        width={28}
        height={28}
        className="size-7"
        priority
      />
      {showText && (
        <span className="text-xl font-semibold tracking-tight">Synk</span>
      )}
    </div>
  );
}
