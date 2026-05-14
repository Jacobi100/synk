import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] font-sans">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#000000_0%,#5E3AFF_56%,#11073D_96%)] p-12 md:flex md:w-[45%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.2)_0%,transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"
        />
        <div className="relative z-10 flex items-center gap-2.5">
          <Logo showText={false} />
          <span className="font-google-sans-flex text-2xl font-semibold tracking-tight text-white">Synk</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-sans text-5xl font-semibold leading-[1.05] tracking-tighter text-white md:text-6xl">
            Find work.
            <br />
            Hire talent.
            <br />
            Get things done.
          </h1>
          <p className="font-google-sans-flex mt-8 text-base leading-relaxed text-white/70 md:text-lg">
            The marketplace connecting skilled professionals with local opportunities in Africa.
          </p>
        </div>
        <div className="relative z-10 text-sm font-medium text-white/40">&copy; 2026 Synk</div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "var(--accent-brand)",
                colorText: "var(--foreground)",
                colorBackground: "var(--background)",
                colorInputBackground: "var(--background)",
                colorInputText: "var(--foreground)",
                borderRadius: "0.625rem",
                fontFamily: "Geist, sans-serif",
                fontSize: "0.875rem",
              },
              elements: {
                card: "border border-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]",
                headerTitle: "text-2xl font-bold tracking-tight text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "border-border hover:bg-muted transition-colors duration-200",
                formButtonPrimary:
                  "bg-accent-brand hover:bg-accent-brand/90 text-accent-brand-foreground transition-all duration-200 active:scale-[0.98]",
                formFieldInput:
                  "border-border bg-background text-foreground transition-shadow duration-200 focus-visible:shadow-[0_0_0_2px_var(--accent-brand)]",
                footerActionLink:
                  "text-accent-brand hover:text-accent-brand/80 transition-colors duration-200",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
