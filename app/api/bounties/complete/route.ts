import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { completeBountyForPoster } from "@/lib/bounty-complete";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const bountyId = body.bountyId as string | undefined;
    if (!bountyId) return NextResponse.json({ error: "bountyId required" }, { status: 400 });

    const result = await completeBountyForPoster(userId, bountyId);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, detail: "detail" in result ? result.detail : undefined },
        { status: result.status },
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("complete bounty:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
