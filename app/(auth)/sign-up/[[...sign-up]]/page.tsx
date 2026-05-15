import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] font-sans">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(-45deg,#000000_0%,#5E3AFF_56%,#11073D_96%)] p-12 md:flex md:w-[45%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(94,58,255,0.15)_0%,transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(94,58,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"
        />
        <div className="relative z-10 flex items-center gap-2.5">
          <Logo showText={false} white />
          <span className="text-2xl font-semibold tracking-tight text-white">Synk</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-white md:text-6xl">
            Join the
            <br />
            gig economy.
            <br />
            Start earning.
          </h1>
          <p className="mt-8 text-base leading-relaxed text-white/70 md:text-lg">
            Create your account and start applying for bounties or hiring skilled professionals.
          </p>
        </div>
        <div className="relative z-10 text-sm font-medium text-white/40">&copy; 2026 Synk</div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-secondary p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "var(--primary)",
                colorText: "var(--foreground)",
                colorBackground: "var(--background)",
                colorInputBackground: "var(--secondary)",
                colorInputText: "var(--foreground)",
                borderRadius: "1.5rem",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
              },
              elements: {
                card: "bg-background rounded-[24px]",
                headerTitle: "text-2xl font-bold tracking-tight text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "rounded-[24px] border-border hover:bg-secondary transition-colors",
                formButtonPrimary:
                  "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] transition-all active:scale-[0.97] rounded-[24px]",
                formFieldInput:
                  "rounded-[24px] border bg-secondary text-foreground focus-visible:shadow-[0_0_0_2px_var(--ring)] focus:bg-background",
                footerActionLink:
                  "text-primary hover:text-[var(--primary-hover)] transition-colors",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
