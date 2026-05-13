import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getBountyById,
  getApplicationById,
  getProfileUUID,
  updateApplicationStatus,
} from "@/lib/bounty";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bountyId, appId } = await params;

    const bounty = await getBountyById(bountyId);
    if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });

    const posterUUID = await getProfileUUID(userId);
    if (!posterUUID || bounty.poster_id !== posterUUID) {
      return NextResponse.json({ error: "You do not have permission to reject applications for this bounty" }, { status: 403 });
    }

    const application = await getApplicationById(appId);
    if (!application || application.bounty_id !== bountyId) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending") {
      return NextResponse.json({ error: "This application has already been reviewed" }, { status: 400 });
    }

    const updatedApp = await updateApplicationStatus(appId, "rejected");
    if (!updatedApp) {
      return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
    }

    await createNotification({
      user_id: application.provider_id,
      type: "application_rejected",
      title: "Application update",
      body: `Your application for "${bounty.title}" was not selected.`,
      related_bounty_id: bountyId,
    });

    return NextResponse.json({ message: "Application rejected successfully", application: updatedApp });
  } catch (error) {
    console.error("Reject application error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
