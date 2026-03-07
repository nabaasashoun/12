import { Card, CardContent } from './card';
import { Bell, CheckCircle, ShoppingCart, Star, Users, Gift, X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = ({ setHasUnreadNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    switch(type) {
      case 'follow':
        return { icon: Users, color: 'text-blue-500' };
      case 'follow_confirmation':
        return { icon: CheckCircle, color: 'text-green-500' }; 
      case 'order':
        return { icon: ShoppingCart, color: 'text-green-500' };
      case 'review':
        return { icon: Star, color: 'text-yellow-500' };
      case 'promotion':
        return { icon: Gift, color: 'text-purple-500' };
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
        
        const formattedNotifications = result.data.data.map(notif => {
          console.log('6. Processing notification:', notif);
          return {
            id: notif.id,
            type: notif.notification_type,
            title: notif.title,
            message: notif.message,
            time: formatTime(notif.created_at),
            read: notif.read,
            data: notif.data
          };
        });
        
        console.log('7. Formatted notifications:', formattedNotifications);
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('9. Error fetching notifications:', error);
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
      await api.markSimpleNotificationRead(id);
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
      await api.deleteSimpleNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationRead'));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };


  const clearAllNotifications = async () => {
    try {
      await api.clearAllSimpleNotifications();
      setNotifications([]);
      // Dispatch event to update bottom nav
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };


  const markAllRead = async () => {
    try {
      await api.markAllSimpleNotificationsRead();
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
    } else if (notification.type === 'review' && notification.data?.product_id) {
      navigate(`/product/${notification.data.product_id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[30px] font-bold mb-2 flex items-center text-black">
              <Bell className="w-6 h-6 mr-2 text-blue-500" />
              Notifications
            </p>
            <p className="text-black">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const { icon: IconComponent, color } = getIconForType(notification.type);
            return (
              <Card
                key={notification.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full ${color} bg-opacity-20 mr-4`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-black">{notification.title}</h3>
                          <p className="text-black mt-1">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-2">{notification.time}</p>
                        </div>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 ml-2"
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-medium text-black mb-2">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={markAllRead}
              className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
            >
              Mark All Read
            </button>
            <button
              onClick={() => navigate('/settings/notifications')}
              className="px-3 py-1 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-600 hover:text-white transition-colors"
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