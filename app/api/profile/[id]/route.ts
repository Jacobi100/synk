import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TrustBadge, TrustSignal } from "@/lib/trust/types";

// ---------------------------------------------------------------------------
// Public provider profile — only safe fields exposed
// Never exposes: email, phone, account_number, bank_code, clerk_id
// ---------------------------------------------------------------------------

interface PublicProviderProfile {
  id:               string;
  username:         string | null;
  fullName:         string | null;
  memberSince:      string;
  trustBadge:       TrustBadge;
  trustScore:       number;
  trustSignals:     TrustSignal[];
  trustComputedAt:  string | null;
  completedJobs:    number;
  totalUniqueBuyers: number;
}

interface ErrorResponse {
  error: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PublicProviderProfile | ErrorResponse>> {
  const { id: profileId } = await params;

  if (!profileId) {
    return NextResponse.json({ error: "Profile ID is required." }, { status: 400 });
  }

  // Fetch public profile fields only
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, full_name, created_at, trust_badge, trust_score, trust_signals, trust_computed_at")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  // Completed jobs count
  const { count: completedJobs } = await supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", profileId)
    .eq("status", "released");

  // Unique buyers count
  const { data: buyerRows } = await supabaseAdmin
    .from("transactions")
    .select("poster_id")
    .eq("provider_id", profileId)
    .eq("status", "released");

  const totalUniqueBuyers = new Set((buyerRows ?? []).map((r) => r.poster_id)).size;

  return NextResponse.json({
    id:               profile.id,
    username:         profile.username ?? null,
    fullName:         profile.full_name ?? null,
    memberSince:      profile.created_at,
    trustBadge:       (profile.trust_badge as TrustBadge) ?? "new",
    trustScore:       Number(profile.trust_score ?? 0),
    trustSignals:     (profile.trust_signals as TrustSignal[]) ?? [],
    trustComputedAt:  profile.trust_computed_at ?? null,
    completedJobs:    completedJobs ?? 0,
    totalUniqueBuyers,
  });
}