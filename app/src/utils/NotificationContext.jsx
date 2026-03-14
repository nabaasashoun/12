// utils/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from './api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef(null);
  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  const getToken = () => {
    return localStorage.getItem('accessToken') || localStorage.getItem('access');
  };

  const isUserSeller = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    try {
      const user = JSON.parse(userStr);
      return user?.is_seller === true || user?.role === 'seller';
    } catch (error) {
      console.error("Error parsing user data:", error);
      return false;
    }
  };

  const getNotificationTitle = (type) => {
    const titles = {
      'follow': 'New Follower',
      'follow_confirmation': 'Follow Confirmation',
      'order_confirmed': 'Order Confirmed',
      'payment_successful': 'Payment Successful',
      'order_shipped': 'Order Shipped',
      'order_delivered': 'Order Delivered',
      'profile_update': 'Profile Update',
      'review': 'New Review',
      'price_drop': 'Price Drop Alert',
      'deal_alert': 'Deal Alert',
      'system': 'System Notification'
    };
    return titles[type] || 'Notification';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const fetchNotifications = useCallback(async (force = false) => {
    // Don't fetch if already loading (unless forced)
    if (isLoading && !force) return;
    
    // Don't fetch for sellers
    if (isUserSeller()) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const token = getToken();
    if (!token) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Throttle requests to once every 2 seconds minimum
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 2000) {
      console.log("[NotificationContext] Throttling notification fetch");
      return;
    }

    setIsLoading(true);
    lastFetchRef.current = now;

    try {
      const result = await api.getSimpleNotifications();
      
      if (!isMountedRef.current) return;

      if (result.data && result.data.status === 'success') {
        // Format notifications
        const formattedNotifications = result.data.data.map(notif => ({
          id: notif.id,
          type: notif.notification_type,
          title: notif.title || getNotificationTitle(notif.notification_type),
          message: notif.message,
          time: formatTime(notif.created_at),
          read: notif.read,
          data: notif.data || {}
        }));
        
        setNotifications(formattedNotifications);
        setUnreadCount(result.data.unread_count || 0);
      }
    } catch (error) {
      console.error("[NotificationContext] Error fetching notifications:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (!notificationId.toString().startsWith('dummy-')) {
        await api.markSimpleNotificationRead(notificationId);
      }
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error("[NotificationContext] Error marking as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllSimpleNotificationsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      console.error("[NotificationContext] Error marking all as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      
      if (!notificationId.toString().startsWith('dummy-')) {
        await api.deleteSimpleNotification(notificationId);
      }
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      window.dispatchEvent(new CustomEvent('notificationDeleted'));
    } catch (error) {
      console.error("[NotificationContext] Error deleting notification:", error);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await api.clearAllSimpleNotifications();
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsCleared'));
    } catch (error) {
      console.error("[NotificationContext] Error clearing notifications:", error);
    }
  }, []);

  // Setup polling and event listeners
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchNotifications(true);

    // Set up polling (every 30 seconds)
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Event handlers
    const handleAuthChange = () => {
      console.log("[NotificationContext] Auth changed, refreshing");
      fetchNotifications(true);
    };

    const handleNewNotification = () => {
      console.log("[NotificationContext] New notification received");
      fetchNotifications(true);
    };

    const handleFollowCompleted = () => {
      console.log("[NotificationContext] Follow completed, refreshing");
      fetchNotifications(true);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'access' || e.key === 'user') {
        fetchNotifications(true);
      }
    };

    // Add event listeners
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('followCompleted', handleFollowCompleted);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('followCompleted', handleFollowCompleted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      isLoading,
      fetchNotifications: () => fetchNotifications(true),
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};