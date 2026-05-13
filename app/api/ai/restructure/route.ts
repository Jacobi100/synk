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
// Listing output schema — enforced on every Gemini response
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
// Route response shape
// ---------------------------------------------------------------------------

interface SuccessResponse {
  listing:           Listing;
  transcript:        string;
  detectedLanguage?: string;
  coordinates?:      { lat: number; lng: number };
  marketplaceType:   "services";
}

interface ErrorResponse {
  error:   string;
  details?: string;
}

// ---------------------------------------------------------------------------
// System prompt builder
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
// Core business logic — extracted from the route handler
// ---------------------------------------------------------------------------

async function processListing(body: RequestBody): Promise<{
  listing:           Listing;
  transcript:        string;
  detectedLanguage?: string;
}> {
  let transcript:        string;
  let detectedLanguage:  string | undefined;

  // Step 1: Resolve transcript — from audio or direct input
  if (body.audio) {
    const result = await transcribeAudio({
      audioBase64: body.audio,
      mimeType:    (body.mimeType as "audio/webm" | "audio/mp4") ?? "audio/webm",
      language:    body.language as Parameters<typeof transcribeAudio>[0]["language"],
    });

    transcript       = result.transcript;
    detectedLanguage = result.detectedLanguage;
  } else {
    // body.transcript is guaranteed by RequestSchema refinement
    transcript = body.transcript!;
  }

  // Step 2: Build user message — inject location context if coordinates present
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

  // Step 3: Call Gemini with controlled generation
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

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  // Validate input
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

  // Process listing
  try {
    const { listing, transcript, detectedLanguage } = await processListing(body);

    const response: SuccessResponse = {
      listing,
      transcript,
      marketplaceType: "services",
      ...(detectedLanguage              ? { detectedLanguage }                            : {}),
      ...(body.lat !== undefined && body.lng !== undefined
        ? { coordinates: { lat: body.lat, lng: body.lng } }
        : {}),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    // Do not log audio bytes or transcript content — no sensitive data in logs
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";

    console.error("[restructure] processListing failed:", message);

    return NextResponse.json(
      { error: "Failed to process listing.", details: message },
      { status: 500 }
    );
  }
}