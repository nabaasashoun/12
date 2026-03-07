import { Card, CardContent } from '../BuyerSide/card';
import { 
  Bell, 
  CheckCircle, 
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
  ThumbsUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const SellerNotifications = ({ setHasUnreadNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Dummy static notifications for seller
  const dummyNotifications = [
    {
      id: 'dummy-s-1',
      type: 'order_received',
      title: 'New Order Received',
      message: 'You have received a new order #ORD-2024-001 for UGX 45,000. Please confirm the order.',
      time: '2 hours ago',
      read: false,
      data: { order_id: 1001, amount: 45000, customer: 'John Doe' }
    },
    {
      id: 'dummy-s-2',
      type: 'order_confirmed',
      title: 'Order Confirmed by Customer',
      message: 'Customer has confirmed order #ORD-2024-002. Prepare for shipping.',
      time: '3 hours ago',
      read: false,
      data: { order_id: 1002 }
    },
    {
      id: 'dummy-s-3',
      type: 'payment_received',
      title: 'Payment Received',
      message: 'Payment of UGX 32,500 for order #ORD-2024-003 has been received successfully.',
      time: '5 hours ago',
      read: true,
      data: { order_id: 1003, amount: 32500 }
    },
    {
      id: 'dummy-s-4',
      type: 'product_sold',
      title: 'Product Sold Out',
      message: 'Your product "Wireless Headphones" has sold out. Time to restock!',
      time: '1 day ago',
      read: true,
      data: { product_id: 789, product_name: 'Wireless Headphones' }
    },
    {
      id: 'dummy-s-5',
      type: 'new_review',
      title: 'New Product Review',
      message: 'A customer left a 5-star review on your product "Smart Watch".',
      time: '1 day ago',
      read: false,
      data: { product_id: 456, rating: 5 }
    },
    {
      id: 'dummy-s-6',
      type: 'new_follower',
      title: 'New Follower',
      message: 'Jane Smith started following your store.',
      time: '2 days ago',
      read: true,
      data: { follower_id: 789, follower_name: 'Jane Smith' }
    },
    {
      id: 'dummy-s-7',
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Your product "Leather Wallet" is running low on stock (only 3 left).',
      time: '3 days ago',
      read: false,
      data: { product_id: 123, product_name: 'Leather Wallet', stock: 3 }
    },
    {
      id: 'dummy-s-8',
      type: 'withdrawal_success',
      title: 'Withdrawal Successful',
      message: 'Your withdrawal request of UGX 150,000 has been processed successfully.',
      time: '4 days ago',
      read: true,
      data: { amount: 150000, reference: 'WDR-2024-001' }
    }
  ];

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    switch(type) {
      case 'follow':
        return { icon: Users, color: 'text-blue-500' };
      case 'order':
        return { icon: ShoppingCart, color: 'text-green-500' };
      case 'order_received':
        return { icon: ShoppingCart, color: 'text-orange-500' };
      case 'order_confirmed':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'payment_received':
        return { icon: DollarSign, color: 'text-emerald-500' };
      case 'product_sold':
        return { icon: Package, color: 'text-purple-500' };
      case 'new_review':
        return { icon: Star, color: 'text-yellow-500' };
      case 'new_follower':
        return { icon: Users, color: 'text-blue-500' };
      case 'low_stock':
        return { icon: AlertCircle, color: 'text-red-500' };
      case 'withdrawal_success':
        return { icon: CreditCard, color: 'text-green-500' };
      case 'analytics':
        return { icon: TrendingUp, color: 'text-purple-500' };
      case 'customer':
        return { icon: MessageSquare, color: 'text-indigo-500' };
      case 'system':
        return { icon: CheckCircle, color: 'text-gray-500' };
      case 'policy':
        return { icon: AlertCircle, color: 'text-red-500' };
      case 'profile_update':
        return { icon: User, color: 'text-teal-500' };
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

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/seller/login');
        return;
      }

      const result = await api.getSimpleNotifications();
      
      if (result.data && result.data.status === 'success') {
        // Format real notifications from backend
        const realNotifications = result.data.data.map(notif => {
          // Set appropriate title based on type
          let title = notif.title;
          if (!title) {
            if (notif.notification_type === 'profile_update') {
              title = 'Profile Update';
            } else if (notif.notification_type === 'follow') {
              title = 'New Follower';
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
        
        // Combine real notifications with dummy notifications
        const unreadDummy = dummyNotifications.filter(d => !d.read);
        const readDummy = dummyNotifications.filter(d => d.read);
        
        // Combine all notifications
        const allNotifications = [
          ...realNotifications,
          ...unreadDummy,
          ...readDummy
        ];
        
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // If error, still show dummy notifications
      setNotifications(dummyNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Effect for fetching notifications on mount and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
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
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
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
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Handle notification click for navigation
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'order_received' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'order_confirmed' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'payment_received' && notification.data?.order_id) {
      navigate(`/seller/orders/${notification.data.order_id}`);
    } else if (notification.type === 'product_sold' && notification.data?.product_id) {
      navigate(`/seller/products/${notification.data.product_id}`);
    } else if (notification.type === 'new_review' && notification.data?.product_id) {
      navigate(`/seller/products/${notification.data.product_id}/reviews`);
    } else if (notification.type === 'low_stock' && notification.data?.product_id) {
      navigate(`/seller/products/${notification.data.product_id}/edit`);
    } else if (notification.type === 'profile_update') {
      navigate('/seller/settings');
    } else if (notification.type === 'analytics') {
      navigate('/seller/analytics');
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
            <p className="text-[23px] font-bold mb-2 flex items-center text-black">
              <Bell className="w-6 h-6 mr-2 text-blue-500" />
              Seller Notifications
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
                          
                          {/* Show additional info for specific notification types */}
                          {notification.type === 'order_received' && notification.data?.amount && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                UGX {notification.data.amount.toLocaleString()}
                              </span>
                              {notification.data?.customer && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {notification.data.customer}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {notification.type === 'low_stock' && notification.data?.product_name && (
                            <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              {notification.data.product_name} - {notification.data.stock} left
                            </span>
                          )}
                          
                          {notification.type === 'new_review' && notification.data?.rating && (
                            <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              {notification.data.rating} ★ Rating
                            </span>
                          )}
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={markAllRead}
              className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
            >
              Mark All Read
            </button>
            <button
              onClick={() => navigate('/seller/orders')}
              className="px-3 py-1 border border-green-600 text-green-600 rounded-full text-sm hover:bg-green-600 hover:text-white transition-colors"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/seller/products')}
              className="px-3 py-1 border border-purple-600 text-purple-600 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
            >
              Manage Products
            </button>
            <button
              onClick={() => navigate('/seller/analytics')}
              className="px-3 py-1 border border-gray-600 text-gray-600 rounded-full text-sm hover:bg-gray-600 hover:text-white transition-colors"
            >
              Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerNotifications;