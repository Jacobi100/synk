import Image from "next/image";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/logo.svg"
        alt="Synk"
        width={36}
        height={36}
        className="size-9"
        priority
      />
      {showText && (
        <span className="text-2xl font-semibold tracking-tight">Synk</span>
      )}
    </div>
  );
}
