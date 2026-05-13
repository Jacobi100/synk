import { NextRequest, NextResponse } from 'next/server';
import {
  getPaymentByReference,
  updatePaymentStatus,
  getSquadAccountByBountyId,
  updateSquadAccountStatus,
  getBountyById,
  updateBounty,
  getProfileUUID,
} from '@/lib/bounty';
import { supabase } from '@/lib/supabase/server';

// Squad webhook signature verification (implement based on Squad's documentation)
async function verifySquadSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  // TODO: Implement Squad signature verification
  // This would typically involve:
  // 1. Getting the signature from request headers
  // 2. Verifying it against the SQUAD_SECRET_KEY
  // For now, we'll trust the webhook
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const bodyString = JSON.stringify(body);
    const isValid = await verifySquadSignature(request, bodyString);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract Squad payment reference from webhook
    const { reference, status } = body;

    if (!reference || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only handle successful payments
    if (status !== 'success' && status !== 'completed') {
      return NextResponse.json(
        { message: 'Payment not successful, skipping' },
        { status: 200 }
      );
    }

    // Get payment record
    const payment = await getPaymentByReference(reference);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment status to confirmed
    const updatedPayment = await updatePaymentStatus(reference, 'confirmed');

    if (!updatedPayment) {
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Update Squad account status to paid
    const updatedSquadAccount = await updateSquadAccountStatus(
      payment.squad_account_id,
      'paid',
      reference
    );

    if (!updatedSquadAccount) {
      return NextResponse.json(
        { error: 'Failed to update Squad account status' },
        { status: 500 }
      );
    }

    // Get bounty and update status
    const bounty = await getBountyById(payment.bounty_id);

    if (bounty) {
      // Get poster's clerk ID to update bounty
      const { data: posterProfile } = await supabase
        .from('profiles')
        .select('clerk_id')
        .eq('id', bounty.poster_id)
        .single();

      if (posterProfile) {
        await updateBounty(payment.bounty_id, posterProfile.clerk_id, {
          status: 'awaiting_service' as any,
        });
      }

      // TODO: Notify provider:
      // "Payment confirmed! You can now proceed with the service."
      // "Poster's contact: {phone_number}"

      // TODO: Notify poster:
      // "Payment confirmed. Service will begin shortly."
    }

    return NextResponse.json(
      {
        message: 'Payment confirmed successfully',
        payment: updatedPayment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Squad webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
