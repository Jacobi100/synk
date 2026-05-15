"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  UserIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { WalletNavButton } from "@/components/WalletNavButton";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Feed", icon: HomeIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/my-postings", label: "My Postings", icon: DocumentTextIcon },
  { href: "/bounties/create", label: "Post Bounty", icon: PlusCircleIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link href="/">
              <Logo />
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              <Show when="signed-in">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="relative px-4 py-2 text-sm font-bold rounded-[24px] transition-colors duration-200"
                    >
                      <span
                        className={`relative z-10 flex items-center gap-1.5 ${
                          active ? "text-white" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="nav-pill"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className="absolute inset-0 bg-black rounded-[24px]"
                        />
                      )}
                    </Link>
                  );
                })}
              </Show>
              <Link
                href="#"
                className="relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-[24px] transition-colors duration-200 text-muted-foreground hover:text-foreground"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
                How it works
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Show when="signed-in">
                <NotificationBell />
                <WalletNavButton />
              </Show>

              <Show when="signed-out">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </Show>

              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonPopoverCard:
                        "bg-background border border-border rounded-[24px] shadow-none",
                      userButtonPopoverActionItem:
                        "text-foreground hover:bg-secondary transition-colors",
                      userButtonPopoverActionItemText: "text-foreground",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                />
              </Show>

              <button
                className="ml-1 rounded-[24px] p-2 md:hidden transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-border">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <Logo />
              </Link>
              <button
                className="rounded-[24px] p-2 transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="flex flex-col gap-1">
              <Show when="signed-in">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-[24px] transition-colors duration-200",
                        "hover:shadow-[inset_0_0_0_1px_var(--border)]",
                        active
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pathname.startsWith(href === "/" ? "/" : href + "/") && href !== "/" && !active && (
                        <>
                          <span
                            className="absolute inset-0 bg-black rounded-[24px] opacity-[0.02]"
                          />
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[2px]"
                            style={{ background: "var(--primary)" }}
                          />
                        </>
                      )}
                      {active && (
                        <span
                          className="absolute inset-0 bg-black rounded-[24px] opacity-[0.02]"
                        />
                      )}
                      <Icon className="h-5 w-5" />
                      {label}
                      {active && (
                        <span
                          className="absolute -bottom-px left-[20%] right-[20%] h-[2px] rounded-full"
                          style={{ background: "var(--primary)" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </Show>

                <hr className="my-2 border-border" />

                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="relative flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-bold transition-colors duration-200 text-muted-foreground hover:text-foreground"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" />
                  How it works
                </Link>
              </div>
            </div>

            <div className="border-t border-border px-3 py-4">
              <Show when="signed-out">
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-center">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="w-full justify-center">
                    <Link href="/sign-up">Sign up</Link>
                  </Button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
