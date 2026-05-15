import type { RuleFunction, RiskSignal, TransactionContext } from "./types";
import type { ServiceCategory } from "@/lib/categories";

// ---------------------------------------------------------------------------
// Risk Rules - Deterministic Signal Generators
//
// Each exported rule is a pure function: TransactionContext → RiskSignal | null.
// null means the rule did not fire for this transaction.
//
// Rules are stateless, side-effect-free, and independently testable.
// ruleId values are stable identifiers - do not rename them once transactions
// are being stored, as they form the label schema for future ML training data.
//
// Score weights are calibrated for the Nigerian informal economy context:
// low transaction volumes, cash-equivalent P2P payments, no card network signals.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Rule: SPEED_CRITICAL
// Under 2 minutes is physically impossible for almost any real service.
// Strongest single signal of a fake or pre-arranged fraudulent transaction.
// ---------------------------------------------------------------------------

export const checkSpeedCritical: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.timeElapsedMinutes >= 2) return null;

  return {
    ruleId:   "SPEED_CRITICAL",
    label:    "Service marked complete in under 2 minutes - physically implausible.",
    score:    40,
    severity: "critical",
    metadata: { timeElapsedMinutes: ctx.timeElapsedMinutes },
  };
};

// ---------------------------------------------------------------------------
// Rule: SPEED_SUSPICIOUS
// Under 5 minutes is very fast for any informal economy service.
// Elevated risk when no other signals are present; compounding when combined.
// ---------------------------------------------------------------------------

export const checkSpeedSuspicious: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.timeElapsedMinutes < 2 || ctx.timeElapsedMinutes >= 5) return null;

  return {
    ruleId:   "SPEED_SUSPICIOUS",
    label:    "Service completed unusually quickly (2–5 minutes).",
    score:    15,
    severity: "medium",
    metadata: { timeElapsedMinutes: ctx.timeElapsedMinutes },
  };
};

// ---------------------------------------------------------------------------
// Rule: ROUND_AMOUNT_LARGE
// Large round-number amounts are a common pattern in test transactions,
// collusion rings, and wash trading on P2P platforms.
// ---------------------------------------------------------------------------

export const checkRoundAmountLarge: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.amount % 1000 !== 0 || ctx.amount < 30_000) return null;

  return {
    ruleId:   "ROUND_AMOUNT_LARGE",
    label:    "Round-number transaction amount above ₦30,000 - common in test or collusion patterns.",
    score:    10,
    severity: "low",
    metadata: { amount: ctx.amount },
  };
};

// ---------------------------------------------------------------------------
// Rule: HIGH_VALUE_FIRST_TRANSACTION
// A high-value payment between two users with no prior transaction history
// is a significant risk signal - normal trust builds gradually.
// ---------------------------------------------------------------------------

export const checkHighValueFirstTransaction: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.amount <= 75_000 || ctx.previousTransactionCount > 0) return null;

  return {
    ruleId:   "HIGH_VALUE_FIRST_TRANSACTION",
    label:    "High-value first transaction between these two users.",
    score:    28,
    severity: "high",
    metadata: {
      amount:                   ctx.amount,
      threshold:                75_000,
      previousTransactionCount: ctx.previousTransactionCount,
    },
  };
};

// ---------------------------------------------------------------------------
// Rule: HIGH_VALUE_ABSOLUTE
// Transactions above ₦100,000 are flagged regardless of history.
// Threshold reflects the upper bound of typical informal economy service fees.
// ---------------------------------------------------------------------------

export const checkHighValueAbsolute: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.amount <= 100_000) return null;

  return {
    ruleId:   "HIGH_VALUE_ABSOLUTE",
    label:    "Transaction amount exceeds ₦100,000.",
    score:    15,
    severity: "medium",
    metadata: { amount: ctx.amount },
  };
};

// ---------------------------------------------------------------------------
// Rule: REPEAT_EXCESSIVE
// More than 10 transactions between the same user pair is a strong collusion
// signal - normal users rarely transact this frequently in a single session.
// ---------------------------------------------------------------------------

export const checkRepeatExcessive: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.previousTransactionCount <= 10) return null;

  return {
    ruleId:   "REPEAT_EXCESSIVE",
    label:    "Excessive repeat transactions between the same two users.",
    score:    22,
    severity: "high",
    metadata: { previousTransactionCount: ctx.previousTransactionCount },
  };
};

