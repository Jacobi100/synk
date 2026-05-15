import { TrustProfile } from "../trust/types";

export interface OfferContext {
  bountyId:        string;
  bountyCategory:  string;
  providerId:      string;
  trustProfile:    TrustProfile;
  activeJobsCount: number;
  proposedPrice:   number;
  bountyPriceMin:  number;
  bountyPriceMax:  number;
}

export interface OfferRiskAssessment {
  riskScore:      number; // 0-100 (high = risky)
  riskLevel:      "low" | "medium" | "high";
  factors:        string[];
  recommendation: "accept" | "caution" | "reject";
  aiConfidence:   number; // 0-100 (high = safe)
}

/**
 * Calculates the risk of accepting a specific offer using the AI Intelligence Layer.
 */
export function assessOfferRisk(ctx: OfferContext): OfferRiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // 1. Trust Score Factor (Base Risk)
  const trustRisk = Math.round((100 - ctx.trustProfile.trustScore) * 0.4);
  if (trustRisk > 20) factors.push("Limited platform history");
  score += trustRisk;

  // 2. Workload Factor
  if (ctx.activeJobsCount >= 6) {
    score += 30;
    factors.push("High concurrent workload");
  } else if (ctx.activeJobsCount >= 3) {
    score += 15;
    factors.push("Moderate current workload");
  }

  // 3. New Provider Factor
  if (ctx.trustProfile.badge === "new") {
    score += 10;
    factors.push("Unverified new provider");
  } else if (ctx.trustProfile.badge === "community_trusted") {
    score -= 10; // Negative risk (bonus)
  }

  // 4. Price Intelligence Factor
  // If proposed price is > 30% higher than max, it's a risk signal
  if (ctx.proposedPrice > ctx.bountyPriceMax * 1.3) {
    score += 20;
    factors.push("Significant price deviation (over-bidding)");
  }
  // If proposed price is < 50% of min, it's a quality/fraud risk signal
  else if (ctx.proposedPrice < ctx.bountyPriceMin * 0.5) {
    score += 25;
    factors.push("Unusually low bid (possible quality risk)");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const aiConfidence = 100 - finalScore;

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
    factors: factors.length > 0 ? factors : ["Safe history & price"],
    recommendation,
    aiConfidence,
  };
}
