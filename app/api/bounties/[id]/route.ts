import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getBountyById, updateBounty, deleteBounty } from '@/lib/bounty';
import { CreateBountyInput } from '@/lib/types/bounty';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {id} = await params;
    const bounty = await getBountyById(id);

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bounty);
  } catch (error) {
    console.error('Get bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const updates: Partial<CreateBountyInput> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.latitude !== undefined) updates.latitude = body.latitude;
    if (body.longitude !== undefined) updates.longitude = body.longitude;
    if (body.location_name !== undefined) updates.location_name = body.location_name;
    if (body.radius_km !== undefined) updates.radius_km = body.radius_km;
    if (body.price_min !== undefined) updates.price_min = body.price_min;
    if (body.price_max !== undefined) updates.price_max = body.price_max;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.price_negotiable !== undefined) updates.price_negotiable = body.price_negotiable;
    if (body.images !== undefined) updates.images = body.images;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.urgency !== undefined) updates.urgency = body.urgency;
    if (body.slots_available !== undefined) updates.slots_available = body.slots_available;
    if (body.status !== undefined) updates.status = body.status;

    const bounty = await updateBounty(params.id, userId, updates);

    if (!bounty) {
      return NextResponse.json(
        { error: 'Failed to update bounty or unauthorized' },
        { status: 400 }
      );
    }

    return NextResponse.json(bounty);
  } catch (error) {
    console.error('Update bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const success = await deleteBounty(params.id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete bounty or unauthorized' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
