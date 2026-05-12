import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallGeminiParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userMessage: string;
  schema: T;
  /** Defaults to "gemini-2.5-flash" if omitted */
  model?: string;
}

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly raw?: string,
    public readonly attempt?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

// ---------------------------------------------------------------------------
// Internal: convert Zod schema → OpenAPI 3.0 JSON Schema for Gemini
// ---------------------------------------------------------------------------

function toGeminiSchema(schema: z.ZodTypeAny): object {
  const jsonSchema = zodToJsonSchema(schema, {
  $refStrategy: "none", // default target is jsonSchema7 — valid here     
  });

  // zodToJsonSchema wraps output in a root object; strip top-level $schema key
  // and any keys Gemini does not accept (definitions, $ref at root, etc.)
  const { $schema, definitions, ...clean } = jsonSchema as Record<string, unknown>;

  return clean;
}

// ---------------------------------------------------------------------------
// Internal: single attempt
// ---------------------------------------------------------------------------

async function runOnce<T extends z.ZodTypeAny>(
  genAI: GoogleGenerativeAI,
  params: CallGeminiParams<T>,
  attemptNumber: number
): Promise<z.infer<T>> {
  const { systemPrompt, userMessage, schema, model = "gemini-2.5-flash" } = params;

  const responseSchema = toGeminiSchema(schema);

  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      // Cast required: Gemini SDK types lag behind the actual API surface
      responseSchema: responseSchema as never,
    },
  });

  const result = await generativeModel.generateContent(userMessage);
  const raw = result.response.text();

  // --- JSON parse ---
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiError(
      `Gemini returned non-JSON on attempt ${attemptNumber}`,
      raw,
      attemptNumber
    );
  }

  // --- Zod validation ---
  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new GeminiError(
      `Schema validation failed on attempt ${attemptNumber}: ${validated.error.message}`,
      raw,
      attemptNumber
    );
  }

  return validated.data as z.infer<T>;
}

// ---------------------------------------------------------------------------
// Named export — the only public surface of this file
// ---------------------------------------------------------------------------

/**
 * Calls Gemini with controlled JSON generation.
 *
 * - Always enforces structured output via `responseMimeType: "application/json"`
 *   and a `responseSchema` derived from the Zod schema you pass.
 * - Validates the response against that same Zod schema before returning.
 * - Retries once automatically on any parse or validation failure.
 * - Throws a `GeminiError` if both attempts fail.
 * - Return type is fully inferred from the Zod schema — no manual typing needed.
 *
 * @example
 * const ListingSchema = z.object({ title: z.string(), price: z.number() });
 * const listing = await callGemini({
 *   systemPrompt: "You extract service listings.",
 *   userMessage:  transcript,
 *   schema:       ListingSchema,
 * });
 * // listing is typed as { title: string; price: number }
 */
export async function callGemini<T extends z.ZodTypeAny>(
  params: CallGeminiParams<T>
): Promise<z.infer<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY environment variable is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // --- Attempt 1 ---
  try {
    return await runOnce(genAI, params, 1);
  } catch (firstError) {
    // Surface non-Gemini errors (network, auth, quota) immediately — no retry
    if (
      firstError instanceof GeminiError === false &&
      !(firstError instanceof Error && isRetryable(firstError))
    ) {
      throw firstError;
    }

    // --- Attempt 2 (retry) ---
    try {
      return await runOnce(genAI, params, 2);
    } catch (secondError) {
      if (secondError instanceof GeminiError) throw secondError;

      throw new GeminiError(
        `Gemini call failed after 2 attempts: ${(secondError as Error).message}`,
        undefined,
        2
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Internal: classify errors worth retrying
// ---------------------------------------------------------------------------

function isRetryable(error: Error): boolean {
  // Retry on transient network / timeout / 5xx errors; not on auth/quota
  const retryablePatterns = [
    /ECONNRESET/,
    /ETIMEDOUT/,
    /fetch failed/i,
    /500/,
    /503/,
  ];
  return retryablePatterns.some((p) => p.test(error.message));
}