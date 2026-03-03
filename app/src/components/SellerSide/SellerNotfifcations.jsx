import { Card, CardContent } from '../BuyerSide/card';
import { Bell, CheckCircle, ShoppingCart, Star, Users, TrendingUp, DollarSign, Package, MessageSquare, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const SellerNotifications = ({ setHasUnreadNotifications }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      message: 'You received a new order #ORD-78451 for 2 items. Total: $149.99',
      time: '5 minutes ago',
      read: false,
      icon: ShoppingCart,
      color: 'text-green-500'
    },
    {
      id: 2,
      type: 'review',
      title: 'New Product Review',
      message: 'Customer left a 5-star review for "Wireless Headphones". View details.',
      time: '2 hours ago',
      read: false,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      id: 3,
      type: 'analytics',
      title: 'Sales Performance',
      message: 'Your store sales increased by 24% this week compared to last week.',
      time: '4 hours ago',
      read: false,
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Processed',
      message: 'Weekly payout of $2,847.63 has been sent to your bank account.',
      time: '1 day ago',
      read: false,
      icon: DollarSign,
      color: 'text-purple-500'
    },
    {
      id: 5,
      type: 'inventory',
      title: 'Low Stock Alert',
      message: 'Only 3 units left of "Premium Coffee Maker". Consider restocking.',
      time: '1 day ago',
      read: false,
      icon: Package,
      color: 'text-orange-500'
    },
    {
      id: 6,
      type: 'customer',
      title: 'Customer Inquiry',
      message: 'New message from customer regarding order #ORD-78451. Requires response.',
      time: '2 days ago',
      read: false,
      icon: MessageSquare,
      color: 'text-indigo-500'
    },
    {
      id: 7,
      type: 'system',
      title: 'Platform Update',
      message: 'New seller dashboard features available. Check the updates section.',
      time: '3 days ago',
      read: true,
      icon: CheckCircle,
      color: 'text-gray-500'
    },
    {
      id: 8,
      type: 'policy',
      title: 'Policy Reminder',
      message: 'Remember to update your return policy before the holiday season.',
      time: '4 days ago',
      read: true,
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ]);


  useEffect(() => {
    if (typeof setHasUnreadNotifications === 'function') {
      const unreadCount = notifications.filter(notif => !notif.read).length;
      setHasUnreadNotifications(unreadCount > 0);
    }
  }, [setHasUnreadNotifications, notifications]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (typeof setHasUnreadNotifications === 'function') {
      setHasUnreadNotifications(false);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    if (typeof setHasUnreadNotifications === 'function') {
      setHasUnreadNotifications(false);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

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
            const IconComponent = notification.icon;
            return (
              <Card
                key={notification.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full ${notification.color} bg-opacity-20 mr-4`}>
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
              className="px-3 py-1 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-600 hover:text-white transition-colors"
            >
              Notification Settings
            </button>
            <button
              className="px-3 py-1 border border-green-600 text-green-600 rounded-full text-sm hover:bg-green-600 hover:text-white transition-colors"
            >
              View Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerNotifications;