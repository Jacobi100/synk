import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBountyById, getProfileUUID, createReview } from "@/lib/bounty";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bountyId } = await params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const bounty = await getBountyById(bountyId);
  if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });

  const posterUUID = await getProfileUUID(userId);
  if (!posterUUID || bounty.poster_id !== posterUUID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find the provider (accepted application)
  const { data: app } = await (await import("@/lib/supabase/server")).supabaseAdmin
    .from("applications")
    .select("provider_id")
    .eq("bounty_id", bountyId)
    .eq("status", "accepted")
    .single();

  if (!app) return NextResponse.json({ error: "No accepted provider found" }, { status: 400 });

  const success = await createReview({
    bounty_id: bountyId,
    poster_id: posterUUID,
    provider_id: app.provider_id,
    rating,
    comment,
  });

  if (!success) return NextResponse.json({ error: "Failed to save review" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
