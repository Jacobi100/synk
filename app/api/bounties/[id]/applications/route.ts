import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBountyById,
  getApplicationsByBountyIdWithProvider,
  getProfileUUID,
} from '@/lib/bounty';
import { assessOfferRisk } from '@/lib/risk/offer-scorer';
import { calculateTrustProfile } from '@/lib/trust/calculator';
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

    // Enrich with risk assessment
    const applicationsWithRisk = await Promise.all(applications.map(async (app) => {
      if (!app.provider_profile) return { ...app, risk: null };

      // Get active jobs count for provider
      const { count: activeJobs } = await supabaseAdmin
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", app.provider_id)
        .eq("status", "accepted");
      
      // Note: we'd ideally also filter by bounty.status = 'in_progress' here 
      // but let's keep it simple for now as requested.

      const profile = app.provider_profile as any;
      const trustProfile = {
        providerId: app.provider_id,
        badge: profile.trust_badge || "new",
        trustScore: profile.trust_score || 0,
        signals: profile.trust_signals || [],
        computedAt: profile.trust_computed_at || "",
      };

      const risk = assessOfferRisk({
        bountyId,
        bountyCategory: bounty.category,
        providerId: app.provider_id,
        trustProfile,
        activeJobsCount: activeJobs || 0,
      });

      return { ...app, risk };
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
