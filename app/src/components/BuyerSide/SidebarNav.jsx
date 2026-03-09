import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, TrendingUp, ShoppingCart, Search, User, Menu } from "lucide-react";
import { useDarkMode } from "../../utils/DarkModeContext";

const SidebarNav = () => {
  const { isDarkMode } = useDarkMode();
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
      className={`hidden md:flex flex-col shadow-md sticky top-0 h-screen transition-all duration-300 ${
        collapsed ? "w-12" : "w-48"
      } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center gap-2 p-3 mb-4 transition-colors duration-300 ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
      >
        <Menu className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        {!collapsed && <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Menu</span>}
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
                    isActive 
                      ? "text-blue-500 dark:text-blue-400 scale-110" 
                      : isDarkMode ? "text-gray-400 scale-100" : "text-gray-500 scale-100"
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
                    isActive 
                      ? "text-blue-500 dark:text-blue-400" 
                      : isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              )}
              {isActive && (
                <span className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-full ${
                  isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                }`}></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default SidebarNav;