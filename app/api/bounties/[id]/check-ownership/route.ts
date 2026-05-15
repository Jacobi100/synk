import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBountyById, getProfileUUID } from "@/lib/bounty";

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

    // Use server-side supabaseAdmin via getProfileUUID (not the anon client)
    const profileUUID = await getProfileUUID(userId);
    if (!profileUUID) {
      return NextResponse.json({ isOwner: false });
    }

    const isOwner = bounty.poster_id === profileUUID;

    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error("Check ownership error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
