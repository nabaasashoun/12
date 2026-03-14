import { BuyerCard, BuyerCardContent } from './BuyerCard';
import { 
  Bell, 
  CheckCircle, 
  ShoppingCart, 
  Star, 
  Users, 
  Gift, 
  X, 
  UserPlus,
  User,
  CreditCard,
  Package,
  Truck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';   

const NotificationsPage = ({ setHasUnreadNotifications }) => {
  const { isDarkMode } = useDarkMode();                  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDummy, setShowDummy] = useState(true); 
  const navigate = useNavigate();

  // Dummy static notifications for buyer
  const dummyNotifications = [
    {
      id: 'dummy-1',
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: 'Your order #ORD-2024-001 has been confirmed and is being processed.',
      time: '2 hours ago',
      read: false,
      data: { order_id: 1001 }
    },
    {
      id: 'dummy-2',
      type: 'payment_successful',
      title: 'Payment Successful',
      message: 'Payment of UGX 45,000 for order #ORD-2024-001 was successful.',
      time: '2 hours ago',
      read: false,
      data: { order_id: 1001, amount: 45000 }
    },

    {
      id: 'dummy-4',
      type: 'order_delivered',
      title: 'Order Delivered',
      message: 'Your order #ORD-2024-003 has been delivered. Please rate your purchase.',
      time: '1 day ago',
      read: true,
      data: { order_id: 1003 }
    },
  ];

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    switch(type) {
      case 'follow':
        return { icon: Users, color: 'text-blue-500' };
      case 'follow_confirmation':
        return { icon: CheckCircle, color: 'text-green-500' }; 
      case 'order':
        return { icon: ShoppingCart, color: 'text-green-500' };
      case 'order_confirmed':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'payment_successful':
        return { icon: CreditCard, color: 'text-emerald-500' };
      case 'order_shipped':
        return { icon: Truck, color: 'text-purple-500' };
      case 'order_delivered':
        return { icon: Package, color: 'text-blue-600' };
      case 'deal_alert':
        return { icon: Gift, color: 'text-orange-500' };
      case 'price_drop':
        return { icon: Star, color: 'text-yellow-500' };
      case 'review':
        return { icon: Star, color: 'text-yellow-500' };
      case 'promotion':
        return { icon: Gift, color: 'text-purple-500' };
      case 'profile_update':
        return { icon: User, color: 'text-indigo-500' };
      case 'system':
        return { icon: CheckCircle, color: 'text-gray-500' };
      default:
        return { icon: Bell, color: 'text-gray-500' };
    }
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

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('1. Token present:', !!token);
      
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('2. Calling api.getSimpleNotifications()');
      const result = await api.getSimpleNotifications();
      console.log('3. Raw API response:', result);
      
      if (result.data && result.data.status === 'success') {
        console.log('4. Notifications data array:', result.data.data);
        console.log('5. Unread count:', result.data.unread_count);
        
        // Format real notifications from backend
        const realNotifications = result.data.data.map(notif => {
          console.log('6. Processing notification:', notif);
          
          // Set appropriate title based on type
          let title = notif.title;
          if (!title) {
            if (notif.notification_type === 'profile_update') {
              title = 'Profile Update';
            } else if (notif.notification_type === 'follow') {
              title = 'New Follower';
            } else if (notif.notification_type === 'follow_confirmation') {
              title = 'Follow Confirmation';
            } else {
              title = 'Notification';
            }
          }
          
          return {
            id: notif.id,
            type: notif.notification_type,
            title: title,
            message: notif.message,
            time: formatTime(notif.created_at),
            read: notif.read,
            data: notif.data
          };
        });
        
        console.log('7. Real notifications:', realNotifications);
        const unreadDummy = dummyNotifications.filter(d => !d.read);
        const readDummy = dummyNotifications.filter(d => d.read);
        const allNotifications = [
          ...realNotifications,
          ...unreadDummy,
          ...readDummy
        ];
        
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('9. Error fetching notifications:', error);
      // If error, still show dummy notifications
      setNotifications(dummyNotifications);
    } finally {
      setLoading(false);
      console.log('10. Loading set to false');
    }
  };

  // Effect for fetching notifications on mount and polling
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []); 

  // Separate effect for updating parent about unread count
  useEffect(() => {
    if (typeof setHasUnreadNotifications === 'function') {
      const unreadCount = notifications.filter(notif => !notif.read).length;
      setHasUnreadNotifications(unreadCount > 0);
    }
  }, [notifications, setHasUnreadNotifications]); 

  const markAsRead = async (id) => {
    try {
      // Only try to mark real notifications as read in backend
      if (!id.toString().startsWith('dummy-')) {
        await api.markSimpleNotificationRead(id);
      }
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      // Only try to delete real notifications from backend
      if (!id.toString().startsWith('dummy-')) {
        await api.deleteSimpleNotification(id);
      }
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Clear real notifications from backend
      await api.clearAllSimpleNotifications();
      
      // Clear dummy notifications as well
      setNotifications([]);
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const markAllRead = async () => {
    try {
      // Mark all real notifications as read in backend
      await api.markAllSimpleNotificationsRead();
      
      // Mark all notifications as read in state (including dummy)
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'follow' && notification.data?.seller_id) {
      navigate(`/seller/${notification.data.seller_id}`);
    } else if (notification.type === 'order' && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'order_confirmed' && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'payment_successful' && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'order_shipped' && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'order_delivered' && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'review' && notification.data?.product_id) {
      navigate(`/product/${notification.data.product_id}`);
    } else if (notification.type === 'price_drop' && notification.data?.product_id) {
      navigate(`/product/${notification.data.product_id}`);
    } else if (notification.type === 'profile_update') {
      navigate('/account');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 max-w-2xl mx-auto min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse">
          <div className={`h-8 rounded w-48 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className={`h-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-2xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[30px] font-bold mb-2 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              <Bell className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              Notifications
            </p>
            <p className={isDarkMode ? 'text-gray-400' : 'text-black'}>
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className={`text-sm font-medium ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <BuyerCard>
          <BuyerCardContent className="p-8 text-center">
            <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>No notifications</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>You're all caught up! Check back later for updates.</p>
          </BuyerCardContent>
        </BuyerCard>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const { icon: IconComponent, color } = getIconForType(notification.type);
            return (
              <BuyerCard
                key={notification.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <BuyerCardContent className="p-4">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full bg-opacity-20 mr-4 ${color} ${isDarkMode ? 'bg-gray-700' : ''}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{notification.title}</h3>
                          <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-black'}`}>{notification.message}</p>
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notification.time}</p>
                          
                          {/* Show additional info for specific notification types */}
                          {notification.type === 'order_confirmed' && notification.data?.order_id && (
                            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                              Order #{notification.data.order_id}
                            </span>
                          )}
                          
                          {notification.type === 'payment_successful' && notification.data?.amount && (
                            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                              UGX {notification.data.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className={`p-1 ml-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
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
                </BuyerCardContent>
              </BuyerCard>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <div className={`mt-8 p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
          <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-black'}`}>Quick Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={markAllRead}
              className={`px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              Mark All Read
            </button>
            <button
              onClick={() => navigate('/orders')}
              className={`px-3 py-1 border rounded-full text-sm hover:bg-blue-600 hover:text-white transition-colors ${isDarkMode ? 'border-blue-600 text-blue-400' : 'border-blue-600 text-blue-600'}`}
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/settings/notifications')}
              className={`px-3 py-1 border rounded-full text-sm hover:bg-gray-600 hover:text-white transition-colors ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-600 text-gray-600'}`}
            >
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;