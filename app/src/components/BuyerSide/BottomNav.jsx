import { NavLink } from "react-router-dom";
import { Home, TrendingUp, ShoppingCart, MessageSquare, User } from "lucide-react";
import { useCart } from "../../utils/CartContext";
import { usePageLoading } from "../../utils/PageLoadingContext";
import BottomNavSkeleton from "../UISkeleton/BottomNavSkeleton";

const BottomNav = () => {
  const { cartCount } = useCart();
  const { isPageLoading } = usePageLoading(); 

  if (isPageLoading) {
    return <BottomNavSkeleton />;
  }

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/trending", icon: TrendingUp, label: "Trending" },
    { to: "/cart", icon: ShoppingCart, label: "Cart" },
    { to: "/notifications", icon: MessageSquare, label: "Notifications" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50 md:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
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
                {to === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
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