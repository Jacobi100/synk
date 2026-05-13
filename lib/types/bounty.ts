// Database types for bounties
export type Bounty = {
  id: string;
  poster_id: string;

  title: string;
  description: string | null;
  category: string;

  // location
  latitude: number;
  longitude: number;
  location_name: string | null;
  radius_km: number;

  // pricing
  price_min: number | null;
  price_max: number | null;
  currency: string;
  price_negotiable: boolean;

  // media
  images: string[] | null;

  // logistics
  deadline: string | null;
  urgency: 'asap' | 'scheduled' | 'flexible';
  slots_available: number;

  // state
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';

  // squad/payment
  squad_account_id?: string | null;
  selected_provider_id?: string | null;

  created_at: string;
  updated_at: string;
};

export type CreateBountyInput = Omit<Bounty, 'id' | 'poster_id' | 'created_at' | 'updated_at'>;

export type BountyFilters = {
  category?: string;
  status?: Bounty['status'];
  urgency?: Bounty['urgency'];
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

// Bounty Application Types
export type BountyApplication = {
  id: string;
  bounty_id: string;
  provider_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateBountyApplicationInput = Omit<BountyApplication, 'id' | 'status' | 'created_at' | 'updated_at'>;

// Provider Profile Type
export type ProviderProfile = {
  id: string;
  clerk_id: string;
  phone_number: string | null;
  address: string | null;
  rating: number | null;
  completed_bounties: number;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

// Squad Virtual Account Type
export type SquadVirtualAccount = {
  id: string;
  bounty_id: string;
  squad_account_id: string;
  provider_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'released' | 'disputed';
  payment_id?: string | null;
  created_at: string;
  updated_at: string;
};

// Payment Record Type
export type PaymentRecord = {
  id: string;
  bounty_id: string;
  squad_account_id: string;
  squad_reference: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  updated_at: string;
};

// Notification Type
export type Notification = {
  id: string;
  user_id: string;
  type: 'application_received' | 'application_accepted' | 'application_rejected' | 'payment_confirmed' | 'service_started' | 'bounty_completed' | 'payment_released' | 'rating_available';
  title: string;
  message: string;
  bounty_id?: string | null;
  application_id?: string | null;
  related_user_id?: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
};
