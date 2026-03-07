import { NavLink, Link } from "react-router-dom";
import { Home, TrendingUp, ShoppingCart, Bell, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../../utils/CartContext";
import { usePageLoading } from "../../utils/PageLoadingContext";
import BottomNavSkeleton from "../UISkeleton/BottomNavSkeleton";
import api from "../../utils/api";

const BottomNav = () => {
  const { cartCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isPageLoading } = usePageLoading();

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUnreadCount(0);
        return;
      }
      
      const result = await api.getSimpleNotifications();
      if (result.data?.unread_count > 0) {
        setUnreadCount(result.data.unread_count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Listen for notification events
    const refreshNotifications = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('notificationsRead', refreshNotifications);
    window.addEventListener('notificationRead', refreshNotifications);
    window.addEventListener('newNotification', refreshNotifications);
    window.addEventListener('followCompleted', refreshNotifications);
    
    // Poll every 30 seconds as backup
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsRead', refreshNotifications);
      window.removeEventListener('notificationRead', refreshNotifications);
      window.removeEventListener('newNotification', refreshNotifications);
      window.removeEventListener('followCompleted', refreshNotifications);
    };
  }, []);

  if (isPageLoading) {
    return <BottomNavSkeleton />;
  }

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/trending", icon: TrendingUp, label: "Trending" },
    { 
      to: "/cart", 
      icon: ShoppingCart, 
      label: "Cart", 
      showBadge: true, 
      count: cartCount,
      badgeColor: "bg-green-500" // Green for cart
    },
    { 
      to: "/notifications", 
      icon: Bell, 
      label: "Notifications", 
      showBadge: true, 
      count: unreadCount,
      badgeColor: "bg-red-500" // Red for notifications
    },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50 md:hidden">
      {navItems.map(({ to, icon: Icon, label, showBadge, count, badgeColor }) => (
        <NavLink key={to} to={to} className="flex flex-col items-center text-xs relative">
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? "text-blue-500 scale-110" : "text-gray-500 scale-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                
                {/* Badge with dynamic color */}
                {showBadge && count > 0 && (
                  <span 
                    className={`absolute -top-2 -right-2 ${badgeColor} text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive ? "text-blue-500 font-medium" : "text-gray-500"
                }`}
              >
                {label}
              </span>
              
              {isActive && (
                <span className="absolute -bottom-1 w-6 h-0.5 bg-blue-500 rounded-full"></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;