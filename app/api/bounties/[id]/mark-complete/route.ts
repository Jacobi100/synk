import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBountyById,
  getProfileUUID,
  updateBounty,
  getSquadAccountByBountyId,
  updateSquadAccountStatus,
} from '@/lib/bounty';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bountyId } = await params;

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
        { error: 'You do not have permission to complete this bounty' },
        { status: 403 }
      );
    }

    // Verify bounty is in awaiting_service status
    if (bounty.status !== 'awaiting_service') {
      return NextResponse.json(
        { error: 'This bounty cannot be marked as complete in its current state' },
        { status: 400 }
      );
    }

    // Update bounty status to completed
    const updatedBounty = await updateBounty(bountyId, userId, {
      status: 'completed',
    });

    if (!updatedBounty) {
      return NextResponse.json(
        { error: 'Failed to complete bounty' },
        { status: 500 }
      );
    }

    // Get Squad account and release payment
    const squadAccount = await getSquadAccountByBountyId(bountyId);

    if (squadAccount) {
      const releasedAccount = await updateSquadAccountStatus(
        squadAccount.id,
        'released'
      );

      if (!releasedAccount) {
        return NextResponse.json(
          { error: 'Failed to release payment to provider' },
          { status: 500 }
        );
      }

      // TODO: Call Squad Transfer API to actually send funds to provider's account
      // TODO: Notify provider: "Payment released to your account"
    }

    // TODO: Notify both users that they can now rate each other

    return NextResponse.json(
      {
        message: 'Bounty marked as complete successfully',
        bounty: updatedBounty,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
