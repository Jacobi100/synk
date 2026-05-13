import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { acceptBountyApplication } from "@/lib/bounty-accept";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const bountyId = body.bountyId as string | undefined;
    const applicationId = body.applicationId as string | undefined;
    if (!bountyId || !applicationId) {
      return NextResponse.json({ error: "bountyId and applicationId required" }, { status: 400 });
    }

    const result = await acceptBountyApplication(userId, bountyId, applicationId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("accept bounty:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
