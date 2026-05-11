import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)
    // const { id } = evt.data
    const eventType = evt.type

    if (eventType === "user.created") {
      const user = evt.data

      // insert into supabase
      await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        clerk_id: user.id,
        email: user.email_addresses[0].email_address,
        full_name: user.first_name + " " + user.last_name,
      })
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data
      // delete from supabase
      await supabase.from("profiles").delete().eq("clerk_id", id)
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}