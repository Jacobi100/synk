import { callGemini } from "@/lib/gemini";
import { ALL_RULES } from "./rules";
import {
  GEMINI_LOWER_BOUND,
  GEMINI_UPPER_BOUND,
  RISK_THRESHOLD_APPROVE,
  RISK_THRESHOLD_BLOCK,
} from "./types";
import type {
  FraudAssessment,
  GeminiRiskAssessment,
  Recommendation,
  RiskSignal,
  TransactionContext,
} from "./types";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Gemini Layer 2 schema
// ---------------------------------------------------------------------------

const GeminiRiskSchema = z.object({
  riskScore:  z.number().min(0).max(100),
  reasoning:  z.string(),
  flags:      z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

// ---------------------------------------------------------------------------
// Layer 1 - run all deterministic rules and aggregate signals
// ---------------------------------------------------------------------------

interface Layer1Result {
  score:   number;
  signals: RiskSignal[];
}

function runRuleLayer(ctx: TransactionContext): Layer1Result {
  const signals: RiskSignal[] = [];

  for (const rule of ALL_RULES) {
    const signal = rule(ctx);
    if (signal !== null) signals.push(signal);
  }

  const raw   = signals.reduce((sum, s) => sum + s.score, 0);
  const score = Math.min(raw, 100);

  return { score, signals };
}

// ---------------------------------------------------------------------------
// Layer 2 - Gemini contextual risk analysis
//
// Only called when Layer 1 score falls in the ambiguous band (30–69).
// Receives the full transaction context including service description so
// Gemini can detect semantic inconsistencies rule logic cannot see.
// Gemini supplements deterministic scoring. It does not override it.
// ---------------------------------------------------------------------------

function buildFraudSystemPrompt(): string {
  return `You are a fraud analysis assistant for a Nigerian peer-to-peer services payment platform. Payments are always released after the buyer confirms a service was delivered.

Your role is to supplement a deterministic rule-based risk scoring system by adding contextual reasoning. You do not make the final payment decision. You provide a contextual risk score that adds to the rule-based score. Your score can only increase the final risk rating, never reduce it.

Platform context:
- Users are everyday Nigerians: artisans, market workers, tradespeople, and buyers.
- Services are informal economy services: repairs, deliveries, cleaning, catering, beauty, tutoring, errands, and similar.
- All amounts are in Nigerian Naira (NGN).

Your analysis must:
1. Assess whether the service description is consistent with the transaction amount and elapsed time.
2. Identify semantic inconsistencies. Example: a ₦95,000 charge for a laundry service, or a 3-minute completion time for a home repair.
3. Consider whether the transaction pattern suggests collusion, wash trading, or account abuse.
4. Return specific, actionable flags. Do not give generic warnings.

Scoring guidance:
- riskScore: 0 = no risk, 100 = certain fraud.
- confidence: 0.0 = highly uncertain, 1.0 = highly certain.
- reasoning: 2–4 sentences explaining your assessment.
- flags: specific suspicious patterns you identified.

Output ONLY valid JSON matching the schema. No markdown. No preamble. No explanation outside the JSON.`;
}

async function runGeminiLayer(
  ctx:      TransactionContext,
  layer1:   Layer1Result
): Promise<GeminiRiskAssessment> {
  const triggeredLabels = layer1.signals.map((s) => s.label);

  const userMessage = `Transaction context for fraud assessment:

Service description: "${ctx.serviceDescription}"
Transaction amount: ₦${ctx.amount.toLocaleString("en-NG")}
Time elapsed since service started: ${ctx.timeElapsedMinutes} minutes
Previous transactions between these two users: ${ctx.previousTransactionCount}

Deterministic rule score (Layer 1): ${layer1.score} / 100
Rule signals triggered: ${
    triggeredLabels.length > 0
      ? triggeredLabels.join("; ")
      : "None"
  }

Assess the contextual fraud risk for this transaction.`;

  return callGemini({
    systemPrompt: buildFraudSystemPrompt(),
    userMessage,
    schema:       GeminiRiskSchema,
  });
}

// ---------------------------------------------------------------------------
// Gemini contribution - tiered additive scaling
//
// Converts Gemini's 0–100 risk score into a bounded additive value that is
// added on top of the Layer 1 deterministic score. Gemini can never reduce
// the score - it can only add weight when it detects contextual risk the
// rules could not see.
//
// Contribution bands:
//   Gemini score  0–30  (reasonable)  → adds  0–10 points
//   Gemini score 31–70  (uncertain)   → adds 10–20 points
//   Gemini score 71–100 (suspicious)  → adds 20–35 points
//
// The ceiling of +35 means Gemini alone cannot block a clean transaction.
// Layer 1 must have already flagged something for the total to reach 70.
// ---------------------------------------------------------------------------

function calculateGeminiContribution(geminiScore: number): number {
  if (geminiScore <= 30) {
    // Reasonable: scales 0 → 10
    return Math.round((geminiScore / 30) * 10);
  } else if (geminiScore <= 70) {
    // Uncertain: scales 10 → 20
    return Math.round(10 + ((geminiScore - 30) / 40) * 10);
  } else {
    // Suspicious: scales 20 → 35
    return Math.round(20 + ((geminiScore - 70) / 30) * 15);
  }
}

// ---------------------------------------------------------------------------
// Recommendation derivation
// ---------------------------------------------------------------------------

function deriveRecommendation(score: number): Recommendation {
  if (score < RISK_THRESHOLD_APPROVE) return "approve";
  if (score >= RISK_THRESHOLD_BLOCK)  return "block";
  return "hold";
}

// ---------------------------------------------------------------------------
// Main export - full two-layer assessment pipeline
// ---------------------------------------------------------------------------

/**
 * Runs the full two-layer fraud assessment pipeline for a transaction.
 *
 * Layer 1 (always): deterministic rule-based scoring using ALL_RULES.
 * Layer 2 (conditional): Gemini contextual analysis, only when Layer 1
 * score falls in the ambiguous band defined by GEMINI_LOWER_BOUND and
 * GEMINI_UPPER_BOUND.
 *
 * Final score = Layer 1 score + Gemini additive contribution.
 * Gemini can only increase the score, never reduce it.
 * Maximum Gemini contribution is +35 points, capped at 100 total.
 *
 * @param ctx - Normalised transaction context.
 * @returns A fully resolved FraudAssessment ready for the route to return.
 */
export async function assessTransaction(
  ctx: TransactionContext
): Promise<FraudAssessment> {
  // Layer 1 - always runs
  const layer1 = runRuleLayer(ctx);

  let layer2Score:     number | null = null;
  let geminiFlags:     string[]      = [];
  let geminiReasoning: string        = "";
  let confidence:      number        = 0.95; // high confidence for pure rule decisions

  // Layer 2 - conditional on ambiguous band
  const isAmbiguous =
    layer1.score >= GEMINI_LOWER_BOUND &&
    layer1.score < GEMINI_UPPER_BOUND;

  if (isAmbiguous) {
    const gemini  = await runGeminiLayer(ctx, layer1);
    layer2Score   = gemini.riskScore;
    geminiFlags   = gemini.flags;
    geminiReasoning = gemini.reasoning;
    confidence    = gemini.confidence;
  }

  // Final score - Layer 1 baseline + Gemini additive contribution
  // Gemini never reduces the score. Contribution is tiered by Gemini's
  // own risk assessment. Total is capped at 100.
  const geminiContribution =
    layer2Score !== null ? calculateGeminiContribution(layer2Score) : 0;

  const finalScore = Math.min(100, layer1.score + geminiContribution);

  const recommendation = deriveRecommendation(finalScore);

  // Merge all risk factor labels from both layers
  const riskFactors = [
    ...layer1.signals.map((s) => s.label),
    ...geminiFlags,
  ];

  const explanation =
    geminiReasoning ||
    (layer1.signals.length > 0
      ? layer1.signals[0].label
      : "No significant risk factors detected.");

  return {
    finalScore,
    recommendation,
    riskFactors,
    explanation,
    confidence,
    layer1Score:         layer1.score,
    layer2Score,
    geminiContribution:  geminiContribution > 0 ? geminiContribution : null,
    signals:             layer1.signals,
  };
}
