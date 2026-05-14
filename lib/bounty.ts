import {
  Bounty,
  CreateBountyInput,
  BountyFilters,
  BountyApplication,
  ProviderProfile,
  TransactionRow,
} from "@/lib/types/bounty";
import { supabaseAdmin } from "./supabase/server";
import { haversineDistanceMeters } from "./geo";

const db = supabaseAdmin;

/** Supabase projects may use `applications` (current) or legacy `bounty_applications`. */
let resolvedApplicationsTable: "applications" | "bounty_applications" | null = null;

async function applicationsTable(): Promise<"applications" | "bounty_applications"> {
  if (resolvedApplicationsTable) return resolvedApplicationsTable;
  const primary = await db.from("applications").select("id").limit(1);
  if (!primary.error) {
    resolvedApplicationsTable = "applications";
    return resolvedApplicationsTable;
  }
  const legacy = await db.from("bounty_applications").select("id").limit(1);
  if (!legacy.error) {
    resolvedApplicationsTable = "bounty_applications";
    return resolvedApplicationsTable;
  }
  console.warn(
    "applications table probe failed; using applications. Primary:",
    primary.error,
    "Legacy:",
    legacy.error,
  );
  resolvedApplicationsTable = "applications";
  return resolvedApplicationsTable;
}

function maskProfilePhone<T extends ProviderProfile | null>(profile: T, reveal: boolean): T {
  if (!profile || reveal) return profile;
  return { ...profile, phone_number: null };
}

export async function getProfileUUID(clerkId: string): Promise<string | null> {
  const { data, error } = await db.from("profiles").select("id").eq("clerk_id", clerkId).single();
  if (error) {
    console.error("Error getting profile:", error);
    return null;
  }
  return data?.id ?? null;
}

export async function createBounty(userId: string, data: CreateBountyInput): Promise<Bounty | null> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) {
    console.error("Profile not found for user:", userId);
    return null;
  }

  const { data: bounty, error } = await db
    .from("bounties")
    .insert({
      poster_id: profileUUID,
      ...data,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bounty:", error);
    return null;
  }

  return bounty as Bounty;
}

