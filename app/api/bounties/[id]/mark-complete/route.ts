import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { completeBountyForPoster } from "@/lib/bounty-complete";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bountyId } = await params;
    const result = await completeBountyForPoster(userId, bountyId);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, detail: "detail" in result ? result.detail : undefined },
        { status: result.status },
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Mark complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
