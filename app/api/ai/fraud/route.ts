import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGemini } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Risk threshold constants
//
// Centralised here so thresholds can be tuned without touching scoring logic.
// All values are inclusive on the lower bound, exclusive on the upper bound.
// ---------------------------------------------------------------------------

const THRESHOLD_AUTO_APPROVE = 30;  // 0–29   → approve
const THRESHOLD_AUTO_BLOCK   = 70;  // 70–100 → block
                                    // 30–69  → hold

// Gemini is only called when the rule score falls in the ambiguous band.
const GEMINI_LOWER_BOUND = THRESHOLD_AUTO_APPROVE;
const GEMINI_UPPER_BOUND = THRESHOLD_AUTO_BLOCK;

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  buyerId:                  z.string().min(1),
  providerId:               z.string().min(1),
  amount:                   z.number().positive(),
  serviceDescription:       z.string().min(1),
  timeElapsedMinutes:       z.number().nonnegative(),
  previousTransactionCount: z.number().int().nonnegative(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// ---------------------------------------------------------------------------
// Gemini Layer 2 output schema
// ---------------------------------------------------------------------------

const GeminiRiskSchema = z.object({
  riskScore:  z.number().min(0).max(100),
  reasoning:  z.string(),
  flags:      z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

type GeminiRisk = z.infer<typeof GeminiRiskSchema>;

// ---------------------------------------------------------------------------
// Route response types
// ---------------------------------------------------------------------------

type Recommendation = "approve" | "hold" | "block";

interface FraudAssessment {
  finalScore:      number;
  recommendation:  Recommendation;
  riskFactors:     string[];
  explanation:     string;
  confidence:      number;
  layer1Score:     number;
  layer2Score:     number | null;
}

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Layer 1 — deterministic rule-based scoring
//
// Pure function. No side effects. No external calls.
// Returns a score from 0–100 and the list of triggered risk factors.
// ---------------------------------------------------------------------------

interface RuleScoreResult {
  score:       number;
  riskFactors: string[];
}

function calculateRuleScore(body: RequestBody): RuleScoreResult {
  let score       = 0;
  const factors: string[] = [];

  // Rule 1: Unusually fast completion
  // Under 2 minutes for any service is a strong signal of a fake transaction.
  if (body.timeElapsedMinutes < 2) {
    score += 35;
    factors.push("Service completed in under 2 minutes — likely fraudulent.");
  } else if (body.timeElapsedMinutes < 5) {
    score += 15;
    factors.push("Service completed unusually quickly.");
  }

  // Rule 2: Round-number amount
  // Common in test transactions and collusion patterns.
  if (body.amount % 1000 === 0 && body.amount >= 5000) {
    score += 10;
    factors.push("Transaction amount is a large round number.");
  }

  // Rule 3: High-value transaction on a new or low-activity account pair
  // High amounts between users with no prior transaction history is elevated risk.
  if (body.amount > 50_000 && body.previousTransactionCount === 0) {
    score += 25;
    factors.push("High-value first transaction between these two users.");
  } else if (body.amount > 100_000) {
    score += 15;
    factors.push("Transaction amount exceeds ₦100,000.");
  }

  // Rule 4: Excessive repeat transactions between the same two users
  // More than 10 transactions between the same pair within a session is unusual.
  if (body.previousTransactionCount > 10) {
    score += 20;
    factors.push("Unusually high number of repeat transactions between these two users.");
  } else if (body.previousTransactionCount > 5) {
    score += 10;
    factors.push("Elevated repeat transaction count between these two users.");
  }

  // Rule 5: Very low amount — possible test or collusion transaction
  if (body.amount < 200) {
    score += 10;
    factors.push("Transaction amount is unusually low (under ₦200).");
  }

  return {
    score:       Math.min(score, 100),
    riskFactors: factors,
  };
}

// ---------------------------------------------------------------------------
// Layer 2 — Gemini contextual risk analysis
//
// Only called when rule score is in the ambiguous range (30–69).
// Gemini receives the full transaction context and returns a supplementary
// risk assessment. It does NOT make the final payment decision.
// ---------------------------------------------------------------------------

function buildFraudSystemPrompt(): string {
  return `You are a fraud analysis assistant for a Nigerian peer-to-peer services payment platform. Your role is to assess whether a transaction shows signs of fraud, collusion, or abuse.

Platform context:
- Payments are released AFTER a service is rendered and confirmed by the buyer.
- Users are everyday Nigerians — market workers, artisans, and tradespeople.
- Services are informal economy services: repairs, deliveries, cleaning, catering, beauty, tutoring, and similar.

Your task:
- Analyse the transaction details provided.
- Identify semantic inconsistencies between the service description and the transaction behaviour.
- Consider: Does the price match the type of service described? Is the completion time realistic? Does the pattern suggest collusion between buyer and provider?
- A deterministic rule-based system has already scored this transaction. Your job is to add contextual reasoning, not replace rule logic.

Scoring guidance:
- Return a riskScore from 0 to 100 where 0 is no risk and 100 is certain fraud.
- Return a confidence from 0.0 to 1.0 representing how certain you are of your assessment given the available information.
- Return specific, actionable flags — not generic warnings.
- Return a short reasoning string (2–4 sentences) explaining your assessment.

Output ONLY valid JSON matching the schema. No markdown. No preamble. No explanation outside the JSON object.`;
}

async function runGeminiRiskLayer(
  body:            RequestBody,
  layer1Score:     number,
  layer1Factors:   string[]
): Promise<GeminiRisk> {
  const userMessage = `Transaction details for fraud assessment:

Service description: "${body.serviceDescription}"
Transaction amount: ₦${body.amount.toLocaleString("en-NG")}
Time elapsed since service started: ${body.timeElapsedMinutes} minutes
Previous transactions between these two users: ${body.previousTransactionCount}
Rule-based risk score (Layer 1): ${layer1Score} / 100
Rule-based flags: ${layer1Factors.length > 0 ? layer1Factors.join("; ") : "None"}

Assess the fraud risk for this transaction based on the full context above.`;

  return callGemini({
    systemPrompt: buildFraudSystemPrompt(),
    userMessage,
    schema:       GeminiRiskSchema,
  });
}

// ---------------------------------------------------------------------------
// Recommendation derivation
// ---------------------------------------------------------------------------

function deriveRecommendation(score: number): Recommendation {
  if (score < THRESHOLD_AUTO_APPROVE) return "approve";
  if (score >= THRESHOLD_AUTO_BLOCK)  return "block";
  return "hold";
}

// ---------------------------------------------------------------------------
// Fraud alert persistence
//
// Writes a record to the fraud_alerts table for any held or blocked transaction.
// Replace the body of this function with your database client call.
// The interface is DB-agnostic — swap in Prisma, Drizzle, or Supabase as needed.
// ---------------------------------------------------------------------------

interface FraudAlertRecord {
  buyerId:         string;
  providerId:      string;
  amount:          number;
  finalScore:      number;
  recommendation:  Recommendation;
  riskFactors:     string[];
  explanation:     string;
  layer1Score:     number;
  layer2Score:     number | null;
  createdAt:       Date;
}

async function writeFraudAlert(record: FraudAlertRecord): Promise<void> {
  // ---------------------------------------------------------------------------
  // TODO: Replace this block with your database client.
  //
  // Prisma example:
  //   await prisma.fraudAlert.create({ data: record });
  //
  // Drizzle example:
  //   await db.insert(fraudAlerts).values(record);
  //
  // Supabase example:
  //   await supabase.from("fraud_alerts").insert(record);
  // ---------------------------------------------------------------------------

  // Temporary: log a sanitised alert shape (no sensitive financial detail)
  console.warn("[fraud] Alert flagged — recommendation:", record.recommendation, "| score:", record.finalScore);
}

// ---------------------------------------------------------------------------
// Core orchestration — extracted from route handler
// ---------------------------------------------------------------------------

async function assessTransaction(body: RequestBody): Promise<FraudAssessment> {
  // Layer 1 — always runs first
  const { score: layer1Score, riskFactors: layer1Factors } = calculateRuleScore(body);

  let layer2Score:     number | null = null;
  let geminiFlags:     string[]      = [];
  let geminiReasoning: string        = "";
  let confidence:      number        = 0.9; // high confidence for pure rule decisions

  // Layer 2 — only runs when rule score is ambiguous
  const isAmbiguous =
    layer1Score >= GEMINI_LOWER_BOUND &&
    layer1Score < GEMINI_UPPER_BOUND;

  if (isAmbiguous) {
    const geminiResult = await runGeminiRiskLayer(body, layer1Score, layer1Factors);

    layer2Score     = geminiResult.riskScore;
    geminiFlags     = geminiResult.flags;
    geminiReasoning = geminiResult.reasoning;
    confidence      = geminiResult.confidence;
  }

  // Final score: average of both layers when Layer 2 ran, Layer 1 alone otherwise
  const finalScore =
    layer2Score !== null
      ? Math.round((layer1Score + layer2Score) / 2)
      : layer1Score;

  const recommendation = deriveRecommendation(finalScore);

  const allFlags = [...layer1Factors, ...geminiFlags];

  const explanation =
    geminiReasoning ||
    (layer1Factors.length > 0
      ? `Rule-based analysis flagged: ${layer1Factors[0]}`
      : "No significant risk factors detected.");

  return {
    finalScore,
    recommendation,
    riskFactors: allFlags,
    explanation,
    confidence,
    layer1Score,
    layer2Score,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<FraudAssessment | ErrorResponse>> {
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
        details: parsed.error.errors.map((e) => e.message).join("; "),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Run fraud assessment
  try {
    const assessment = await assessTransaction(body);

    // Persist alert for held or blocked transactions
    if (assessment.recommendation === "hold" || assessment.recommendation === "block") {
      await writeFraudAlert({
        buyerId:        body.buyerId,
        providerId:     body.providerId,
        amount:         body.amount,
        finalScore:     assessment.finalScore,
        recommendation: assessment.recommendation,
        riskFactors:    assessment.riskFactors,
        explanation:    assessment.explanation,
        layer1Score:    assessment.layer1Score,
        layer2Score:    assessment.layer2Score,
        createdAt:      new Date(),
      });
    }

    // Log anonymised transaction shape only — no IDs, no amounts, no descriptions
    console.info(
      "[fraud] Assessment complete — recommendation:",
      assessment.recommendation,
      "| final score:",
      assessment.finalScore,
      "| layer2 used:",
      assessment.layer2Score !== null
    );

    return NextResponse.json(assessment, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[fraud] assessTransaction failed:", message);

    return NextResponse.json(
      { error: "Failed to assess transaction.", details: message },
      { status: 500 }
    );
  }
}