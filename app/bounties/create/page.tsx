"use client";

import { Navbar } from "@/components/Navbar";
import { BountyForm } from "@/components/BountyForm";
import { COPY } from "@/lib/copy";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-secondary pb-12">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" /> {COPY.BACK_TO_FEED}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{COPY.CREATE_JOB.TITLE}</h1>
          <p className="mt-2 text-muted-foreground">
            {COPY.CREATE_JOB.SUBTITLE}
          </p>
        </div>

        <div className="rounded-[24px] border bg-background p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <BountyForm />
        </div>
      </div>
    </div>
  );
}