export async function getBounties(filters?: BountyFilters): Promise<Bounty[]> {
  let query = db.from("bounties").select("*");

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.urgency) query = query.eq("urgency", filters.urgency);
  if (filters?.min_price !== undefined) query = query.gte("price_max", filters.min_price);
  if (filters?.max_price !== undefined) query = query.lte("price_min", filters.max_price);
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`,
    );
  }

  query = query.order("created_at", { ascending: false });
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching bounties:", error);
    return [];
  }
  return (data || []) as Bounty[];
}

/** All open bounties, no location filtering. */
export async function fetchAllOpenBounties(): Promise<Bounty[]> {
  const { data, error } = await db
    .from("bounties")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error || !data) {
    console.error("Error fetching all open bounties:", error);
    return [];
  }

  return data as Bounty[];
}

/** Nearby open bounties: RPC when migration applied, else haversine fallback. */
export async function fetchNearbyOpenBounties(userLat: number, userLng: number): Promise<Bounty[]> {
  const { data, error } = await db.rpc("nearby_open_bounties", {
    p_lat: userLat,
    p_lng: userLng,
  });

  if (!error && data && Array.isArray(data)) {
    return data as Bounty[];
  }

  const { data: openRows, error: e2 } = await db
    .from("bounties")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(250);

  if (e2 || !openRows) {
    console.error("nearby_open_bounties RPC unavailable; fallback query failed:", error, e2);
    return [];
  }

  return (openRows as Bounty[]).filter((b) => {
    const rKm = Number(b.radius_km) || 1;
    const d = haversineDistanceMeters(userLat, userLng, Number(b.latitude), Number(b.longitude));
    return d < rKm * 1000;
  });
}

export async function getBountyById(id: string): Promise<Bounty | null> {
  const { data, error } = await db.from("bounties").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching bounty:", error);
    return null;
  }
  return data as Bounty;
}

export async function updateBounty(
  id: string,
  userId: string,
  data: Partial<CreateBountyInput> & Partial<Pick<Bounty, "status">>,
): Promise<Bounty | null> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) return null;

  const bounty = await getBountyById(id);
  if (!bounty || bounty.poster_id !== profileUUID) return null;

  const { data: updated, error } = await db
    .from("bounties")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating bounty:", error);
    return null;
  }
  return updated as Bounty;
}

export async function deleteBounty(id: string, userId: string): Promise<boolean> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) return false;

  const bounty = await getBountyById(id);
  if (!bounty || bounty.poster_id !== profileUUID) return false;

  const { error } = await db.from("bounties").delete().eq("id", id);
  if (error) {
    console.error("Error deleting bounty:", error);
    return false;
  }
  return true;
}

export async function getBountiesByUserId(userId: string): Promise<Bounty[]> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) return [];

  return getBountiesByPosterProfileId(profileUUID);
}

export async function getBountiesByPosterProfileId(posterProfileId: string): Promise<Bounty[]> {
  const { data, error } = await db
    .from("bounties")
    .select("*")
    .eq("poster_id", posterProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching poster bounties:", error);
    return [];
  }
  return (data || []) as Bounty[];
}

// --- Applications (resolved to `applications` or legacy `bounty_applications`) ---

export async function getProviderProfile(userId: string): Promise<ProviderProfile | null> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) return null;

  const { data, error } = await db.from("profiles").select("*").eq("id", profileUUID).single();
  if (error) {
    console.error("Error fetching provider profile:", error);
    return null;
  }
  return data as ProviderProfile;
}

export async function getProfileById(profileId: string): Promise<ProviderProfile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("id", profileId).single();
  if (error) {
    console.error("Error fetching profile by ID:", error);
    return null;
  }
  return data as ProviderProfile;
}

export async function checkApplicationExists(bountyId: string, providerId: string): Promise<boolean> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .select("id")
    .eq("bounty_id", bountyId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") console.error("Error checking application:", error);
  return !!data;
}

export async function createApplication(
  bountyId: string,
  providerId: string,
): Promise<BountyApplication | null> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .insert({
      bounty_id: bountyId,
      provider_id: providerId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating application:", error);
    return null;
  }
  return data as BountyApplication;
}

export async function getApplicationsByBountyId(bountyId: string): Promise<BountyApplication[]> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .select("*")
    .eq("bounty_id", bountyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
  return (data || []) as BountyApplication[];
}

export async function getApplicationsByBountyIdWithProvider(
  bountyId: string,
): Promise<(BountyApplication & { provider_profile?: ProviderProfile | null })[]> {
  const applications = await getApplicationsByBountyId(bountyId);
  return Promise.all(
    applications.map(async (application) => {
      const raw = await getProfileById(application.provider_id);
      return {
        ...application,
        provider_profile: maskProfilePhone(raw, application.status === "accepted"),
      };
    }),
  );
}

export async function getApplicationsForProvider(
  providerProfileId: string,
): Promise<(BountyApplication & { bounty?: Bounty | null; poster_phone?: string | null })[]> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .select("*")
    .eq("provider_id", providerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching provider applications:", error);
    return [];
  }

  const applications = (data || []) as BountyApplication[];
  return Promise.all(
    applications.map(async (application) => {
      const bounty = await getBountyById(application.bounty_id);
      let poster_phone: string | null | undefined;
      if (application.status === "accepted" && bounty) {
        const poster = await getProfileById(bounty.poster_id);
        poster_phone = poster?.phone_number ?? null;
      }
      return {
        ...application,
        bounty,
        poster_phone: poster_phone ?? null,
      };
    }),
  );
}

export async function getApplicationsForPoster(
  posterProfileId: string,
): Promise<(BountyApplication & { bounty?: Bounty; provider_profile?: ProviderProfile | null })[]> {
  const bounties = await getBountiesByPosterProfileId(posterProfileId);
  const bountyIds = bounties.map((b) => b.id);
  if (bountyIds.length === 0) return [];

  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .select("*")
    .in("bounty_id", bountyIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching poster applications:", error);
    return [];
  }

  const applications = (data || []) as BountyApplication[];
  return Promise.all(
    applications.map(async (application) => {
      const raw = await getProfileById(application.provider_id);
      return {
        ...application,
        bounty: bounties.find((b) => b.id === application.bounty_id),
        provider_profile: maskProfilePhone(raw, application.status === "accepted"),
      };
    }),
  );
}

export async function getApplicationById(applicationId: string): Promise<BountyApplication | null> {
  const t = await applicationsTable();
  const { data, error } = await db.from(t).select("*").eq("id", applicationId).single();
  if (error) {
    console.error("Error fetching application:", error);
    return null;
  }
  return data as BountyApplication;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: BountyApplication["status"],
): Promise<BountyApplication | null> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .update({ status })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating application:", error);
    return null;
  }
  return data as BountyApplication;
}

export async function rejectOtherApplications(bountyId: string, acceptedApplicationId: string): Promise<boolean> {
  const t = await applicationsTable();
  const { error } = await db
    .from(t)
    .update({ status: "rejected" })
    .eq("bounty_id", bountyId)
    .neq("id", acceptedApplicationId)
    .eq("status", "pending");

  if (error) {
    console.error("Error rejecting other applications:", error);
    return false;
  }
  return true;
}

export async function getAcceptedApplicationForBounty(bountyId: string): Promise<BountyApplication | null> {
  const t = await applicationsTable();
  const { data, error } = await db
    .from(t)
    .select("*")
    .eq("bounty_id", bountyId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) {
    console.error("Error fetching accepted application:", error);
    return null;
  }
  return data as BountyApplication | null;
}

// --- Transactions ---

export async function getTransactionByBountyId(bountyId: string): Promise<TransactionRow | null> {
  const { data, error } = await db
    .from("transactions")
    .select("*")
    .eq("bounty_id", bountyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") console.error("getTransactionByBountyId:", error);
  return data as TransactionRow | null;
}

export async function getTransactionByVirtualAccountRef(ref: string): Promise<TransactionRow | null> {
  const { data, error } = await db
    .from("transactions")
    .select("*")
    .eq("squad_virtual_account_ref", ref)
    .maybeSingle();

  if (error && error.code !== "PGRST116") console.error("getTransactionByVirtualAccountRef:", error);
  return data as TransactionRow | null;
}

export async function createTransactionRow(input: {
  bounty_id: string;
  poster_id: string;
  provider_id: string;
  squad_virtual_account_ref: string | null;
  amount: number;
  platform_fee: number;
  provider_payout: number;
}): Promise<TransactionRow | null> {
  const { data, error } = await db
    .from("transactions")
    .insert({
      bounty_id: input.bounty_id,
      poster_id: input.poster_id,
      provider_id: input.provider_id,
      squad_virtual_account_ref: input.squad_virtual_account_ref,
      amount: input.amount,
      platform_fee: input.platform_fee,
      provider_payout: input.provider_payout,
      status: "awaiting_payment",
    })
    .select()
    .single();

  if (error) {
    console.error("createTransactionRow:", error);
    return null;
  }
  return data as TransactionRow;
}

export async function updateTransactionPaid(
  transactionId: string,
  squad_transaction_ref?: string | null,
): Promise<TransactionRow | null> {
  const { data, error } = await db
    .from("transactions")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      squad_transaction_ref: squad_transaction_ref ?? null,
    })
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    console.error("updateTransactionPaid:", error);
    return null;
  }
  return data as TransactionRow;
}

export async function updateTransactionReleased(
  transactionId: string,
  squad_transfer_ref: string | null,
): Promise<TransactionRow | null> {
  const { data, error } = await db
    .from("transactions")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
      squad_transfer_ref,
    })
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    console.error("updateTransactionReleased:", error);
    return null;
  }
  return data as TransactionRow;
}

// --- Reviews ---

export async function createReview(input: {
  bounty_id: string;
  poster_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
}): Promise<boolean> {
  const { error } = await db.from("reviews").insert(input);
  if (error) {
    console.error("createReview:", error);
    return false;
  }
  return true;
}
