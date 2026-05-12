"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:inline">
              Synk
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              How it Works
            </Link>
            <Link
              href="#"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Pricing
            </Link>
          </div>

          {/* Right side - Auth and User */}
          <div className="flex items-center gap-4">
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

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="#"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                How it Works
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Pricing
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
