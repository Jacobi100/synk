"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Bars3Icon, XMarkIcon, BoltIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
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
    <nav
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--violet2))" }}
            >
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="hidden text-[15px] font-bold tracking-tight sm:inline"
              style={{ color: "var(--text)" }}
            >
              Synk
            </span>
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
                      "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      active
                        ? "text-[var(--violet)]"
                        : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]"
                    )}
                  >
                    {label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                        style={{ background: "var(--violet)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </Show>
            <Link
              href="#"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{ color: "var(--text2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text2)")}
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
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-sm font-medium"
                style={{ color: "var(--text2)" }}
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="text-sm font-semibold shadow-[var(--shadow-violet)]"
                style={{ background: "var(--violet)", color: "#fff" }}
              >
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <button
              className="ml-1 rounded-md p-2 md:hidden transition-colors"
              style={{ color: "var(--text2)" }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div
            className="border-t pb-4 md:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-col gap-1 pt-3">
              <Show when="signed-in">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                      style={{
                        color: active ? "var(--violet)" : "var(--text2)",
                        background: active ? "var(--violet-subtle)" : "transparent",
                      }}
                    >
                      {label}
                    </Link>
                  );
                })}
              </Show>
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium"
                style={{ color: "var(--text2)" }}
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
