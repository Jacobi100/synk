import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProfileUUID } from "@/lib/bounty";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("profile GET:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const profileId = await getProfileUUID(userId);
    if (!profileId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const patch: Record<string, unknown> = {};
    if (body.username !== undefined) patch.username = body.username;
    if (body.full_name !== undefined) patch.full_name = body.full_name;
    if (body.phone_number !== undefined) patch.phone_number = body.phone_number;
    if (body.account_number !== undefined) patch.account_number = body.account_number;
    if (body.bank_code !== undefined) patch.bank_code = body.bank_code;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", profileId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("profile PATCH:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
