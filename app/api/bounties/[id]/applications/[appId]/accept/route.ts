import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBountyById,
  getApplicationById,
  getProfileUUID,
  updateApplicationStatus,
  rejectOtherApplications,
  createSquadVirtualAccount,
  updateBounty,
} from '@/lib/bounty';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; appId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bountyId, appId } = await params;

    // Verify bounty exists and user is the poster
    const bounty = await getBountyById(bountyId);

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    const posterUUID = await getProfileUUID(userId);

    if (!posterUUID || bounty.poster_id !== posterUUID) {
      return NextResponse.json(
        { error: 'You do not have permission to accept applications for this bounty' },
        { status: 403 }
      );
    }

    // Verify application exists and belongs to this bounty
    const application = await getApplicationById(appId);

    if (!application || application.bounty_id !== bountyId) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'This application has already been reviewed' },
        { status: 400 }
      );
    }

    // Accept the application
    const updatedApp = await updateApplicationStatus(appId, 'accepted');

    if (!updatedApp) {
      return NextResponse.json(
        { error: 'Failed to accept application' },
        { status: 500 }
      );
    }

    // Reject all other pending applications
    await rejectOtherApplications(bountyId, appId);

    // Lock bounty (set status to in_progress)
    const priceToCharge = bounty.price_max || bounty.price_min || 0;

    const updatedBounty = await updateBounty(bountyId, userId, {
      status: 'in_progress',
      selected_provider_id: application.provider_id,
    });

    if (!updatedBounty) {
      return NextResponse.json(
        { error: 'Failed to lock bounty' },
        { status: 500 }
      );
    }

    // Create Squad virtual account
    // NOTE: In a real implementation, this would call Squad API to create an actual virtual account
    // For now, we'll create a placeholder account ID
    const squadAccountId = `squad_${bountyId}_${Date.now()}`;

    const squadAccount = await createSquadVirtualAccount(
      bountyId,
      application.provider_id,
      squadAccountId,
      priceToCharge
    );

    if (!squadAccount) {
      return NextResponse.json(
        { error: 'Failed to create Squad virtual account' },
        { status: 500 }
      );
    }

    // TODO: Send notification to poster: "Payment confirmation required"
    // TODO: Send notification to provider: "Your application was accepted"

    return NextResponse.json(
      {
        message: 'Application accepted successfully',
        application: updatedApp,
        bounty: updatedBounty,
        squadAccount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Accept application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
