import {
  BADGE_THRESHOLDS,
  TRUST_SCORE_WEIGHTS,
} from "./types";
import type {
  ProviderStats,
  TrustBadge,
  TrustProfile,
  TrustSignal,
} from "./types";

// ---------------------------------------------------------------------------
// Trust Score Computation
//
// Four weighted signals combine into a 0–100 trust score.
// Each signal returns its point contribution and a labelled record
// for auditability and future ML feature extraction.
// ---------------------------------------------------------------------------

function scoreCompletionRate(rate: number): TrustSignal {
  const points = Math.round(rate * TRUST_SCORE_WEIGHTS.completionRate);
  return {
    signalId: "COMPLETION_RATE",
    label:    "Job completion rate",
    points,
    rawValue: rate,
  };
}

function scoreRepeatBuyerRatio(ratio: number): TrustSignal {
  const points = Math.round(ratio * TRUST_SCORE_WEIGHTS.repeatBuyerRatio);
  return {
    signalId: "REPEAT_BUYER_RATIO",
    label:    "Proportion of buyers who returned for repeat bookings",
    points,
    rawValue: ratio,
  };
}

function scoreDisputeRecord(disputeCount: number): TrustSignal {
  // Full bonus at zero disputes. Scales down by 5 points per dispute, floor 0.
  const points = Math.max(
    0,
    TRUST_SCORE_WEIGHTS.noDisputeBonus - disputeCount * 5
  );
  return {
    signalId: "DISPUTE_RECORD",
    label:    "Dispute and complaint history",
    points,
    rawValue: disputeCount,
  };
}

function scoreExperience(completedJobs: number): TrustSignal {
  // Scales linearly from 0 to max at 50 completed jobs, then caps.
  const capped = Math.min(completedJobs, 50);
  const points = Math.round((capped / 50) * TRUST_SCORE_WEIGHTS.experienceBonus);
  return {
    signalId: "EXPERIENCE",
    label:    "Total completed jobs on platform",
    points,
    rawValue: completedJobs,
  };
}

function computeTrustScore(stats: ProviderStats): {
  score:   number;
  signals: TrustSignal[];
} {
  const signals: TrustSignal[] = [
    scoreCompletionRate(stats.completionRate),
    scoreRepeatBuyerRatio(stats.repeatBuyerRatio),
    scoreDisputeRecord(stats.disputeCount),
    scoreExperience(stats.completedJobs),
  ];

  const raw   = signals.reduce((sum, s) => sum + s.points, 0);
  const score = Math.min(100, Math.max(0, raw));

  return { score, signals };
}

// ---------------------------------------------------------------------------
// Badge Assignment
//
// Job count is the primary gate — a provider must have enough experience
// to qualify for a tier. Quality metrics are the secondary gate — a provider
// with many jobs but poor completion cannot advance to a higher tier.
//
// Fraud flags cap the badge at "active" regardless of job count or quality.
// This is not a ban — the provider can still offer services. It prevents
// the trust badge from becoming misleading when the fraud system has flagged
// the account.
// ---------------------------------------------------------------------------

function assignBadge(stats: ProviderStats): TrustBadge {
  const { completedJobs, completionRate, repeatBuyerCount, repeatBuyerRatio, fraudFlags } = stats;

  // Fraud-flagged providers are capped at active — badge cannot mislead buyers
  const fraudCapped = fraudFlags > 0;

  if (
    !fraudCapped &&
    completedJobs   >= BADGE_THRESHOLDS.community_trusted.minCompletedJobs &&
    completionRate  >= BADGE_THRESHOLDS.community_trusted.minCompletionRate &&
    repeatBuyerRatio >= BADGE_THRESHOLDS.community_trusted.minRepeatBuyerRatio
  ) {
    return "community_trusted";
  }

  if (
    !fraudCapped &&
    completedJobs  >= BADGE_THRESHOLDS.trusted.minCompletedJobs &&
    completionRate >= BADGE_THRESHOLDS.trusted.minCompletionRate &&
    repeatBuyerCount >= BADGE_THRESHOLDS.trusted.minRepeatBuyers
  ) {
    return "trusted";
  }

  if (
    completedJobs  >= BADGE_THRESHOLDS.active.minCompletedJobs &&
    completionRate >= BADGE_THRESHOLDS.active.minCompletionRate
  ) {
    return "active";
  }

  return "new";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Computes a provider's full trust profile from their transaction history.
 *
 * Deterministic — no external calls, no side effects.
 * Called by the reputation route after every transaction completion.
 * The result is cached on the provider's database record.
 *
 * @param stats - Aggregated transaction history for the provider.
 * @returns A fully computed TrustProfile ready for persistence.
 */
export function calculateTrustProfile(stats: ProviderStats): TrustProfile {
  const { score, signals } = computeTrustScore(stats);
  const badge              = assignBadge(stats);

  return {
    providerId: stats.providerId,
    badge,
    trustScore: score,
    signals,
    computedAt: new Date().toISOString(),
  };
}