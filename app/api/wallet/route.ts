import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getProfileUUID } from '@/lib/bounty';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileUUID(userId);
    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch all transactions involving this user
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        bounty:bounties(title)
      `)
      .or(`poster_id.eq.${profileId},provider_id.eq.${profileId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Wallet fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
    }

    // Calculate balances
    let totalEarned = 0;
    let totalSpent = 0;
    let pending = 0;

    transactions?.forEach((tx) => {
      const isProvider = tx.provider_id === profileId;
      const isPoster = tx.poster_id === profileId;

      if (isProvider) {
        if (tx.status === 'released') {
          totalEarned += Number(tx.provider_payout || 0);
        } else if (tx.status === 'paid') {
          pending += Number(tx.provider_payout || 0);
        }
      }

      if (isPoster) {
        if (tx.status === 'paid' || tx.status === 'released') {
          totalSpent += Number(tx.amount || 0);
        }
      }
    });

    return NextResponse.json({
      totalEarned,
      totalSpent,
      pending,
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
