import { supabase } from "@/lib/supabase/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const { username, phone_number, date_of_birth } = await req.json();

  const { error } = await supabase
    .from("profiles")
    .upsert(                          // upsert, not insert — handles the webhook race
      {
        clerk_id: userId,
        email: clerkUser?.emailAddresses[0].emailAddress,
        username,
        phone_number,
        date_of_birth,
        onboarding_complete: true,
      },
      { onConflict: "clerk_id" }      // if the webhook already created the row, update it
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}