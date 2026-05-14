import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGemini } from "@/lib/gemini";
import { transcribeAudio } from "@/lib/speech";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORIES_PROMPT_LIST,
  MIN_TAGS_PER_LISTING,
  MAX_TAGS_PER_LISTING,
} from "@/lib/categories";

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const RequestSchema = z
  .object({
    audio:      z.string().optional(),
    transcript: z.string().optional(),
    language:   z.string().optional(),
    mimeType:   z.string().optional(),
    lat:        z.number().optional(),
    lng:        z.number().optional(),
  })
  .refine((data) => data.audio || data.transcript, {
    message: "Request must include either audio or transcript.",
  });

type RequestBody = z.infer<typeof RequestSchema>;

// ---------------------------------------------------------------------------
// Listing output schema
// ---------------------------------------------------------------------------

const PriceRangeSchema = z.object({
  minPrice: z.number().positive(),
  maxPrice: z.number().positive(),
});

const ListingSchema = z.object({
  title:             z.string(),
  category:          z.enum(SERVICE_CATEGORIES),
  description:       z.string(),
  tags:              z.array(z.string()).min(MIN_TAGS_PER_LISTING).max(MAX_TAGS_PER_LISTING),
  priceRange:        PriceRangeSchema,
  userProvidedPrice: z.number().positive().optional(),
  currency:          z.literal("NGN"),
  confidence:        z.number().min(0).max(1),
});

type Listing = z.infer<typeof ListingSchema>;

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface SuccessResponse {
  listing:             Listing;
  transcript:          string;
  detectedLanguage?:   string;
  coordinates?:        { lat: number; lng: number };
  neighbourhoodLabel?: string;
  marketplaceType:     "services";
}

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Google Maps reverse geocoding
// ---------------------------------------------------------------------------

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("[restructure] GOOGLE_MAPS_API_KEY is not set — skipping geocoding.");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res  = await fetch(url);
    const data = await res.json() as {
      status:   string;
      results:  {
        formatted_address:  string;
        address_components: { long_name: string; types: string[] }[];
      }[];
    };

    if (data.status !== "OK" || !data.results?.length) {
      console.warn("[restructure] Geocoding returned status:", data.status);
      return null;
    }

    const components = data.results[0].address_components;

    // Priority: neighbourhood → sublocality → locality
    const neighbourhood = components.find((c) =>
      c.types.includes("neighborhood") ||
      c.types.includes("sublocality_level_1") ||
      c.types.includes("sublocality")
    )?.long_name;

    const city = components.find((c) =>
      c.types.includes("locality")
    )?.long_name;

    if (neighbourhood && city) return `${neighbourhood}, ${city}`;
    if (neighbourhood)         return neighbourhood;
    if (city)                  return city;

    // Last resort — first two parts of formatted address
    return data.results[0].formatted_address
      .split(",")
      .slice(0, 2)
      .join(",")
      .trim();

  } catch (err) {
    console.error("[restructure] reverseGeocode failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are an AI assistant operating inside a Nigerian informal economy services marketplace. Your task is to convert a spoken or typed service description into a clean, structured listing ready for publication.

The platform connects everyday Nigerians — market women, artisans, tradespeople, and skilled workers — with buyers nearby. Input arrives as transcribed speech from Yoruba, Igbo, Hausa, Nigerian Pidgin, or Nigerian English. It may be informal, fragmented, or incomplete. Interpret intent accurately and produce a professional listing from whatever information is available.

CATEGORY RULES
- Assign exactly one category from this fixed list: ${SERVICE_CATEGORIES_PROMPT_LIST}
- Choose the closest match based on the service described.
- If the input is genuinely ambiguous and fits no category well, use: Other Services

TAG RULES
- Generate between ${MIN_TAGS_PER_LISTING} and ${MAX_TAGS_PER_LISTING} tags.
- Tags must be lowercase strings with no special characters.
- Tags must reflect specific skills, tools, service subtypes, or Nigerian market terminology relevant to this listing.
- Be specific, not generic. Good: ["hair braiding", "ghana weaving", "home service"]. Poor: ["beauty", "service", "help"].
- Tags will be used for search, recommendation, and marketplace intelligence — accuracy matters.

PRICING RULES
- All prices must be in Nigerian Naira (NGN).
- Always return a priceRange with minPrice and maxPrice that reflects realistic informal economy rates for this type of service in Nigeria.
- If the speaker explicitly stated a price, capture it in userProvidedPrice. Also return a priceRange around that figure.
- If no price was mentioned, estimate a reasonable market range based on the service category and description.
- Ranges must be realistic — not formal business rates, not aspirational figures.

CONFIDENCE RULES
- Return a confidence score from 0.0 to 1.0 representing how well you understood the input.
- 1.0: Input was clear, complete, and unambiguous.
- 0.7: Input was mostly clear with minor gaps that required reasonable inference.
- 0.5: Input was partial or fragmented and required significant inference.
- 0.3 or below: Input was too unclear or too short to classify reliably.

DESCRIPTION RULES
- Write a short, professional third-person description of the service based on what was said.
- 1 to 3 sentences. Do not add information that was not implied by the input.
- Do not mention the speaker by name or personal details.

OUTPUT RULES
- Respond with ONLY a valid JSON object. No markdown. No explanation. No preamble.
- Every field in the schema is required unless marked optional.`;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

async function processListing(body: RequestBody): Promise<{
  listing:           Listing;
  transcript:        string;
  detectedLanguage?: string;
}> {
  let transcript:       string;
  let detectedLanguage: string | undefined;

  if (body.audio) {
    const result = await transcribeAudio({
      audioBase64: body.audio,
      mimeType:    (body.mimeType as "audio/webm" | "audio/mp4") ?? "audio/webm",
      language:    body.language as Parameters<typeof transcribeAudio>[0]["language"],
    });
    transcript       = result.transcript;
    detectedLanguage = result.detectedLanguage;
  } else {
    transcript = body.transcript!;
  }

  const locationContext =
    body.lat !== undefined && body.lng !== undefined
      ? `The service provider's device reported coordinates: (${body.lat}, ${body.lng}). ` +
        `Do not attempt to name the neighbourhood — location labelling is handled by a separate system. ` +
        `Use the coordinates only if they help contextualise the service description.`
      : `No location coordinates were provided with this request.`;

  const userMessage = `Service description (transcribed from voice or typed input):
"${transcript}"

Location context: ${locationContext}

Classify this into a structured service listing.`;

  const listing = await callGemini({
    systemPrompt: buildSystemPrompt(),
    userMessage,
    schema:       ListingSchema,
  });

  return { listing, transcript, detectedLanguage };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
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
    const { listing, transcript, detectedLanguage } = await processListing(body);

    // Reverse geocode coordinates into a human-readable neighbourhood label
    let neighbourhoodLabel: string | undefined;
    if (body.lat !== undefined && body.lng !== undefined) {
      neighbourhoodLabel = (await reverseGeocode(body.lat, body.lng)) ?? undefined;
    }

    const response: SuccessResponse = {
      listing,
      transcript,
      marketplaceType: "services",
      ...(detectedLanguage  ? { detectedLanguage }                          : {}),
      ...(neighbourhoodLabel ? { neighbourhoodLabel }                        : {}),
      ...(body.lat !== undefined && body.lng !== undefined
        ? { coordinates: { lat: body.lat, lng: body.lng } }
        : {}),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[restructure] processListing failed:", message);
    return NextResponse.json(
      { error: "Failed to process listing.", details: message },
      { status: 500 }
    );
  }
}