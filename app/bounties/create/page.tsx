"use client";

import { Navbar } from "@/components/Navbar";
import { BountyForm } from "@/components/BountyForm";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{COPY.CREATE_JOB.TITLE}</h1>
          <p className="mt-2 text-gray-600">
            {COPY.CREATE_JOB.SUBTITLE}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: "var(--border)" }}>
          <BountyForm />
        </div>
      </div>
    </div>
  );
}