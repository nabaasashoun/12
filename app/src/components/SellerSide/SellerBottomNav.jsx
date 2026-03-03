import { NavLink } from "react-router-dom";
import { Home, TrendingUp, PlusCircle, Bell, User } from "lucide-react";

const SellerBottomNav = () => {
  const navItems = [
    { to: "/seller/home", icon: Home, label: "Home" },
    { to: "/seller/trending2", icon: TrendingUp, label: "Trending" },
    { to: "/seller/add-product", icon: PlusCircle, label: "Add Product" },
    { to: "/seller/notifications", icon: Bell, label: "Notifications" },
    { to: "/seller/account", icon: User, label: "Account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50 md:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink 
          key={to} 
          to={to} 
          className="flex flex-col items-center text-xs relative"
          end 
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? "text-green-500 scale-110" : "text-gray-500 scale-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* For the plus icon */}
                {to === "/seller/add-product" && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive ? "text-green-500 font-medium" : "text-gray-500"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-6 h-0.5 bg-green-500 rounded-full"></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default SellerBottomNav;