import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORIES_PROMPT_LIST,
  GOODS_CATEGORIES_PROMPT_LIST,
} from "@/lib/categories";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_QUERY_LENGTH        = 300;
const LOW_CONFIDENCE_THRESHOLD = 0.4;
const MAX_RESULTS             = 50;

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  query:    z.string().min(1, "Search query cannot be empty.").max(MAX_QUERY_LENGTH),
  language: z.string().optional(),
  lat:      z.number().optional(),
  lng:      z.number().optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// ---------------------------------------------------------------------------
// Gemini response schema
// ---------------------------------------------------------------------------

const SearchInterpretationSchema = z.object({
  categories:    z.array(z.enum(SERVICE_CATEGORIES)),
  keywords:      z.array(z.string()),
  locationHint:  z.string().nullable(),
  urgency:       z.enum(["immediate", "today", "this_week", "flexible"]),
  priceSignal:   z.enum(["budget", "standard", "premium", "unspecified"]),
  originalQuery: z.string(),
  confidence:    z.number().min(0).max(1),
  isRelevant:    z.boolean(),
});

type SearchInterpretation = z.infer<typeof SearchInterpretationSchema>;

// ---------------------------------------------------------------------------
// Bounty row shape returned from Supabase
// ---------------------------------------------------------------------------

interface BountyRow {
  id:               string;
  poster_id:        string;
  title:            string;
  description:      string;
  category:         string;
  latitude:         number | null;
  longitude:        number | null;
  location_name:    string | null;
  price_min:        number | null;
  price_max:        number | null;
  currency:         string;
  price_negotiable: boolean;
  urgency:          string;
  slots_available:  number;
  status:           string;
  created_at:       string;
}

// ---------------------------------------------------------------------------
// Route response shape
// ---------------------------------------------------------------------------

interface SearchResponse extends SearchInterpretation {
  lowConfidence?: boolean;
  listings:       BountyRow[];
}

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Query sanitisation
// ---------------------------------------------------------------------------

