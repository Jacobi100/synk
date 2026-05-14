// ---------------------------------------------------------------------------
// Trust System — Shared Type Contracts
//
// All types, interfaces, and constants for the trust badge system.
// No logic. No imports. Pure contract.
//
// The trust badge is pre-computed after every transaction completion and
// cached on the provider's profile. Buyers read the cached result — no
// computation happens at view time.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Badge tiers
//
// Four tiers communicating positive trust signals only.
// Absence of a high tier means the provider is new — not suspicious.
// No tier blocks a provider from offering services.
// ---------------------------------------------------------------------------

export const TRUST_BADGES = [
  "new",
  "active",
  "trusted",
  "community_trusted",
] as const;

export type TrustBadge = (typeof TRUST_BADGES)[number];

// ---------------------------------------------------------------------------
// Badge thresholds
//
// Deterministic thresholds that drive badge assignment.
// Job count is the primary gate. Quality metrics are the secondary gate.
// Both must pass for a tier to be assigned.
// ---------------------------------------------------------------------------

export const BADGE_THRESHOLDS = {
  active: {
    minCompletedJobs:   5,
    minCompletionRate:  0.70,
  },
  trusted: {
    minCompletedJobs:   20,
    minCompletionRate:  0.80,
    minRepeatBuyers:    2,
  },
  community_trusted: {
    minCompletedJobs:   50,
    minCompletionRate:  0.85,
    minRepeatBuyerRatio: 0.30,
  },
} as const;

// ---------------------------------------------------------------------------
// Trust score weights
//
// The trust score (0–100) is a composite of four weighted signals.
// Used alongside the badge for finer-grained ranking within a tier.
// ---------------------------------------------------------------------------

export const TRUST_SCORE_WEIGHTS = {
  completionRate:    30,   // 0–30 points
  repeatBuyerRatio:  20,   // 0–20 points
  averageRating:     30,   // 0–30 points (new)
  noDisputeBonus:    10,   // 0–10 points
  experienceBonus:   10,   // 0–10 points
} as const;

// ---------------------------------------------------------------------------
// TrustSignal
//
// A single labelled signal that contributed to the trust score.
// Stored alongside the cached badge for auditability and future
// model training as transaction history grows.
// ---------------------------------------------------------------------------

export interface TrustSignal {
  /** Stable machine-readable identifier. Never rename once in production. */
  signalId:    string;

  /** Human-readable description of what this signal measured. */
  label:       string;

  /** Points this signal contributed to the total trust score. */
  points:      number;

  /** Raw value that produced this signal — for analytics and debugging. */
  rawValue:    number | string;
}

// ---------------------------------------------------------------------------
// Provider stats — input shape for the calculator
//
// Normalised transaction history summary passed to calculateTrustProfile().
// The route handler is responsible for assembling this from the database
// before calling the calculator.
// ---------------------------------------------------------------------------

export interface ProviderStats {
  providerId:                 string;
  completedJobs:              number;
  completionRate:             number;   // 0–1
  totalUniqueBuyers:          number;
  repeatBuyerCount:           number;   // unique buyers who hired more than once
  repeatBuyerRatio:           number;   // repeatBuyerCount / totalUniqueBuyers
  disputeCount:               number;
  fraudFlags:                 number;
  averageResponseTimeMinutes: number;
  accountAgeDays:             number;
  averageRating:              number;   // 0–5
  ratingCount:                number;
}

// ---------------------------------------------------------------------------
// TrustProfile — the computed output cached on the provider's record
// ---------------------------------------------------------------------------

export interface TrustProfile {
  providerId:  string;
  badge:       TrustBadge;
  trustScore:  number;        // 0–100
  signals:     TrustSignal[];
  computedAt:  string;        // ISO 8601 timestamp
}