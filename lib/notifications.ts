import { supabase } from './supabase/server';
import { Notification } from './types/bounty';

export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  bountyId?: string,
  applicationId?: string,
  relatedUserId?: string
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      bounty_id: bountyId || null,
      application_id: applicationId || null,
      related_user_id: relatedUserId || null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data as Notification;
}

export async function getNotificationsForUser(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []) as Notification[];
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }

  return data as Notification;
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

// Helper functions to create specific notifications
export async function notifyApplicationReceived(
  posterId: string,
  applicationId: string,
  bountyId: string,
  providerName: string
): Promise<Notification | null> {
  return createNotification(
    posterId,
    'application_received',
    'New Application',
    `${providerName} has applied to your bounty`,
    bountyId,
    applicationId
  );
}

export async function notifyApplicationAccepted(
  providerId: string,
  applicationId: string,
  bountyId: string
): Promise<Notification | null> {
  return createNotification(
    providerId,
    'application_accepted',
    'Application Accepted!',
    'Your application has been accepted. Please proceed with the service.',
    bountyId,
    applicationId
  );
}

export async function notifyApplicationRejected(
  providerId: string,
  applicationId: string,
  bountyId: string,
  reason?: string
): Promise<Notification | null> {
  const message = reason
    ? `Your application was rejected: ${reason}`
    : 'Your application was rejected';

  return createNotification(
    providerId,
    'application_rejected',
    'Application Rejected',
    message,
    bountyId,
    applicationId
  );
}

export async function notifyPaymentConfirmed(
  posterId: string,
  providerId: string,
  bountyId: string
): Promise<void> {
  // Notify poster
  await createNotification(
    posterId,
    'payment_confirmed',
    'Payment Confirmed',
    'Your payment has been confirmed. Service will begin shortly.',
    bountyId
  );

  // Notify provider
  await createNotification(
    providerId,
    'payment_confirmed',
    'Payment Confirmed',
    'Payment has been received. Please proceed with the service.',
    bountyId
  );
}

export async function notifyBountyCompleted(
  posterId: string,
  providerId: string,
  bountyId: string
): Promise<void> {
  // Notify poster
  await createNotification(
    posterId,
    'bounty_completed',
    'Bounty Completed',
    'The service has been completed. You can now release payment and rate the provider.',
    bountyId
  );

  // Notify provider
  await createNotification(
    providerId,
    'bounty_completed',
    'Bounty Completed',
    'The bounty has been marked as complete. Payment will be released shortly.',
    bountyId
  );
}

export async function notifyPaymentReleased(
  providerId: string,
  bountyId: string
): Promise<Notification | null> {
  return createNotification(
    providerId,
    'payment_released',
    'Payment Released',
    'Payment has been released to your account',
    bountyId
  );
}

export async function notifyRatingAvailable(
  userId: string,
  bountyId: string,
  otherUserName: string
): Promise<Notification | null> {
  return createNotification(
    userId,
    'rating_available',
    'Rate Your Experience',
    `You can now rate ${otherUserName} for this bounty`,
    bountyId
  );
}
