"use client";

import { useEffect, useState, use } from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
  Star,
  Crown,
  Sparkles,
  Briefcase,
  Users,
  BarChart3,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TrustBadge, TrustSignal } from "@/lib/trust/types";
import { COPY } from "@/lib/copy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderProfile {
  id:                string;
  username:          string | null;
  fullName:          string | null;
  memberSince:       string;
  trustBadge:        TrustBadge;
  trustScore:        number;
  trustSignals:      TrustSignal[];
  trustComputedAt:   string | null;
  completedJobs:     number;
  totalUniqueBuyers: number;
}

interface BadgeConfig {
  label:       string;
  icon:        React.ElementType;
  chipStyle:   React.CSSProperties;
  cardStyle:   React.CSSProperties;
  iconColor:   string;
  description: string;
}

// ---------------------------------------------------------------------------
// Badge configuration
// ---------------------------------------------------------------------------

const BADGE_CONFIG: Record<TrustBadge, BadgeConfig> = {
  new: {
    label:       COPY.PROVIDER_PROFILE.BADGE_NEW_LABEL,
    icon:        Sparkles,
    chipStyle:   { backgroundColor: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" },
    cardStyle:   { background: "#f9fafb", borderColor: "#e5e7eb" },
    iconColor:   "#9ca3af",
    description: COPY.PROVIDER_PROFILE.BADGE_NEW_DESC,
  },
  active: {
    label:       COPY.PROVIDER_PROFILE.BADGE_ACTIVE_LABEL,
    icon:        Star,
    chipStyle:   { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    cardStyle:   { background: "#eff6ff", borderColor: "#bfdbfe" },
    iconColor:   "#3b82f6",
    description: COPY.PROVIDER_PROFILE.BADGE_ACTIVE_DESC,
  },
  trusted: {
    label:       COPY.PROVIDER_PROFILE.BADGE_TRUSTED_LABEL,
    icon:        Shield,
    chipStyle:   { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
    cardStyle:   { background: "#f0fdf4", borderColor: "#bbf7d0" },
    iconColor:   "#22c55e",
    description: COPY.PROVIDER_PROFILE.BADGE_TRUSTED_DESC,
  },
  community_trusted: {
    label:       COPY.PROVIDER_PROFILE.BADGE_TOP_LABEL,
    icon:        Crown,
    chipStyle:   { backgroundColor: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe" },
    cardStyle:   { background: "#f5f3ff", borderColor: "#ddd6fe" },
    iconColor:   "#7c3aed",
    description: COPY.PROVIDER_PROFILE.BADGE_TOP_DESC,
  },
};

// ---------------------------------------------------------------------------
// Trust score bar
// ---------------------------------------------------------------------------

function TrustScoreBar({ score, badge }: { score: number; badge: TrustBadge }) {
  const config = BADGE_CONFIG[badge];
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {COPY.PROVIDER_PROFILE.REPUTATION_SCORE}
        </span>
        <span className="text-sm font-bold" style={{ color: config.iconColor }}>
          {score}/100
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: config.iconColor }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal row
// ---------------------------------------------------------------------------

function SignalRow({ signal }: { signal: TrustSignal }) {
  const maxPoints = 40;
  const pct       = Math.min((signal.points / maxPoints) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">
          {signal.label}
        </p>
        <div className="mt-1 h-1.5 w-full rounded-full overflow-hidden bg-border">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
          />
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
        +{signal.points}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon:  React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-secondary p-4 flex flex-col gap-2">
      <Icon className="h-4 w-4 text-mute" />
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-mute">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }                        = use(params);
  const [profile, setProfile]         = useState<ProviderProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${id}`);
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? "Failed to load profile.");
        }
        setProfile(await res.json() as ProviderProfile);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{COPY.LOADING}</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (fetchError || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
          <div className="rounded-[24px] border border-[var(--negative)]/30 bg-[var(--negative)]/10 p-6 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[var(--negative)]" />
            <div>
              <h3 className="font-semibold text-[var(--negative)]">{COPY.PROVIDER_PROFILE.NOT_FOUND_TITLE}</h3>
              <p className="text-sm mt-0.5 text-[var(--negative)]/80">
                {fetchError ?? COPY.PROVIDER_PROFILE.NOT_FOUND_SUB}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badgeConfig = BADGE_CONFIG[profile.trustBadge];
  const BadgeIcon   = badgeConfig.icon;
  const displayName = profile.fullName ?? profile.username ?? "Anonymous Provider";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {COPY.PROVIDER_PROFILE.BACK}
        </Link>

        {/* Profile header */}
        <div className="rounded-[24px] border border-border bg-background p-6 mb-5">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 text-xl font-bold text-primary-foreground bg-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>

            {/* Name + badge */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
                {displayName}
              </h1>
              {profile.username && (
                <p className="text-sm text-mute">
                  @{profile.username}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={badgeConfig.chipStyle}
                >
                  <BadgeIcon className="h-3.5 w-3.5" />
                  {badgeConfig.label}
                </span>
                <span className="text-xs text-mute">
                  {COPY.PROVIDER_PROFILE.MEMBER_SINCE(formatDistanceToNow(new Date(profile.memberSince), { addSuffix: true }))}
                </span>
              </div>
            </div>
          </div>

          {/* Badge description */}
          <div
            className="mt-5 rounded-lg border p-4"
            style={badgeConfig.cardStyle}
          >
            <div className="flex items-start gap-3">
              <BadgeIcon
                className="h-4 w-4 shrink-0 mt-0.5"
                style={{ color: badgeConfig.iconColor }}
              />
              <p className="text-sm text-foreground">
                {badgeConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard icon={Briefcase} label={COPY.PROVIDER_PROFILE.JOBS_COMPLETED}   value={profile.completedJobs} />
          <StatCard icon={Users}     label={COPY.PROVIDER_PROFILE.UNIQUE_CUSTOMERS} value={profile.totalUniqueBuyers} />
          <StatCard icon={BarChart3} label={COPY.PROVIDER_PROFILE.REPUTATION_SCORE} value={`${profile.trustScore}/100`} />
        </div>

        {/* Trust score breakdown */}
        {profile.trustSignals.length > 0 && (
          <div className="rounded-[24px] border border-border bg-background p-6 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 text-mute">
              {COPY.PROVIDER_PROFILE.REPUTATION_TITLE}
            </h2>

            <TrustScoreBar score={profile.trustScore} badge={profile.trustBadge} />

            <div className="mt-5 space-y-3">
              {profile.trustSignals.map((signal) => (
                <SignalRow key={signal.signalId} signal={signal} />
              ))}
            </div>

            {profile.trustComputedAt && (
              <p className="mt-4 text-xs text-mute">
                <Clock className="inline h-3 w-3 mr-1" />
                {COPY.PROVIDER_PROFILE.LAST_UPDATED} {formatDistanceToNow(
                  new Date(profile.trustComputedAt),
                  { addSuffix: true }
                )}
              </p>
            )}
          </div>
        )}

        {/* New provider — no signals yet */}
        {profile.trustSignals.length === 0 && (
          <div className="rounded-[24px] border border-border bg-secondary p-6 mb-5 flex flex-col items-center gap-3 text-center">
            <Sparkles className="h-8 w-8 text-mute" />
            <p className="text-sm font-medium text-foreground">
              {COPY.PROVIDER_PROFILE.NO_HISTORY_TITLE}
            </p>
            <p className="text-xs text-mute">
              {COPY.PROVIDER_PROFILE.NO_HISTORY_SUB}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}