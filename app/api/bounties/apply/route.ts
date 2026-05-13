import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getProviderProfile,
  getBountyById,
  checkApplicationExists,
  createApplication,
} from '@/lib/bounty';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bountyId } = body;

    if (!bountyId) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // 1. Get provider profile and check if complete
    const providerProfile = await getProviderProfile(userId);

    if (!providerProfile) {
      return NextResponse.json(
        { error: 'Provider profile not found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    if (!providerProfile.onboarding_complete) {
      return NextResponse.json(
        { error: "Please complete your onboarding before applying to bounties." },
        { status: 403 }
      );
    }

    // 2. Get bounty and verify it exists and is open
    const bounty = await getBountyById(bountyId);

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    if (bounty.status !== 'open') {
      return NextResponse.json(
        { error: 'This bounty is no longer open for applications' },
        { status: 400 }
      );
    }

    // 3. Check if provider is not the poster
    const providerUUID = providerProfile.id;
    if (bounty.poster_id === providerUUID) {
      return NextResponse.json(
        { error: 'You cannot apply to your own bounty' },
        { status: 400 }
      );
    }

    // 4. Check if application already exists
    const appExists = await checkApplicationExists(bountyId, providerUUID);

    if (appExists) {
      return NextResponse.json(
        { error: 'You have already applied to this bounty' },
        { status: 400 }
      );
    }

    // 5. Create application
    const application = await createApplication(bountyId, providerUUID);

    if (!application) {
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    // TODO: Notify poster that someone applied to their bounty
    // This would involve creating a notification record or sending an email/SMS

    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply to bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
