import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBountyById, getProfileUUID, getTransactionByBountyId } from "@/lib/bounty";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bountyId } = await params;
    const bounty = await getBountyById(bountyId);
    if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });

    const profileId = await getProfileUUID(userId);
    if (!profileId || bounty.poster_id !== profileId) {
      return NextResponse.json({ error: "Only the poster can view escrow details" }, { status: 403 });
    }

    const tx = await getTransactionByBountyId(bountyId);
    if (!tx) return NextResponse.json({ error: "No escrow transaction yet" }, { status: 404 });

    return NextResponse.json({
      virtual_account_number: tx.squad_virtual_account_ref,
      amount: tx.amount,
      platform_fee: tx.platform_fee,
      provider_payout: tx.provider_payout,
      status: tx.status,
      bounty_status: bounty.status,
    });
  } catch (e) {
    console.error("escrow GET:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
