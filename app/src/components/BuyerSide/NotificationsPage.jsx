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
  ArrowLeft,
  ExternalLink
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
  const [clickedNotificationId, setClickedNotificationId] = useState(null);

  // Update parent about unread count
  useEffect(() => {
    if (typeof setHasUnreadNotifications === 'function') {
      setHasUnreadNotifications(unreadCount > 0);
    }
  }, [unreadCount, setHasUnreadNotifications]);

  // Icon mapping based on notification type
  const getIconForType = (type) => {
    const iconMap = {
      'follow': { icon: Users, color: isDarkMode ? 'text-blue-400' : 'text-blue-500' },
      'follow_confirmation': { icon: CheckCircle, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
      'order': { icon: ShoppingCart, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
      'order_confirmed': { icon: CheckCircle, color: isDarkMode ? 'text-green-400' : 'text-green-600' },
      'payment_successful': { icon: CreditCard, color: isDarkMode ? 'text-emerald-400' : 'text-emerald-500' },
      'order_shipped': { icon: Truck, color: isDarkMode ? 'text-purple-400' : 'text-purple-500' },
      'order_delivered': { icon: Package, color: isDarkMode ? 'text-blue-400' : 'text-blue-600' },
      'deal_alert': { icon: Gift, color: isDarkMode ? 'text-orange-400' : 'text-orange-500' },
      'price_drop': { icon: Star, color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500' },
      'review': { icon: Star, color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500' },
      'profile_update': { icon: User, color: isDarkMode ? 'text-indigo-400' : 'text-indigo-500' },
      'system': { icon: CheckCircle, color: isDarkMode ? 'text-gray-400' : 'text-gray-500' },
      'info': { icon: Bell, color: isDarkMode ? 'text-blue-400' : 'text-blue-500' },
      'warning': { icon: Bell, color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500' },
      'success': { icon: CheckCircle, color: isDarkMode ? 'text-green-400' : 'text-green-500' },
    };
    return iconMap[type] || { icon: Bell, color: isDarkMode ? 'text-gray-400' : 'text-gray-500' };
  };

  // Handle notification click with enhanced navigation
  const handleNotificationClick = async (notification) => {
    // Set clicked state for visual feedback
    setClickedNotificationId(notification.id);
    setTimeout(() => setClickedNotificationId(null), 500);

    // Mark as read when clicked
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    const data = notification.data || {};
    
    if (notification.type === 'follow' && data?.seller_id) {
      navigate(`/seller/${data.seller_id}`);
    } else if (notification.type === 'follow' && data?.follower_id) {
      navigate(`/profile/${data.follower_id}`);
    } else if (['order_confirmed', 'payment_successful', 'order_shipped', 'order_delivered', 'order'].includes(notification.type) && data?.order_id) {
      navigate(`/orders/${data.order_id}`);
    } else if (notification.type === 'order' && data?.order_number) {
      navigate(`/orders/${data.order_number}`);
    } else if (notification.type === 'review' && data?.product_id) {
      navigate(`/product/${data.product_id}`);
    } else if (notification.type === 'review' && data?.review_id) {
      navigate(`/product/${data.review_id}`);
    } else if (notification.type === 'profile_update') {
      navigate('/account');
    } else if (notification.type === 'deal_alert' && data?.product_id) {
      navigate(`/product/${data.product_id}`);
    } else if (notification.type === 'price_drop' && data?.product_id) {
      navigate(`/product/${data.product_id}`);
    } else if (notification.type === 'system' || notification.type === 'info' || notification.type === 'warning' || notification.type === 'success') {
      // Just mark as read, no navigation needed
      console.log('Notification marked as read:', notification.title);
    } else {
      // Default: just mark as read
      console.log('Notification clicked without specific action:', notification);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
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
            <p className={`text-[23px] font-bold flex items-center ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              <Bell className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              Notifications
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className={`text-sm font-medium ${
                isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
              }`}
            >
              Clear All
            </button>
          )}
        </div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
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
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon: IconComponent, color } = getIconForType(notification.type);
              const isClicked = clickedNotificationId === notification.id;
              
              return (
                <BuyerCard
                  key={notification.id}
                  className={`hover:shadow-md transition-all duration-300 cursor-pointer transform ${
                    isClicked ? 'scale-[0.98]' : 'scale-100'
                  } ${
                    !notification.read 
                      ? isDarkMode 
                        ? 'border-l-4 border-blue-500 bg-blue-900/10' 
                        : 'border-l-4 border-blue-500 bg-blue-50/50'
                      : isDarkMode
                        ? 'hover:bg-gray-800/50'
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <BuyerCardContent className="p-4">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full bg-opacity-20 mr-4 flex-shrink-0 ${color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'} flex items-center gap-2`}>
                              {notification.title}
                              {!notification.read && (
                                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  isDarkMode 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  New
                                </span>
                              )}
                            </h3>
                            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-black'} break-words`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {notification.time}
                              </p>
                              {!notification.read && (
                                <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  • Click to mark as read
                                </span>
                              )}
                            </div>
                            
                            {/* Additional info for specific notification types */}
                            {notification.type === 'order' && notification.data?.amount && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isDarkMode 
                                    ? 'bg-green-900/30 text-green-400' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  UGX {notification.data.amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                            
                            {notification.type === 'payment_successful' && notification.data?.amount && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-emerald-900/30 text-emerald-400' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                UGX {notification.data.amount.toLocaleString()} - Payment Successful
                              </span>
                            )}
                            
                            {notification.type === 'review' && notification.data?.rating && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-yellow-900/30 text-yellow-400' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {notification.data.rating} ★ Rating
                              </span>
                            )}
                            
                            {notification.type === 'follow' && notification.data?.seller_name && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-900/30 text-blue-400' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                @{notification.data.seller_name}
                              </span>
                            )}
                            
                            {notification.type === 'deal_alert' && notification.data?.product_name && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-orange-900/30 text-orange-400' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {notification.data.product_name}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className={`p-1 ml-2 flex-shrink-0 transition-colors ${
                              isDarkMode 
                                ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded'
                            }`}
                            aria-label="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0 self-start mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </BuyerCardContent>
                </BuyerCard>
              );
            })}
          </div>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <div className={`mt-8 p-4 rounded-xl border transition-colors ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800' 
                : 'bg-blue-50 border-blue-100'
            }`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                Quick Actions
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Mark All Read
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className={`px-3 py-1 border rounded-full text-sm transition-colors flex items-center gap-1 ${
                    isDarkMode 
                      ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white' 
                      : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-3 h-3" />
                  View Orders
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className={`px-3 py-1 border rounded-full text-sm transition-colors flex items-center gap-1 ${
                    isDarkMode 
                      ? 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white' 
                      : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  Browse Products
                </button>
                <button
                  onClick={() => navigate('/account')}
                  className={`px-3 py-1 border rounded-full text-sm transition-colors flex items-center gap-1 ${
                    isDarkMode 
                      ? 'border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white' 
                      : 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3" />
                  My Account
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;