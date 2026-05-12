import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createBounty, getBounties } from '@/lib/bounty';
import { CreateBountyInput } from '@/lib/types/bounty';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      category: searchParams.get('category') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      urgency: (searchParams.get('urgency') as any) || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const bounties = await getBounties(filters);
    return NextResponse.json(bounties);
  } catch (error) {
    console.error('List bounties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const bountyData: CreateBountyInput = {
      title: body.title,
      description: body.description || null,
      category: body.category,
      latitude: body.latitude,
      longitude: body.longitude,
      location_name: body.location_name || null,
      radius_km: body.radius_km || 1,
      price_min: body.price_min || null,
      price_max: body.price_max || null,
      currency: body.currency || 'NGN',
      price_negotiable: body.price_negotiable ?? true,
      images: body.images || null,
      deadline: body.deadline || null,
      urgency: body.urgency || 'flexible',
      slots_available: body.slots_available || 1,
      status: 'open',
    };

    const bounty = await createBounty(userId, bountyData);

    if (!bounty) {
      return NextResponse.json(
        { error: 'Failed to create bounty' },
        { status: 500 }
      );
    }

    return NextResponse.json(bounty, { status: 201 });
  } catch (error) {
    console.error('Create bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
