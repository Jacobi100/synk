// ---------------------------------------------------------------------------
// Risk System - Shared Type Contracts
//
// All types, interfaces, and constants shared across rules.ts, scorer.ts,
// and the fraud route live here. No logic. No imports. Pure contract.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Threshold constants
//
// Centralised so thresholds can be tuned independently of scoring logic.
// All bounds are inclusive on the lower bound.
// ---------------------------------------------------------------------------

export const RISK_THRESHOLD_APPROVE = 30;  // 0–29   → approve
export const RISK_THRESHOLD_BLOCK   = 70;  // 70–100 → block
                                           // 30–69  → hold

// Gemini layer only activates within the ambiguous band
export const GEMINI_LOWER_BOUND = RISK_THRESHOLD_APPROVE;
export const GEMINI_UPPER_BOUND = RISK_THRESHOLD_BLOCK;

// ---------------------------------------------------------------------------
// RiskSignal
//
// The atomic output of a single deterministic rule.
// Each signal carries a stable ruleId that persists into future ML training
// datasets - this is the labeled signal the supervised model will learn from
// as transaction history grows.
// ---------------------------------------------------------------------------

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface RiskSignal {
  /** Stable machine-readable identifier. Never rename once in production. */
  ruleId:    string;

  /** Human-readable description of what this rule detected. */
  label:     string;

  /**
   * Points this signal contributes to the total rule score (0–100 scale).
   * Signals are additive. The scorer caps the total at 100.
   */
  score:     number;

  /** Severity classification for reporting, alerting, and future model features. */
  severity:  RiskSeverity;

  /**
   * Optional structured metadata for this signal.
   * Stored alongside the alert record as a future ML feature vector.
   * Example: { amount: 95000, threshold: 50000 }
   */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Rule input shape
//
// The normalised transaction context passed to every rule function.
// Rules must not accept the raw HTTP request body directly - this contract
// decouples the rule layer from the transport layer.
// ---------------------------------------------------------------------------

export interface TransactionContext {
  buyerId:                  string;
  providerId:               string;
  amount:                   number;
  serviceDescription:       string;
  category:                 string;
  timeElapsedMinutes:       number;
  previousTransactionCount: number;
}

// ---------------------------------------------------------------------------
// Rule function signature
//
// Every rule is a pure function: TransactionContext → RiskSignal | null.
// null means the rule did not trigger for this transaction.
// Rules must have no side effects and make no external calls.
// ---------------------------------------------------------------------------

export type RuleFunction = (ctx: TransactionContext) => RiskSignal | null;

// ---------------------------------------------------------------------------
// Gemini Layer 2 output
// ---------------------------------------------------------------------------

export interface GeminiRiskAssessment {
  riskScore:  number;   // 0–100
  reasoning:  string;
  flags:      string[];
  confidence: number;   // 0–1
}

// ---------------------------------------------------------------------------
// Final fraud assessment - the route's response shape
// ---------------------------------------------------------------------------

export type Recommendation = "approve" | "hold" | "block";

export interface FraudAssessment {
  finalScore:          number;
  recommendation:      Recommendation;
  riskFactors:         string[];
  explanation:         string;
  confidence:          number;
  layer1Score:         number;
  layer2Score:         number | null;
  /** Points added by Gemini's contextual analysis. Null if Layer 2 did not run. */
  geminiContribution:  number | null;
  signals:             RiskSignal[];
}
