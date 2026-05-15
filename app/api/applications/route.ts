import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getApplicationsForProvider,
  getApplicationsForPoster,
  getProfileUUID,
} from '@/lib/bounty';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profileUUID = await getProfileUUID(userId);

    if (!profileUUID) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'provider';

    let applications =
      role === 'poster'
        ? await getApplicationsForPoster(profileUUID)
        : await getApplicationsForProvider(profileUUID);

    if (status) {
      applications = applications.filter((app) => app.status === status);
    }

    // Enrich with risk assessment for posters
    if (role === 'poster') {
      const { assessOfferRisk } = await import('@/lib/risk/offer-scorer');
      const { supabaseAdmin } = await import('@/lib/supabase/server');

      applications = await Promise.all(applications.map(async (app: any) => {
        if (!app.provider_profile || !app.bounty) return { ...app, risk: null };

        try {
          const profile = app.provider_profile as Record<string, unknown>;
          const bounty = app.bounty;
          
          const trustProfile = {
            providerId: app.provider_id,
            badge: (profile.trust_badge as any) || "new",
            trustScore: (profile.trust_score as number) || 0,
            signals: (profile.trust_signals as any) || [],
            computedAt: (profile.trust_computed_at as string) || new Date().toISOString(),
          };

          const risk = assessOfferRisk({
            bountyId: app.bounty_id,
            bountyCategory: bounty.category,
            providerId: app.provider_id,
            trustProfile,
            activeJobsCount: (profile.active_jobs_count as number) || 0,
            proposedPrice: Number(app.proposed_price || 0),
            bountyPriceMin: Number(bounty.price_min),
            bountyPriceMax: Number(bounty.price_max),
          });

          return { ...app, risk };
        } catch (err) {
          console.error("Risk assessment failed for application:", app.id, err);
          return { ...app, risk: null };
        }
      }));
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
