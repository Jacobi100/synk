import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBountyById } from "@/lib/bounty";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ isOwner: false });
    }

    // Get the bounty
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404 }
      );
    }

    // Get the current user's profile UUID
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ isOwner: false });
    }

    // Check if the user is the poster
    const isOwner = bounty.poster_id === profile.id;

    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error("Check ownership error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
