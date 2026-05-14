import { TrustProfile } from "../trust/types";

export interface OfferContext {
  bountyId:        string;
  bountyCategory:  string;
  providerId:      string;
  trustProfile:    TrustProfile;
  activeJobsCount: number;
}

export interface OfferRiskAssessment {
  riskScore:      number; // 0-100 (high = risky)
  riskLevel:      "low" | "medium" | "high";
  factors:        string[];
  recommendation: "accept" | "caution" | "reject";
}

/**
 * Calculates the risk of accepting a specific offer.
 * Runs deterministically based on provider stats and bounty context.
 */
export function assessOfferRisk(ctx: OfferContext): OfferRiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // 1. Trust Score Factor (Base Risk)
  // 100 trust = 0 risk points, 0 trust = 40 risk points
  const trustRisk = Math.round((100 - ctx.trustProfile.trustScore) * 0.4);
  if (trustRisk > 20) factors.push("Limited platform history or low trust score");
  score += trustRisk;

  // 2. Workload Factor
  // Each active job adds risk. 0-2 = ok, 3-5 = medium, 6+ = high
  if (ctx.activeJobsCount >= 6) {
    score += 30;
    factors.push("Very high current workload (risk of delay)");
  } else if (ctx.activeJobsCount >= 3) {
    score += 15;
    factors.push("Moderate current workload");
  }

  // 3. New Provider Factor
  if (ctx.trustProfile.badge === "new") {
    score += 10;
    factors.push("New helper with no completed jobs yet");
  }

  // Cap score at 100
  const finalScore = Math.min(100, score);

  let riskLevel: "low" | "medium" | "high" = "low";
  let recommendation: "accept" | "caution" | "reject" = "accept";

  if (finalScore >= 70) {
    riskLevel = "high";
    recommendation = "reject";
  } else if (finalScore >= 35) {
    riskLevel = "medium";
    recommendation = "caution";
  }

  return {
    riskScore: finalScore,
    riskLevel,
    factors: factors.length > 0 ? factors : ["No significant risk factors"],
    recommendation,
  };
}
