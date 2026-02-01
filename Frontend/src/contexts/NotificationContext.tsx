import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Notification,
  NotificationFilter,
  NotificationContextType,
} from "../types";
import { notificationApi } from "../services/api.service";
import { signalRService } from "../services/signalr.service";
import toast from "react-hot-toast";

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const hasLoadedRef = useRef(false);

  // Load notifications from API
  const loadNotifications = useCallback(async (filter?: NotificationFilter) => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications({
        page: filter?.page || 1,
        pageSize: filter?.pageSize || 20,
        isRead: filter?.isRead,
        type: filter?.type,
      });

      if (filter?.page && filter.page > 1) {
        // Append for pagination
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark as read");
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationApi.deleteNotification(notificationId);

        const notification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
        toast.error("Failed to delete notification");
      }
    },
    [notifications],
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      await notificationApi.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications deleted");
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      toast.error("Failed to delete all notifications");
    }
  }, []);

  // Handle incoming notification from SignalR
  const handleNewNotification = useCallback(
    (payload: {
      action: string;
      notification?: Notification;
      notificationIds?: string[];
      unreadCount: number;
    }) => {
      switch (payload.action) {
        case "new":
          if (payload.notification) {
            setNotifications((prev) => [payload.notification!, ...prev]);
            setUnreadCount(payload.unreadCount);

            // Show toast notification
            toast(payload.notification.title, {
              icon: "🔔",
              duration: 4000,
            });
          }
          break;

        case "read":
          if (payload.notificationIds) {
            setNotifications((prev) =>
              prev.map((n) =>
                payload.notificationIds!.includes(n.id)
                  ? { ...n, isRead: true, readAt: new Date() }
                  : n,
              ),
            );
          }
          setUnreadCount(payload.unreadCount);
          break;

        case "unread":
          if (payload.notificationIds) {
            setNotifications((prev) =>
              prev.map((n) =>
                payload.notificationIds!.includes(n.id)
                  ? { ...n, isRead: false, readAt: undefined }
                  : n,
              ),
            );
          }
          setUnreadCount(payload.unreadCount);
          break;

        case "delete":
          if (payload.notificationIds) {
            setNotifications((prev) =>
              prev.filter((n) => !payload.notificationIds!.includes(n.id)),
            );
          }
          setUnreadCount(payload.unreadCount);
          break;

        case "deleteAll":
          setNotifications([]);
          setUnreadCount(0);
          break;
      }
    },
    [],
  );

  // Setup SignalR event listeners
  useEffect(() => {
    const unsubscribeConnection = signalRService.onNotificationConnectionChange(
      (connected) => {
        setIsConnected(connected);
      },
    );

    const unsubscribeNotification = signalRService.onNotificationEvent(
      "ReceiveNotification",
      handleNewNotification,
    );

    const unsubscribeUpdate = signalRService.onNotificationEvent(
      "NotificationUpdate",
      handleNewNotification,
    );

    return () => {
      unsubscribeConnection();
      unsubscribeNotification();
      unsubscribeUpdate();
    };
  }, [handleNewNotification]);

  // Load initial notifications
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadNotifications();
    }
  }, [loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
