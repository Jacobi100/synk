import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBountyById,
  getApplicationById,
  getProfileUUID,
  updateApplicationStatus,
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

    const body = await request.json();
    const { reason } = body;

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
        { error: 'You do not have permission to reject applications for this bounty' },
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

    // Reject the application
    const updatedApp = await updateApplicationStatus(appId, 'rejected', reason);

    if (!updatedApp) {
      return NextResponse.json(
        { error: 'Failed to reject application' },
        { status: 500 }
      );
    }

    // TODO: Send notification to provider: "Your application was rejected"

    return NextResponse.json(
      {
        message: 'Application rejected successfully',
        application: updatedApp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reject application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
