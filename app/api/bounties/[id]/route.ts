import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getBountyById,
  updateBounty,
  deleteBounty,
  getProfileUUID,
  getAcceptedApplicationForBounty,
  getProfileById,
} from "@/lib/bounty";
import { CreateBountyInput, Bounty } from "@/lib/types/bounty";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bounty = await getBountyById(id);

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const { userId } = await auth();
    let poster_phone: string | null = null;
    let provider_phone: string | null = null;
    let transaction: any = null;

    if (userId) {
      const viewerId = await getProfileUUID(userId);
      const accepted = await getAcceptedApplicationForBounty(id);

      // Fetch active transaction for this bounty
      const { data: tx } = await supabaseAdmin
        .from("transactions")
        .select("id, status, assistance_requested_at, assistance_requested_by, poster_id, provider_id")
        .eq("bounty_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      transaction = tx;

      if (viewerId && accepted) {
        if (accepted.provider_id === viewerId) {
          const poster = await getProfileById(bounty.poster_id);
          poster_phone = poster?.phone_number ?? null;
        }
        if (viewerId === bounty.poster_id) {
          const provider = await getProfileById(accepted.provider_id);
          provider_phone = provider?.phone_number ?? null;
        }
      }
    }

    return NextResponse.json({ ...bounty, poster_phone, provider_phone, transaction });
  } catch (error) {
    console.error("Get bounty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const updates: Partial<CreateBountyInput> & Partial<Pick<Bounty, "status">> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.latitude !== undefined) updates.latitude = body.latitude;
    if (body.longitude !== undefined) updates.longitude = body.longitude;
    if (body.location_name !== undefined) updates.location_name = body.location_name;
    if (body.radius_km !== undefined) updates.radius_km = body.radius_km;
    if (body.price_min !== undefined) updates.price_min = body.price_min;
    if (body.price_max !== undefined) updates.price_max = body.price_max;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.price_negotiable !== undefined) updates.price_negotiable = body.price_negotiable;
    if (body.images !== undefined) updates.images = body.images;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.urgency !== undefined) updates.urgency = body.urgency;
    if (body.slots_available !== undefined) updates.slots_available = body.slots_available;
    if (body.status !== undefined) updates.status = body.status as Bounty["status"];

    const bounty = await updateBounty(id, userId, updates);

    if (!bounty) {
      return NextResponse.json({ error: "Failed to update bounty or unauthorized" }, { status: 400 });
    }

    return NextResponse.json(bounty);
  } catch (error) {
    console.error("Update bounty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteBounty(id, userId);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete bounty or unauthorized" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bounty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
