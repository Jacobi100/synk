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
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const activeClass = "text-foreground bg-secondary";
  const idleClass = "text-muted-foreground hover:text-foreground hover:bg-secondary";

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
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-[24px] transition-colors",
                        active ? activeClass : idleClass
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
              </Show>
              <Link
                href="#"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-[24px] transition-colors",
                  idleClass
                )}
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
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

      {/* Mobile left drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background shadow-xl flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Drawer header */}
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

              {/* Drawer nav links */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-1">
                  <Show when="signed-in">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-semibold transition-colors",
                            active ? activeClass : idleClass
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {label}
                        </Link>
                      );
                    })}
                  </Show>

                  <hr className="my-2 border-border" />

                  <Link
                    href="#"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-semibold transition-colors",
                      idleClass
                    )}
                  >
                    <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" />
                    How it works
                  </Link>
                </div>
              </div>

              {/* Drawer footer with sign in/up */}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
