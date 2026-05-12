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
