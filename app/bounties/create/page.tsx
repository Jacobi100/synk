import { Navbar } from "@/components/Navbar";
import { BountyForm } from "@/components/BountyForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CreateBountyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--violet)]"
          style={{ color: "var(--text2)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
          >
            Post a bounty
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>
            Share what you need done and receive applications from professionals.
          </p>
        </div>

        <div
          className="rounded-xl border bg-white p-7 shadow-[var(--synk-shadow)]"
          style={{ borderColor: "var(--border)" }}
        >
          <BountyForm />
        </div>
      </div>
    </div>
  );
}
