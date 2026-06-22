// SellerNotfifcations.jsx - Fully updated with real backend notifications
import { SellerCard, SellerCardContent } from './SellerCard';
import { 
  Bell, CheckCircle, 
  ShoppingCart, 
  Star, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Package, 
  MessageSquare, 
  AlertCircle, 
  X,
  User,
  CreditCard,
  Truck,
  Clock,
  Eye,
  ThumbsUp,
  ArrowLeft
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const SellerNotifications = ({ setHasUnreadNotifications }) => {
  const { isDarkMode } = useSellerDarkMode();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    const iconMap = {
      'follow': { icon: Users, color: isDarkMode ? 'text-blue-400' : 'text-blue-500' },
      'order': { icon: ShoppingCart, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
      'order_received': { icon: ShoppingCart, color: isDarkMode ? 'text-orange-400' : 'text-orange-500' },
      'order_confirmed': { icon: CheckCircle, color: isDarkMode ? 'text-green-400' : 'text-green-600' },
      'payment_received': { icon: DollarSign, color: isDarkMode ? 'text-emerald-400' : 'text-emerald-500' },
      'product_sold': { icon: Package, color: isDarkMode ? 'text-purple-400' : 'text-purple-500' },
      'new_review': { icon: Star, color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500' },
      'new_follower': { icon: Users, color: isDarkMode ? 'text-blue-400' : 'text-blue-500' },
      'low_stock': { icon: AlertCircle, color: isDarkMode ? 'text-red-400' : 'text-red-500' },
      'withdrawal_success': { icon: CreditCard, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
      'analytics': { icon: TrendingUp, color: isDarkMode ? 'text-purple-400' : 'text-purple-500' },
      'customer': { icon: MessageSquare, color: isDarkMode ? 'text-indigo-400' : 'text-indigo-500' },
      'system': { icon: CheckCircle, color: isDarkMode ? 'text-gray-400' : 'text-gray-500' },
      'policy': { icon: AlertCircle, color: isDarkMode ? 'text-red-400' : 'text-red-500' },
      'profile_update': { icon: User, color: isDarkMode ? 'text-teal-400' : 'text-teal-500' },
      'review': { icon: Star, color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500' },
      'review_confirmation': { icon: Star, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
      'chat_message': { icon: MessageSquare, color: isDarkMode ? 'text-indigo-400' : 'text-indigo-500' },
    };
    return iconMap[type] || { icon: Bell, color: isDarkMode ? 'text-gray-400' : 'text-gray-500' };
  };

  const getNotificationTitle = (type) => {
    const titles = {
      'follow': 'New Follower',
      'follow_confirmation': 'Follow Confirmation',
      'order': 'Order Update',
      'order_received': 'New Order Received',
      'order_confirmed': 'Order Confirmed',
      'payment_received': 'Payment Received',
      'payment_successful': 'Payment Successful',
      'product_sold': 'Product Sold Out',
      'new_review': 'New Review',
      'new_follower': 'New Follower',
      'low_stock': 'Low Stock Alert',
      'withdrawal_success': 'Withdrawal Successful',
      'analytics': 'Analytics Update',
      'customer': 'Customer Message',
      'system': 'System Notification',
      'policy': 'Policy Update',
      'profile_update': 'Profile Updated',
      'review': 'New Review',
      'review_confirmation': 'Thank You for Your Review',
      'chat_message': 'New Message',
    };
    return titles[type] || 'Notification';
  };

  // Format time
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

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (force = false) => {
    // Prevent multiple simultaneous requests
    if (isPolling && !force) {
      console.log('Already fetching, skipping...');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/seller/login');
      return;
    }

    setIsPolling(true);
    setLoading(true);

    try {
      const result = await api.getSimpleNotifications();
      
      if (!isMountedRef.current) return;

      if (result.data && result.data.status === 'success') {
        // Format real notifications from backend
        const formattedNotifications = result.data.data.map(notif => {
          let title = notif.title || getNotificationTitle(notif.notification_type);
          
          // Customize title for follow notifications
          if (notif.notification_type === 'follow' && notif.data?.sender_name) {
            title = `New Follower: ${notif.data.sender_name}`;
          }
          
          return {
            id: notif.id,
            type: notif.notification_type || 'system',
            title: title,
            message: notif.message,
            time: formatTime(notif.created_at),
            read: notif.read || false,
            data: notif.data || {},
            created_at: notif.created_at
          };
        });
        
        setNotifications(formattedNotifications);
        setUnreadCount(result.data.unread_count || 0);
        
        // Update parent about unread count
        if (typeof setHasUnreadNotifications === 'function') {
          setHasUnreadNotifications((result.data.unread_count || 0) > 0);
        }
      } else {
        // If API returns empty, set empty array
        setNotifications([]);
        setUnreadCount(0);
        if (typeof setHasUnreadNotifications === 'function') {
          setHasUnreadNotifications(false);
        }
      }
    } catch (error) {
      console.error('Error fetching seller notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsPolling(false);
      }
    }
  }, [navigate, setHasUnreadNotifications, isPolling]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      // Only call API if it's a real notification (not client-side only)
      await api.markSimpleNotificationRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update parent
      if (typeof setHasUnreadNotifications === 'function') {
        const newUnreadCount = unreadCount - 1;
        setHasUnreadNotifications(newUnreadCount > 0);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [unreadCount, setHasUnreadNotifications]);

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    try {
      await api.markAllSimpleNotificationsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      
      if (typeof setHasUnreadNotifications === 'function') {
        setHasUnreadNotifications(false);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [setHasUnreadNotifications]);

  // Delete a single notification
  const deleteNotification = useCallback(async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteSimpleNotification(id);
      
      // Find if it was unread before deletion
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (typeof setHasUnreadNotifications === 'function') {
          setHasUnreadNotifications(unreadCount - 1 > 0);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, unreadCount, setHasUnreadNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await api.clearAllSimpleNotifications();
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      if (typeof setHasUnreadNotifications === 'function') {
        setHasUnreadNotifications(false);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [setHasUnreadNotifications]);

  // Handle notification click for navigation
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    if (notification.type === 'order_received' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'order_confirmed' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'payment_received' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'product_sold' && notification.data?.product_id) {
      navigate(`/seller/products/${notification.data.product_id}`);
    } else if (notification.type === 'new_review' && notification.data?.product_id) {
      navigate(`/product/${notification.data.product_id}`);
    } else if (notification.type === 'low_stock' && notification.data?.product_id) {
      navigate(`/seller/products/${notification.data.product_id}`);
    } else if (notification.type === 'profile_update') {
      navigate('/seller/settings');
    } else if (notification.type === 'analytics') {
      navigate('/seller/analytics');
    } else if (notification.type === 'follow' && notification.data?.follower_id) {
      navigate(`/profile/${notification.data.follower_id}`);
    } else if (notification.type === 'chat_message' && notification.data?.sender_id) {
      navigate(`/seller/chat?userId=${notification.data.sender_id}`);
    }
  }, [markAsRead, navigate]);

  // Initial fetch and polling setup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchNotifications(true);

    // Set up polling (every 30 seconds)
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Event listeners for real-time updates
    const handleAuthChange = () => {
      fetchNotifications(true);
    };

    const handleNewNotification = () => {
      fetchNotifications(true);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'access' || e.key === 'user') {
        fetchNotifications(true);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('followCompleted', handleNewNotification);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('followCompleted', handleNewNotification);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchNotifications]);

  // Effect to update parent when notifications change
  useEffect(() => {
    if (typeof setHasUnreadNotifications === 'function') {
      setHasUnreadNotifications(unreadCount > 0);
    }
  }, [unreadCount, setHasUnreadNotifications]);

  if (loading && notifications.length === 0) {
    return (
      <div className={`p-6 max-w-2xl mx-auto min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse">
          <div className={`h-8 rounded w-48 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-2xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with back button */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/seller-home')}
              className={`mr-4 p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-400' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className={`text-[23px] font-bold flex items-center ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                <Bell className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                Notifications
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className={`text-sm font-medium ${
                isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
              }`}
            >
              Clear All
            </button>
          )}
        </div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        </p>
      </div>

      {notifications.length === 0 ? (
        <SellerCard>
          <SellerCardContent className="p-8 text-center">
            <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>No notifications</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              You're all caught up! Check back later for updates.
            </p>
          </SellerCardContent>
        </SellerCard>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon: IconComponent, color } = getIconForType(notification.type);
              return (
                <SellerCard
                  key={notification.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    !notification.read 
                      ? isDarkMode 
                        ? 'border-l-4 border-blue-500' 
                        : 'border-l-4 border-blue-500'
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <SellerCardContent className="p-4">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full bg-opacity-20 mr-4 ${color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {notification.time}
                            </p>
                            
                            {/* Additional info for specific notification types */}
                            {notification.type === 'order_received' && notification.data?.amount && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isDarkMode 
                                    ? 'bg-orange-900/30 text-orange-400' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  UGX {notification.data.amount.toLocaleString()}
                                </span>
                                {notification.data?.customer && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    isDarkMode 
                                      ? 'bg-blue-900/30 text-blue-400' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {notification.data.customer}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {notification.type === 'low_stock' && notification.data?.product_name && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-red-900/30 text-red-400' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {notification.data.product_name} - {notification.data.stock || 0} left
                              </span>
                            )}
                            
                            {notification.type === 'new_review' && notification.data?.rating && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-yellow-900/30 text-yellow-400' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {notification.data.rating} ★ Rating
                              </span>
                            )}
                            
                            {notification.type === 'follow' && notification.data?.follower_name && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-900/30 text-blue-400' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                @{notification.data.follower_name}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className={`p-1 ml-2 ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-gray-300' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="ml-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </SellerCardContent>
                </SellerCard>
              );
            })}
          </div>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <div className={`mt-8 p-4 rounded-xl border ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800' 
                : 'bg-blue-50 border-blue-100'
            }`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                Quick Actions
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={markAllRead}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
                >
                  Mark All Read
                </button>
                <button
                  onClick={() => navigate('/seller/orders')}
                  className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                    isDarkMode 
                      ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white' 
                      : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  View Orders
                </button>
                <button
                  onClick={() => navigate('/seller/products')}
                  className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                    isDarkMode 
                      ? 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white' 
                      : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  Manage Products
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerNotifications;