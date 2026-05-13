import { auth } from "@clerk/nextjs/server";
import { acceptBountyApplication } from "@/lib/bounty-accept";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bountyId, appId } = await params;
    const result = await acceptBountyApplication(userId, bountyId, appId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Accept application error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
