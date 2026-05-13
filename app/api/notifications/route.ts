import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getProfileUUID,
} from '@/lib/bounty';
import {
  getNotificationsForUser as fetchNotifications,
  markNotificationAsRead as markRead,
  markAllNotificationsAsRead as markAllRead,
  deleteNotification as deleteNotif,
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profileUUID = await getProfileUUID(userId);

    if (!profileUUID) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';

    const notifications = await fetchNotifications(profileUUID, unreadOnly);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationId } = body;

    const profileUUID = await getProfileUUID(userId);

    if (!profileUUID) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (action === 'mark_read') {
      if (!notificationId) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        );
      }

      const notification = await markRead(notificationId);

      if (!notification) {
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        );
      }

      return NextResponse.json(notification);
    } else if (action === 'mark_all_read') {
      const success = await markAllRead(profileUUID);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'All notifications marked as read' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteNotif(notificationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