// ---------------------------------------------------------------------------
// Rule: REPEAT_ELEVATED
// 6–10 repeat transactions is elevated but not conclusive alone.
// Meaningful when combined with speed or amount signals.
// ---------------------------------------------------------------------------

export const checkRepeatElevated: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.previousTransactionCount <= 5 || ctx.previousTransactionCount > 10) return null;

  return {
    ruleId:   "REPEAT_ELEVATED",
    label:    "Elevated repeat transaction count between these two users.",
    score:    10,
    severity: "medium",
    metadata: { previousTransactionCount: ctx.previousTransactionCount },
  };
};

// ---------------------------------------------------------------------------
// Rule: LOW_AMOUNT_SUSPICIOUS
// Amounts under ₦200 are below the floor of any real informal economy service.
// Typically test transactions or fee-farming micro-transactions.
// ---------------------------------------------------------------------------

export const checkLowAmountSuspicious: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.amount >= 200) return null;

  return {
    ruleId:   "LOW_AMOUNT_SUSPICIOUS",
    label:    "Transaction amount is below ₦200 - too low for any real service.",
    score:    10,
    severity: "low",
    metadata: { amount: ctx.amount },
  };
};


// ---------------------------------------------------------------------------
// Rule: SELF_DEALING
// Buyer and provider are the same user. This is always fraud - a user cannot
// legitimately pay themselves for a service. Fires with maximum score so the
// transaction is blocked immediately without entering the Gemini band.
// ---------------------------------------------------------------------------

export const checkSelfDealing: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  if (ctx.buyerId !== ctx.providerId) return null;

  return {
    ruleId:   "SELF_DEALING",
    label:    "Buyer and provider are the same user - self-dealing detected.",
    score:    100,
    severity: "critical",
    metadata: { userId: ctx.buyerId },
  };
};

// ---------------------------------------------------------------------------
// Rule: PRICE_CATEGORY_MISMATCH
// Transaction amount exceeds the realistic ceiling for the service category
// in the Nigerian informal economy. A ₦150,000 laundry job or a ₦90,000
// errand is a strong semantic fraud signal.
// ---------------------------------------------------------------------------

const CATEGORY_PRICE_CEILINGS: Partial<Record<ServiceCategory, number>> = {
  "House Maintenance & Repairs":     250_000,
  "Delivery & Running Around":       60_000,
  "Cleaning & Laundry":              35_000,
  "Shopping & Errands":              25_000,
  "Yard Work & Landscaping":         45_000,
  "House Sitting & Pet Care":        40_000,
  "Local Marketing & Distribution":  80_000,
  "Domestic Help & Chores":          30_000,
  "Other Tasks":                     100_000,
};

export const checkPriceCategoryMismatch: RuleFunction = (
  ctx: TransactionContext
): RiskSignal | null => {
  const ceiling = CATEGORY_PRICE_CEILINGS[ctx.category as ServiceCategory];
  if (ceiling === undefined || ctx.amount <= ceiling) return null;

  return {
    ruleId:   "PRICE_CATEGORY_MISMATCH",
    label:    `Transaction amount exceeds the realistic ceiling for "${ctx.category}" (ceiling: ₦${ceiling.toLocaleString("en-NG")}).`,
    score:    25,
    severity: "high",
    metadata: {
      category: ctx.category,
      amount:   ctx.amount,
      ceiling,
    },
  };
};

// ---------------------------------------------------------------------------
// Rule registry
//
// All rules in execution order. The scorer iterates this array - add new
// rules here and they are automatically included in scoring without touching
// scorer.ts. Order does not affect scoring but does affect signal ordering
// in the output and alert records.
// ---------------------------------------------------------------------------

export const ALL_RULES: RuleFunction[] = [
  checkSelfDealing,          // always first - self-dealing short-circuits everything
  checkSpeedCritical,
  checkSpeedSuspicious,
  checkRoundAmountLarge,
  checkHighValueFirstTransaction,
  checkHighValueAbsolute,
  checkRepeatExcessive,
  checkRepeatElevated,
  checkLowAmountSuspicious,
  checkPriceCategoryMismatch,
];
