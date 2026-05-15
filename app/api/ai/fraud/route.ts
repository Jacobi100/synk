import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assessTransaction } from "@/lib/risk/scorer";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { FraudAssessment, Recommendation, RiskSignal } from "@/lib/risk/types";

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  buyerId:                  z.string().min(1),
  providerId:               z.string().min(1),
  bountyId:                 z.string().uuid().optional(),
  transactionId:            z.string().uuid().optional(),
  amount:                   z.number().positive(),
  serviceDescription:       z.string().min(1),
  category:                 z.string().min(1),
  timeElapsedMinutes:       z.number().nonnegative(),
  previousTransactionCount: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Fraud alert record shape
// ---------------------------------------------------------------------------

interface FraudAlertRecord {
  buyerId:             string;
  providerId:          string;
  bountyId?:           string;
  transactionId?:      string;
  amount:              number;
  finalScore:          number;
  recommendation:      Recommendation;
  riskFactors:         string[];
  explanation:         string;
  layer1Score:         number;
  layer2Score:         number | null;
  geminiContribution:  number | null;
  signals:             RiskSignal[];
  createdAt:           Date;
}

// ---------------------------------------------------------------------------
// Fraud alert persistence
// ---------------------------------------------------------------------------

async function writeFraudAlert(record: FraudAlertRecord): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("fraud_alerts").insert({
      buyer_id:            record.buyerId,
      provider_id:         record.providerId,
      bounty_id:           record.bountyId ?? null,
      transaction_id:      record.transactionId ?? null,
      amount:              record.amount,
      final_score:         record.finalScore,
      recommendation:      record.recommendation,
      risk_factors:        record.riskFactors,
      explanation:         record.explanation,
      layer1_score:        record.layer1Score,
      layer2_score:        record.layer2Score,
      gemini_contribution: record.geminiContribution,
      signals:             record.signals,
      created_at:          record.createdAt.toISOString(),
    });

    if (error) {
      console.error("[fraud] Failed to write alert to database:", error.message);
    } else {
      console.info(
        "[fraud] Alert persisted - recommendation:",
        record.recommendation,
        "| score:",
        record.finalScore
      );
    }
  } catch (err) {
    // Never crash the route over a failed write
    console.error("[fraud] writeFraudAlert threw unexpectedly:", err);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<FraudAssessment | ErrorResponse>> {
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
    const assessment = await assessTransaction(body);

    if (
      assessment.recommendation === "hold" ||
      assessment.recommendation === "block"
    ) {
      await writeFraudAlert({
        buyerId:            body.buyerId,
        providerId:         body.providerId,
        bountyId:           body.bountyId,
        transactionId:      body.transactionId,
        amount:             body.amount,
        finalScore:         assessment.finalScore,
        recommendation:     assessment.recommendation,
        riskFactors:        assessment.riskFactors,
        explanation:        assessment.explanation,
        layer1Score:        assessment.layer1Score,
        layer2Score:        assessment.layer2Score,
        geminiContribution: assessment.geminiContribution,
        signals:            assessment.signals,
        createdAt:          new Date(),
      });
    }

    console.info(
      "[fraud] Assessment complete - recommendation:",
      assessment.recommendation,
      "| final score:",
      assessment.finalScore,
      "| layer2 used:",
      assessment.layer2Score !== null
    );

    return NextResponse.json(assessment, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[fraud] assessTransaction failed:", message);
    return NextResponse.json(
      { error: "Failed to assess transaction.", details: message },
      { status: 500 }
    );
  }
}
