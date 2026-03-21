import { BuyerCard, BuyerCardContent } from './BuyerCard';
import { 
  Bell, 
  CheckCircle, 
  ShoppingCart, 
  Star, 
  Users, 
  Gift, 
  X, 
  User,
  CreditCard,
  Package,
  Truck,
  ArrowLeft
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { useNotifications } from '../../utils/NotificationContext';

const NotificationsPage = ({ setHasUnreadNotifications }) => {
  const { isDarkMode } = useDarkMode();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll,
    fetchNotifications 
  } = useNotifications();
  
  const navigate = useNavigate();

  // Update parent about unread count
  useEffect(() => {
    if (typeof setHasUnreadNotifications === 'function') {
      setHasUnreadNotifications(unreadCount > 0);
    }
  }, [unreadCount, setHasUnreadNotifications]);

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    const iconMap = {
      'follow': { icon: Users, color: 'text-blue-500' },
      'follow_confirmation': { icon: CheckCircle, color: 'text-green-500' },
      'order': { icon: ShoppingCart, color: 'text-green-500' },
      'order_confirmed': { icon: CheckCircle, color: 'text-green-600' },
      'payment_successful': { icon: CreditCard, color: 'text-emerald-500' },
      'order_shipped': { icon: Truck, color: 'text-purple-500' },
      'order_delivered': { icon: Package, color: 'text-blue-600' },
      'deal_alert': { icon: Gift, color: 'text-orange-500' },
      'price_drop': { icon: Star, color: 'text-yellow-500' },
      'review': { icon: Star, color: 'text-yellow-500' },
      'profile_update': { icon: User, color: 'text-indigo-500' },
      'system': { icon: CheckCircle, color: 'text-gray-500' }
    };
    return iconMap[type] || { icon: Bell, color: 'text-gray-500' };
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'follow' && notification.data?.seller_id) {
      navigate(`/seller/${notification.data.seller_id}`);
    } else if (['order_confirmed', 'payment_successful', 'order_shipped', 'order_delivered'].includes(notification.type) && notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    } else if (notification.type === 'review' && notification.data?.product_id) {
      navigate(`/product/${notification.data.product_id}`);
    } else if (notification.type === 'profile_update') {
      navigate('/account');
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (isLoading && notifications.length === 0) {
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
      {/* Header with back button */}
      <div className="mb-2">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className={`mr-4 p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className={`text-[23px] font-bold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Notifications</p>
        </div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        </p>
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
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={clearAll}
              className={`text-sm font-medium ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              Clear All
            </button>
          </div>
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
                      <div className={`p-2 rounded-full bg-opacity-20 mr-4 ${color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{notification.title}</h3>
                            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-black'}`}>{notification.message}</p>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notification.time}</p>
                          </div>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
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

          {/* Quick Actions */}
          <div className={`mt-8 p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-black'}`}>Quick Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
              >
                Mark All Read
              </button>
              <button
                onClick={() => navigate('/orders')}
                className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                  isDarkMode 
                    ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white' 
                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                View Orders
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;