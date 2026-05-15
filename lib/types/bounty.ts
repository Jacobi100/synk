// Database types aligned with Supabase schema

export type Bounty = {
  id: string;
  poster_id: string;

  title: string;
  description: string | null;
  category: string;

  latitude: number;
  longitude: number;
  location_name: string | null;
  radius_km: number;

  price_min: number | null;
  price_max: number | null;
  currency: string;
  price_negotiable: boolean;

  images: string[] | null;

  deadline: string | null;
  urgency: "asap" | "scheduled" | "flexible";
  slots_available: number;

  status: "open" | "in_progress" | "paid" | "completed" | "cancelled";

  created_at: string;
  updated_at: string;
};

export type CreateBountyInput = Omit<
  Bounty,
  "id" | "poster_id" | "created_at" | "updated_at" | "status"
>;

export type BountyFilters = {
  category?: string;
  status?: Bounty["status"];
  urgency?: Bounty["urgency"];
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

export type BountyApplication = {
  id: string;
  bounty_id: string;
  provider_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  proposed_price?: number | null;
  created_at: string;
};

export type CreateBountyApplicationInput = Pick<BountyApplication, "bounty_id" | "provider_id" | "proposed_price">;

export type ProviderProfile = {
  id: string;
  clerk_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  onboarding_complete: boolean | null;
  account_number?: string | null;
  bank_code?: string | null;
  created_at: string;
};

export type TransactionRow = {
  id: string;
  bounty_id: string;
  poster_id: string;
  provider_id: string;
  squad_virtual_account_ref: string | null;
  squad_transaction_ref: string | null;
  squad_transfer_ref: string | null;
  amount: number;
  platform_fee: number | null;
  provider_payout: number | null;
  status: "awaiting_payment" | "paid" | "released" | "disputed" | "refunded";
  paid_at: string | null;
  released_at: string | null;
  created_at: string;
};

export type NotificationType =
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "payment_confirmed"
  | "service_complete"
  | "payout_sent";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  related_bounty_id: string | null;
  read: boolean;
  created_at: string;
};

export type BountyFeedItem = Bounty & {
  poster_name: string | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
};
