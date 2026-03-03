import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, TrendingUp, ShoppingCart, Search, User, Menu } from "lucide-react";

const SidebarNav = () => {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/trending", icon: TrendingUp, label: "Trending" },
    { to: "/cart", icon: ShoppingCart, label: "Cart" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div
      className={`hidden md:flex flex-col bg-white shadow-md sticky top-0 h-screen transition-all duration-300 ${
        collapsed ? "w-12" : "w-48"
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 p-3 mb-4 hover:bg-gray-100 transition-colors duration-300"
      >
        <Menu className="w-6 h-6 text-gray-600" />
        {!collapsed && <span className="text-sm font-medium">Menu</span>}
      </button>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="relative flex items-center gap-2 p-3 rounded-lg mb-2 transition-colors duration-300"
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? "text-blue-500 scale-110" : "text-gray-500 scale-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {to === "/cart" && (
                  <span className="absolute -top-1 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                )}
              </div>
              {!collapsed && (
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? "text-blue-500" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              )}
              {isActive && (
                <span className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-full"></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default SidebarNav;