function sanitizeQuery(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[`{}[\]\\]/g, "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

// ---------------------------------------------------------------------------
// Keyword filter — applied in memory after DB fetch
// ---------------------------------------------------------------------------

function filterByKeywords(bounties: BountyRow[], keywords: string[]): BountyRow[] {
  if (keywords.length === 0) return bounties;
  return bounties.filter((b) => {
    const searchable = `${b.title} ${b.description} ${b.category}`.toLowerCase();
    return keywords.some((k) => searchable.includes(k.toLowerCase()));
  });
}

// ---------------------------------------------------------------------------
// Fetch matching bounties from Supabase
// ---------------------------------------------------------------------------

async function fetchMatchingBounties(
  interpretation: SearchInterpretation,
  lat?: number,
  lng?: number
): Promise<BountyRow[]> {
  try {
    // If coordinates provided — use PostGIS RPC for proximity, filter in memory
    if (lat !== undefined && lng !== undefined) {
      const { data: nearbyBounties, error } = await supabaseAdmin.rpc(
        "nearby_open_bounties",
        { p_lat: lat, p_lng: lng }
      );

      if (error) {
        console.error("[search] RPC nearby_open_bounties failed:", error.message);
        // Fall through to standard query
      } else {
        const nearby = (nearbyBounties ?? []) as BountyRow[];

        // Filter by categories if Gemini found any
        const filtered = interpretation.categories.length > 0
          ? nearby.filter((b) => interpretation.categories.includes(b.category as never))
          : nearby;

        return filterByKeywords(filtered, interpretation.keywords);
      }
    }

    // No coordinates — standard query with category filter
    let query = supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(MAX_RESULTS);

    if (interpretation.categories.length > 0) {
      query = query.in("category", interpretation.categories);
    }

    // Price signal filter
    if (interpretation.priceSignal === "budget") {
      query = query.lte("price_max", 10000); // under ₦10k = budget
    } else if (interpretation.priceSignal === "premium") {
      query = query.gte("price_min", 20000); // over ₦20k = premium
    }

    // Urgency filter
    if (
      interpretation.urgency === "immediate" ||
      interpretation.urgency === "today"
    ) {
      query = query.eq("urgency", "asap");
    }

    const { data, error } = await query;

    if (error) {
      console.error("[search] Bounty query failed:", error.message);
      return [];
    }

    return filterByKeywords((data ?? []) as BountyRow[], interpretation.keywords);

  } catch (err) {
    console.error("[search] fetchMatchingBounties threw unexpectedly:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSearchSystemPrompt(lat?: number, lng?: number): string {
  const locationContext =
    lat !== undefined && lng !== undefined
      ? `The buyer's current GPS coordinates are (${lat}, ${lng}). ` +
        `When the query contains relative location words like "near me", "close to me", ` +
        `or "around here", use these coordinates to infer the most likely Nigerian ` +
        `neighbourhood or area name and return it as the locationHint. ` +
        `If a specific area is named in the query, use that instead.`
      : `No GPS coordinates were provided. ` +
        `Extract any location mentions directly from the query text. ` +
        `If no location is mentioned, return null for locationHint.`;

  return `You are a search intent interpreter for a Nigerian peer-to-peer services and goods marketplace. Your job is to analyse a buyer's natural language search query and extract structured search intent from it.

LANGUAGE CONTEXT
Buyers communicate in Nigerian English, Pidgin English, Yoruba, Igbo, Hausa, or a mix of these. You must correctly interpret all of these. Common Pidgin patterns include:
- "who fit" = who can
- "I wan find" = I want to find
- "near me" = close to my location
- "e no go cost plenty" / "no go cost much" = should not be expensive
- "asap" / "now now" = immediately urgent
- "next week" / "next month" = flexible timing

SERVICE CATEGORIES
The platform supports these service categories. Map the query to one or more that match the buyer's intent:
${SERVICE_CATEGORIES_PROMPT_LIST}

The platform also supports these goods categories, but only match them if the buyer is clearly looking to buy a physical product:
${GOODS_CATEGORIES_PROMPT_LIST}

LOCATION CONTEXT
${locationContext}

CLASSIFICATION RULES
1. categories: Return an array of matching service categories from the list above. Return only categories that clearly match the query intent. If nothing matches, return an empty array and set isRelevant to false.
2. keywords: Extract 2–6 clean, lowercase search keywords from the query. Remove filler words. Keep specific skill words, item names, and contextual terms that would help match a listing.
3. locationHint: A human-readable Nigerian area name e.g. "Surulere, Lagos", "Wuse 2, Abuja", "Trans Amadi, Port Harcourt". Return null if no location context exists.
4. urgency: Interpret timing signals:
   - "immediate": now, asap, right now, now now, urgent, emergency
   - "today": today, this evening, tonight, later today
   - "this_week": tomorrow, this week, few days, soon
   - "flexible": next week, next month, whenever, no rush, anytime
   - Default to "flexible" if no timing signal is present.
5. priceSignal: Interpret price sensitivity:
   - "budget": cheap, affordable, no go cost plenty, low budget, make e no cost much, reasonably priced
   - "standard": no price signal — default
   - "premium": best, top quality, professional, premium, I go pay well
   - Default to "unspecified" if ambiguous.
6. confidence: A score from 0.0 to 1.0 representing how clearly you understood the query intent.
7. isRelevant: Set to false if the query is completely unrelated to buying or finding services or goods.
8. originalQuery: Return the query text exactly as you received it.

OUTPUT RULES
- Respond with ONLY a valid JSON object matching the schema.
- No markdown. No preamble. No explanation outside the JSON.`;
}

// ---------------------------------------------------------------------------
// Core interpretation logic
// ---------------------------------------------------------------------------

async function interpretSearchQuery(body: RequestBody): Promise<SearchInterpretation> {
  const cleanedQuery = sanitizeQuery(body.query);

  const userMessage = `Search query: "${cleanedQuery}"${
    body.language ? `\nQuery language hint: ${body.language}` : ""
  }

Interpret this query and return the structured search intent object.`;

  return callGemini({
    systemPrompt: buildSearchSystemPrompt(body.lat, body.lng),
    userMessage,
    schema:       SearchInterpretationSchema,
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:   "Invalid request body.",
        details: parsed.error.issues.map((e) => e.message).join("; "),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const interpretation = await interpretSearchQuery(body);

    // Fetch matching listings — empty array if query is irrelevant
    const listings = interpretation.isRelevant
      ? await fetchMatchingBounties(interpretation, body.lat, body.lng)
      : [];

    const response: SearchResponse = {
      ...interpretation,
      listings,
      ...(interpretation.confidence < LOW_CONFIDENCE_THRESHOLD
        ? { lowConfidence: true }
        : {}),
    };

    console.info(
      "[search] Query interpreted —",
      "categories:", interpretation.categories.length,
      "| listings found:", listings.length,
      "| urgency:", interpretation.urgency,
      "| priceSignal:", interpretation.priceSignal,
      "| isRelevant:", interpretation.isRelevant,
      "| confidence:", interpretation.confidence,
      "| lowConfidence:", interpretation.confidence < LOW_CONFIDENCE_THRESHOLD,
      "| locationHint present:", interpretation.locationHint !== null,
    );

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[search] interpretSearchQuery failed:", message);
    return NextResponse.json(
      { error: "Failed to interpret search query.", details: message },
      { status: 500 }
    );
  }
}