import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { computeSuggestedPriceRange } from "@/lib/suggest-price";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const category = request.nextUrl.searchParams.get("category");
    const lat = Number(request.nextUrl.searchParams.get("latitude"));
    const lng = Number(request.nextUrl.searchParams.get("longitude"));
    if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "latitude and longitude are required" }, { status: 400 });
    }

    const range = await computeSuggestedPriceRange(category, lat, lng);
    return NextResponse.json(range);
  } catch (e) {
    console.error("suggest-price:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
