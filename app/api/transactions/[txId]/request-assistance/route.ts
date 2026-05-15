import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getProfileUUID } from "@/lib/bounty";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/transactions/[txId]/request-assistance
 * 
 * Flags a transaction for "Auto-Release Safeguard".
 * If a poster ghosts a provider (or vice versa), this starts a 48h timer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { txId } = await params;
    const profileId = await getProfileUUID(userId);
    if (!profileId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // 1. Fetch transaction
    const { data: tx, error: fetchErr } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", txId)
      .single();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Verify user is part of this transaction
    const isPoster = tx.poster_id === profileId;
    const isProvider = tx.provider_id === profileId;

    if (!isPoster && !isProvider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Check status — can only request assistance if money is paid but not released
    if (tx.status !== "paid") {
      return NextResponse.json({ error: "Assistance only available for paid/escrowed funds" }, { status: 400 });
    }

    // 4. Update transaction with request timestamp
    const { error: updateErr } = await supabaseAdmin
      .from("transactions")
      .update({
        assistance_requested_at: new Date().toISOString(),
        assistance_requested_by: profileId,
      })
      .eq("id", txId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Safeguard timer started. Support has been notified.",
      auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error("Assistance request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
