import { Bounty, CreateBountyInput, BountyFilters } from '@/lib/types/bounty';
import { supabase } from './supabase/client';

// Helper: Get profile UUID from Clerk ID
async function getProfileUUID(clerkId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return data?.id || null;
}

export async function createBounty(
  userId: string,
  data: CreateBountyInput
): Promise<Bounty | null> {
  // Get the UUID from profiles table using clerk_id
  const profileUUID = await getProfileUUID(userId);

  if (!profileUUID) {
    console.error('Profile not found for user:', userId);
    return null;
  }

  const { data: bounty, error } = await supabase
    .from('bounties')
    .insert({
      poster_id: profileUUID,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bounty:', error);
    return null;
  }

  return bounty as Bounty;
}

export async function getBounties(filters?: BountyFilters): Promise<Bounty[]> {
  let query = supabase.from('bounties').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency);
  }

  if (filters?.min_price !== undefined) {
    query = query.gte('price_max', filters.min_price);
  }

  if (filters?.max_price !== undefined) {
    query = query.lte('price_min', filters.max_price);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`
    );
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bounties:', error);
    return [];
  }

  return (data || []) as Bounty[];
}

export async function getBountyById(id: string): Promise<Bounty | null> {
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bounty:', error);
    return null;
  }

  return data as Bounty;
}

export async function updateBounty(
  id: string,
  userId: string,
  data: Partial<CreateBountyInput>
): Promise<Bounty | null> {
  // Get the UUID from profiles table using clerk_id
  const profileUUID = await getProfileUUID(userId);

  if (!profileUUID) {
    console.error('Profile not found for user:', userId);
    return null;
  }

  // Verify ownership
  const bounty = await getBountyById(id);
  if (!bounty || bounty.poster_id !== profileUUID) {
    console.error('Unauthorized to update bounty');
    return null;
  }

  const { data: updated, error } = await supabase
    .from('bounties')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating bounty:', error);
    return null;
  }

  return updated as Bounty;
}

export async function deleteBounty(id: string, userId: string): Promise<boolean> {
  // Get the UUID from profiles table using clerk_id
  const profileUUID = await getProfileUUID(userId);

  if (!profileUUID) {
    console.error('Profile not found for user:', userId);
    return false;
  }

  // Verify ownership
  const bounty = await getBountyById(id);
  if (!bounty || bounty.poster_id !== profileUUID) {
    console.error('Unauthorized to delete bounty');
    return false;
  }

  const { error } = await supabase.from('bounties').delete().eq('id', id);

  if (error) {
    console.error('Error deleting bounty:', error);
    return false;
  }

  return true;
}

export async function getBountiesByUserId(userId: string): Promise<Bounty[]> {
  // Get the UUID from profiles table using clerk_id
  const profileUUID = await getProfileUUID(userId);

  if (!profileUUID) {
    console.error('Profile not found for user:', userId);
    return [];
  }

  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('poster_id', profileUUID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bounties:', error);
    return [];
  }

  return (data || []) as Bounty[];
}
