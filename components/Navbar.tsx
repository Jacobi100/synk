"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Feed" },
  { href: "/applications", label: "Applications" },
  { href: "/my-postings", label: "My Postings" },
  { href: "/bounties/create", label: "Post Bounty" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
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
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-3 py-1.5 text-sm font-semibold rounded-[24px] transition-colors",
                      active
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </Show>
            <Link
              href="#"
              className="px-3 py-1.5 text-sm font-semibold rounded-[24px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              How it works
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Show when="signed-in">
              <NotificationBell />
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

        {/* Mobile menu */}
        {isOpen && (
          <div className="border-t border-border bg-background pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-3">
              <Show when="signed-in">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "rounded-[24px] px-3 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
              </Show>
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="rounded-[24px] px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
