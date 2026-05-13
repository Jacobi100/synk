import { Bounty, CreateBountyInput, BountyFilters, BountyApplication, ProviderProfile, SquadVirtualAccount, PaymentRecord } from '@/lib/types/bounty';
import { supabase } from './supabase/client';

// Helper: Get profile UUID from Clerk ID
export async function getProfileUUID(clerkId: string): Promise<string | null> {
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

// ==================== APPLICATION FUNCTIONS ====================

export async function getProviderProfile(userId: string): Promise<ProviderProfile | null> {
  const profileUUID = await getProfileUUID(userId);
  if (!profileUUID) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileUUID)
    .single();

  if (error) {
    console.error('Error fetching provider profile:', error);
    return null;
  }

  return data as ProviderProfile;
}

export async function checkApplicationExists(
  bountyId: string,
  providerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select('id')
    .eq('bounty_id', bountyId)
    .eq('provider_id', providerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error checking application:', error);
  }

  return !!data;
}

export async function createApplication(
  bountyId: string,
  providerId: string
): Promise<BountyApplication | null> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .insert({
      bounty_id: bountyId,
      provider_id: providerId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating application:', error);
    return null;
  }

  return data as BountyApplication;
}

export async function getApplicationsByBountyId(bountyId: string): Promise<BountyApplication[]> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select('*')
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return (data || []) as BountyApplication[];
}

export async function getApplicationsForProvider(providerId: string): Promise<BountyApplication[]> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching provider applications:', error);
    return [];
  }

  return (data || []) as BountyApplication[];
}

export async function getApplicationById(applicationId: string): Promise<BountyApplication | null> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error) {
    console.error('Error fetching application:', error);
    return null;
  }

  return data as BountyApplication;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected',
  rejectionReason?: string
): Promise<BountyApplication | null> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { data, error } = await supabase
    .from('bounty_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating application:', error);
    return null;
  }

  return data as BountyApplication;
}

export async function rejectOtherApplications(
  bountyId: string,
  acceptedApplicationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('bounty_applications')
    .update({
      status: 'rejected',
      rejection_reason: 'Another application was accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('bounty_id', bountyId)
    .neq('id', acceptedApplicationId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error rejecting other applications:', error);
    return false;
  }

  return true;
}

export async function createSquadVirtualAccount(
  bountyId: string,
  providerId: string,
  squadAccountId: string,
  amount: number
): Promise<SquadVirtualAccount | null> {
  const { data, error } = await supabase
    .from('squad_virtual_accounts')
    .insert({
      bounty_id: bountyId,
      provider_id: providerId,
      squad_account_id: squadAccountId,
      amount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating squad virtual account:', error);
    return null;
  }

  return data as SquadVirtualAccount;
}

export async function getSquadAccountByBountyId(
  bountyId: string
): Promise<SquadVirtualAccount | null> {
  const { data, error } = await supabase
    .from('squad_virtual_accounts')
    .select('*')
    .eq('bounty_id', bountyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching squad account:', error);
  }

  return data as SquadVirtualAccount | null;
}

export async function updateSquadAccountStatus(
  squadAccountId: string,
  status: 'paid' | 'released' | 'disputed',
  paymentId?: string
): Promise<SquadVirtualAccount | null> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (paymentId) {
    updateData.payment_id = paymentId;
  }

  const { data, error } = await supabase
    .from('squad_virtual_accounts')
    .update(updateData)
    .eq('id', squadAccountId)
    .select()
    .single();

  if (error) {
    console.error('Error updating squad account status:', error);
    return null;
  }

  return data as SquadVirtualAccount;
}

export async function createPaymentRecord(
  bountyId: string,
  squadAccountId: string,
  squadReference: string,
  amount: number
): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from('payment_records')
    .insert({
      bounty_id: bountyId,
      squad_account_id: squadAccountId,
      squad_reference: squadReference,
      amount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment record:', error);
    return null;
  }

  return data as PaymentRecord;
}

export async function updatePaymentStatus(
  squadReference: string,
  status: 'confirmed' | 'failed'
): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from('payment_records')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('squad_reference', squadReference)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    return null;
  }

  return data as PaymentRecord;
}

export async function getPaymentByReference(
  squadReference: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('squad_reference', squadReference)
    .single();

  if (error) {
    console.error('Error fetching payment record:', error);
    return null;
  }

  return data as PaymentRecord;
}
