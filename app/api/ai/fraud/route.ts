import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assessTransaction } from "@/lib/risk/scorer";
import type { FraudAssessment, Recommendation, RiskSignal } from "@/lib/risk/types";

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

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error:    string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Fraud alert persistence
//
// Writes a record to the fraud_alerts table for held or blocked transactions.
// Replace the body of this function with your database client.
// The interface is DB-agnostic — swap in Prisma, Drizzle, or Supabase.
// ---------------------------------------------------------------------------

interface FraudAlertRecord {
  buyerId:             string;
  providerId:          string;
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

async function writeFraudAlert(record: FraudAlertRecord): Promise<void> {
  // ---------------------------------------------------------------------------
  // TODO: Replace with your database client.
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

  console.warn(
    "[fraud] Alert persisted — recommendation:",
    record.recommendation,
    "| score:",
    record.finalScore
  );
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

  // Run two-layer fraud assessment
  try {
    const assessment = await assessTransaction(body);

    // Persist alert for held or blocked transactions
    if (
      assessment.recommendation === "hold" ||
      assessment.recommendation === "block"
    ) {
      await writeFraudAlert({
        buyerId:            body.buyerId,
        providerId:         body.providerId,
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

    // Anonymised log — no IDs, no amounts, no descriptions
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
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    console.error("[fraud] assessTransaction failed:", message);

    return NextResponse.json(
      { error: "Failed to assess transaction.", details: message },
      { status: 500 }
    );
  }
}