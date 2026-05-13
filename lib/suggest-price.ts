import { supabaseAdmin } from "@/lib/supabase/server";
import { haversineDistanceMeters } from "@/lib/geo";

export type SuggestedRange = {
  avg: number | null;
  suggested_min: number | null;
  suggested_max: number | null;
};

/** Completed bounties in same category within ~5km (haversine). */
export async function computeSuggestedPriceRange(
  category: string,
  lat: number,
  lng: number,
): Promise<SuggestedRange> {
  const { data, error } = await supabaseAdmin
    .from("bounties")
    .select("price_min, price_max, latitude, longitude")
    .eq("category", category)
    .eq("status", "completed")
    .limit(500);

  if (error || !data?.length) {
    return { avg: null, suggested_min: null, suggested_max: null };
  }

  const mids: number[] = [];
  for (const row of data) {
    const d = haversineDistanceMeters(lat, lng, Number(row.latitude), Number(row.longitude));
    if (d >= 5000) continue;
    const min = row.price_min != null ? Number(row.price_min) : null;
    const max = row.price_max != null ? Number(row.price_max) : null;
    if (min != null && max != null) mids.push((min + max) / 2);
    else if (min != null) mids.push(min);
    else if (max != null) mids.push(max);
  }

  if (!mids.length) return { avg: null, suggested_min: null, suggested_max: null };

  const avg = mids.reduce((a, b) => a + b, 0) / mids.length;
  return {
    avg,
    suggested_min: Math.round(avg * 0.8),
    suggested_max: Math.round(avg * 1.2),
  };
}
