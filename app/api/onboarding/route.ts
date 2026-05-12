import { supabase } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  const body = await req.json();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: crypto.randomUUID(),
        clerk_id: userId,
        email: clerkUser?.emailAddresses[0].emailAddress,
        full_name: clerkUser?.firstName + " " + clerkUser?.lastName,
        username: body.username,
        phone_number: body.phone_number,
        date_of_birth: body.date_of_birth,
        onboarding_complete: true,
      },
      { onConflict: "clerk_id" }
    )
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}