import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyOpenBounties, fetchAllOpenBounties } from "@/lib/bounty";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeSuggestedPriceRange } from "@/lib/suggest-price";
import type { BountyFeedItem } from "@/lib/types/bounty";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const latParam = request.nextUrl.searchParams.get("lat");
    const lngParam = request.nextUrl.searchParams.get("lng");
    const lat = latParam ? Number(latParam) : null;
    const lng = lngParam ? Number(lngParam) : null;

    let bounties;
    if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
      bounties = await fetchNearbyOpenBounties(lat, lng);
    } else {
      bounties = await fetchAllOpenBounties();
    }

    const posterIds = [...new Set(bounties.map((b) => b.poster_id))];
    const { data: posters } = posterIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, username").in("id", posterIds)
      : { data: [] as { id: string; full_name: string | null; username: string | null }[] };

    const nameById = Object.fromEntries(
      (posters || []).map((p) => [p.id as string, (p.full_name || p.username || "Member") as string]),
    );

    const suggestCache = new Map<string, Awaited<ReturnType<typeof computeSuggestedPriceRange>>>();
    const items: BountyFeedItem[] = [];

    for (const b of bounties) {
      let sug: Awaited<ReturnType<typeof computeSuggestedPriceRange>> | null = null;
      if (lat !== null && lng !== null) {
        sug = suggestCache.get(b.category);
        if (!sug) {
          sug = await computeSuggestedPriceRange(b.category, lat, lng);
          suggestCache.set(b.category, sug);
        }
      }
      items.push({
        ...b,
        poster_name: nameById[b.poster_id] ?? null,
        suggested_price_min: sug?.suggested_min ?? null,
        suggested_price_max: sug?.suggested_max ?? null,
      });
    }

    return NextResponse.json({ bounties: items });
  } catch (e) {
    console.error("feed error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
