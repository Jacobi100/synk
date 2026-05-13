import { supabaseAdmin } from "./supabase/server";
import type { Notification, NotificationType } from "./types/bounty";

export async function createNotification(input: {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_bounty_id?: string | null;
}): Promise<Notification | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      related_bounty_id: input.related_bounty_id ?? null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }
  return data as Notification;
}

export async function getNotificationsForUser(
  userId: string,
  unreadOnly: boolean = false,
): Promise<Notification[]> {
  let query = supabaseAdmin.from("notifications").select("*").eq("user_id", userId);
  if (unreadOnly) query = query.eq("read", false);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return (data || []) as Notification[];
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
  return data as Notification;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
  return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notifications").delete().eq("id", notificationId);
  if (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
  return true;
}
