"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-blue-700">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="hidden text-xl font-bold text-gray-900 sm:inline">Synk</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Show when="signed-in">
              <Link href="/dashboard" className="font-medium text-gray-600 transition hover:text-gray-900">
                Feed
              </Link>
              <Link href="/applications" className="font-medium text-gray-600 transition hover:text-gray-900">
                Applications
              </Link>
              <Link href="/my-postings" className="font-medium text-gray-600 transition hover:text-gray-900">
                My postings
              </Link>
              <Link href="/bounties/create" className="font-medium text-gray-600 transition hover:text-gray-900">
                Post bounty
              </Link>
              <Link href="/profile" className="font-medium text-gray-600 transition hover:text-gray-900">
                Profile
              </Link>
            </Show>
            <Link href="#" className="font-medium text-gray-600 transition hover:text-gray-900">
              How it works
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Show when="signed-in">
              <NotificationBell />
            </Show>
            <Show when="signed-out">
              <Button variant="outline" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-gray-200 pb-4 md:hidden">
            <div className="flex flex-col gap-3 pt-4">
              <Show when="signed-in">
                <Link href="/dashboard" className="font-medium text-gray-600">
                  Feed
                </Link>
                <Link href="/applications" className="font-medium text-gray-600">
                  Applications
                </Link>
                <Link href="/my-postings" className="font-medium text-gray-600">
                  My postings
                </Link>
                <Link href="/bounties/create" className="font-medium text-gray-600">
                  Post bounty
                </Link>
                <Link href="/profile" className="font-medium text-gray-600">
                  Profile
                </Link>
              </Show>
              <Link href="#" className="font-medium text-gray-600">
                How it works
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
