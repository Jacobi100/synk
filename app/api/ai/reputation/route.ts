import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateTrustProfile } from "@/lib/trust/calculator";
import { supabaseAdmin } from "@/lib/supabase/server";
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
  averageRating:              z.number().min(0).max(5).default(0),
  ratingCount:                z.number().int().nonnegative().default(0),
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
// ---------------------------------------------------------------------------

async function writeTrustProfile(profile: TrustProfile): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        trust_badge:        profile.badge,
        trust_score:        profile.trustScore,
        trust_signals:      profile.signals,
        trust_computed_at:  new Date().toISOString(),
      })
      .eq("id", profile.providerId);

    if (error) {
      console.error("[reputation] Failed to write trust profile:", error.message);
    } else {
      console.info(
        "[reputation] Trust profile written - provider:",
        profile.providerId,
        "| badge:",
        profile.badge,
        "| score:",
        profile.trustScore
      );
    }
  } catch (err) {
    // Never crash the route over a failed write
    console.error("[reputation] writeTrustProfile threw unexpectedly:", err);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<TrustProfile | ErrorResponse>> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

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
