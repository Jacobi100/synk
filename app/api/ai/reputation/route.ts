import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateTrustProfile } from "@/lib/trust/calculator";
import type { TrustProfile } from "@/lib/trust/types";

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  providerId:                 z.string().min(1),
  completedJobs:              z.number().int().nonnegative(),
  completionRate:             z.number().min(0).max(1),
  totalUniqueBuyers:          z.number().int().nonnegative(),
  repeatBuyerCount:           z.number().int().nonnegative(),
  repeatBuyerRatio:           z.number().min(0).max(1),
  disputeCount:               z.number().int().nonnegative(),
  fraudFlags:                 z.number().int().nonnegative(),
  averageResponseTimeMinutes: z.number().nonnegative(),
  accountAgeDays:             z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Trust profile persistence
//
// Writes the computed trust profile to the provider's database record.
// Replace the body of this function with your database client.
// The interface is DB-agnostic — swap in Prisma, Drizzle, or Supabase.
// ---------------------------------------------------------------------------

async function writeTrustProfile(profile: TrustProfile): Promise<void> {
  // ---------------------------------------------------------------------------
  // TODO: Replace with your database client.
  //
  // Prisma example:
  //   await prisma.provider.update({
  //     where: { id: profile.providerId },
  //     data: {
  //       trustBadge:  profile.badge,
  //       trustScore:  profile.trustScore,
  //       trustSignals: profile.signals,
  //       trustComputedAt: profile.computedAt,
  //     },
  //   });
  //
  // Drizzle example:
  //   await db.update(providers)
  //     .set({ trustBadge: profile.badge, trustScore: profile.trustScore })
  //     .where(eq(providers.id, profile.providerId));
  //
  // Supabase example:
  //   await supabase.from("providers").update({
  //     trust_badge:       profile.badge,
  //     trust_score:       profile.trustScore,
  //     trust_signals:     profile.signals,
  //     trust_computed_at: profile.computedAt,
  //   }).eq("id", profile.providerId);
  // ---------------------------------------------------------------------------

  console.info(
    "[reputation] Trust profile written — provider:",
    profile.providerId,
    "| badge:",
    profile.badge,
    "| score:",
    profile.trustScore
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<TrustProfile | ErrorResponse>> {
  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  // Validate input
  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:   "Invalid request body.",
        details: parsed.error.issues.map((e) => e.message).join("; "),
      },
      { status: 400 }
    );
  }

  const stats = parsed.data;

  // Compute and persist trust profile
  try {
    const profile = calculateTrustProfile(stats);

    await writeTrustProfile(profile);

    return NextResponse.json(profile, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    console.error("[reputation] calculateTrustProfile failed:", message);

    return NextResponse.json(
      { error: "Failed to compute trust profile.", details: message },
      { status: 500 }
    );
  }
}