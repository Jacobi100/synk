import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getProviderProfile,
  getBountyById,
  checkApplicationExists,
  getProfileById,
  createApplication,
} from "@/lib/bounty";
import { createNotification } from "@/lib/notifications";
import { squadSendSms } from "@/lib/squad";
import { normalizeNigerianPhone } from "@/lib/phone";
import { haversineDistanceMeters } from "@/lib/geo";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const bountyId = body.bountyId as string | undefined;
    if (!bountyId) return NextResponse.json({ error: "Bounty ID is required" }, { status: 400 });

    const providerProfile = await getProviderProfile(userId);
    if (!providerProfile) {
      return NextResponse.json({ error: "Provider profile not found. Please complete onboarding." }, { status: 404 });
    }
    if (!providerProfile.onboarding_complete) {
      return NextResponse.json({ error: "Please complete your onboarding before applying to bounties." }, { status: 403 });
    }

    const bounty = await getBountyById(bountyId);
    if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    if (bounty.status !== "open") {
      return NextResponse.json({ error: "This bounty is no longer open for applications" }, { status: 400 });
    }

    const providerUUID = providerProfile.id;
    if (bounty.poster_id === providerUUID) {
      return NextResponse.json({ error: "You cannot apply to your own bounty" }, { status: 400 });
    }

    if (await checkApplicationExists(bountyId, providerUUID)) {
      return NextResponse.json({ error: "You have already applied to this bounty" }, { status: 400 });
    }

    const application = await createApplication(bountyId, providerUUID);
    if (!application) {
      if (await checkApplicationExists(bountyId, providerUUID)) {
        return NextResponse.json({ error: "You have already applied to this bounty" }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    const poster = await getProfileById(bounty.poster_id);
    const providerName =
      providerProfile.full_name?.trim() ||
      providerProfile.username?.trim() ||
      "A provider";

    await createNotification({
      user_id: bounty.poster_id,
      type: "application_received",
      title: "New application",
      body: `${providerName} applied to "${bounty.title}".`,
      related_bounty_id: bountyId,
    });

    const posterPhone = normalizeNigerianPhone(poster?.phone_number);
    if (posterPhone) {
      await squadSendSms(
        posterPhone,
        `Synk: ${providerName} applied to your bounty "${bounty.title}". Open the app to review.`,
      );
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error("Apply to bounty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
