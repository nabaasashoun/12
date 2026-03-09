// BottomNav.jsx - SIMPLEST DARK MODE IMPLEMENTATION
// Now follows the exact same light/dark mode as the rest of the page (no Tailwind dark: needed)

import { NavLink } from "react-router-dom";
import { Home, TrendingUp, ShoppingCart, Bell, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../../utils/CartContext";
import { usePageLoading } from "../../utils/PageLoadingContext";
import BottomNavSkeleton from "../UISkeleton/BottomNavSkeleton";
import api from "../../utils/api";
import { useDarkMode } from "../../utils/DarkModeContext";   // ← Added

const BottomNav = () => {
  const { isDarkMode } = useDarkMode();                    // ← Added
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
    
    const refreshNotifications = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('notificationsRead', refreshNotifications);
    window.addEventListener('notificationRead', refreshNotifications);
    window.addEventListener('newNotification', refreshNotifications);
    window.addEventListener('followCompleted', refreshNotifications);
    
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
      badgeColor: "bg-green-500"
    },
    { 
      to: "/notifications", 
      icon: Bell, 
      label: "Notifications", 
      showBadge: true, 
      count: unreadCount,
      badgeColor: "bg-red-500"
    },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t shadow-md flex justify-around py-2 z-50 md:hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {navItems.map(({ to, icon: Icon, label, showBadge, count, badgeColor }) => (
        <NavLink key={to} to={to} className="flex flex-col items-center text-xs relative">
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive 
                      ? "text-blue-500 scale-110" 
                      : isDarkMode 
                        ? "text-gray-400" 
                        : "text-gray-500"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                
                {showBadge && count > 0 && (
                  <span 
                    className={`absolute -top-2 -right-2 ${badgeColor} text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              
              <span
                className={`text-[10px] transition-colors duration-300 mt-1 ${
                  isActive 
                    ? "text-blue-500 font-medium" 
                    : isDarkMode 
                      ? "text-gray-400" 
                      : "text-gray-500"
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