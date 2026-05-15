import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBountyById,
  getApplicationsByBountyIdWithProvider,
  getProfileUUID,
} from '@/lib/bounty';
import { assessOfferRisk } from '@/lib/risk/offer-scorer';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { error: 'You do not have permission to view applications for this bounty' },
        { status: 403 }
      );
    }

    // Get all applications for this bounty, including provider profile details
    const applications = await getApplicationsByBountyIdWithProvider(bountyId);

    // Enrich with risk assessment - wrapped in try-catch so the endpoint
    // still returns applications even if risk scoring fails.
    const applicationsWithRisk = await Promise.all(applications.map(async (app) => {
      if (!app.provider_profile) return { ...app, risk: null };

      try {
        // Get active jobs count for provider - try both table names
        let activeJobs = 0;
        const { count, error } = await supabaseAdmin
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", app.provider_id)
          .eq("status", "accepted");

        if (!error && count !== null) {
          activeJobs = count;
        } else {
          // Fallback to legacy table name
          const legacy = await supabaseAdmin
            .from("bounty_applications")
            .select("id", { count: "exact", head: true })
            .eq("provider_id", app.provider_id)
            .eq("status", "accepted");
          if (!legacy.error && legacy.count !== null) {
            activeJobs = legacy.count;
          }
        }

        const profile = app.provider_profile as Record<string, unknown>;
        const trustProfile = {
          providerId: app.provider_id,
          badge: (profile.trust_badge as string) || "new",
          trustScore: (profile.trust_score as number) || 0,
          signals: (profile.trust_signals as string[]) || [],
          computedAt: (profile.trust_computed_at as string) || "",
        };

        const risk = assessOfferRisk({
          bountyId,
          bountyCategory: bounty.category,
          providerId: app.provider_id,
          trustProfile,
          activeJobsCount: activeJobs,
        });

        return { ...app, risk };
      } catch (err) {
        console.error("Risk assessment failed for application:", app.id, err);
        return { ...app, risk: null };
      }
    }));

    return NextResponse.json(applicationsWithRisk);
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

