import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { AddProductProvider } from "./utils/AddProductContext";
import HomePage from "./components/BuyerSide/BuyerHomePage";
import SellerHomePage from "./components/SellerSide/SellerHomePage";
import LoginPage from "./components/BuyerSide/LoginPage";
import SellerLoginPage from "./components/SellerSide/SellerLoginPage";
import RegisterPage from "./components/BuyerSide/RegisterPage";
import SellerRegisterPage from "./components/SellerSide/SellerRegisterPage";
import TrendingPage from "./components/BuyerSide/TrendingPage";
import SearchBar from "./components/BuyerSide/SearchBar";
import SettingsPage from "./components/BuyerSide/BuyerSettingsPage";
import AccountPage from "./components/BuyerSide/AccountPage";
import NotificationsPage from "./components/BuyerSide/NotificationsPage";
import Product from "./components/BuyerSide/Product";
import CartPage from "./components/BuyerSide/CartPage";
import SellerPage from "./components/BuyerSide/SellerPage";
import BottomNav from "./components/BuyerSide/BottomNav";
import { NotificationProvider } from "./utils/NotificationContext";
import SellerBottomNav from "./components/SellerSide/SellerBottomNav";
import SidebarNav from "./components/BuyerSide/SidebarNav";
import ProductCommentsPage from "./components/BuyerSide/ProductCommentsPage";
import SellerAccountPage from "./components/SellerSide/SellerAccountPage";
import AddProduct1 from "./components/SellerSide/AddProduct1";
import AddProduct2 from "./components/SellerSide/AddProduct2";
import AddProduct3 from "./components/SellerSide/AddProduct3";
import SellerNotifications from "./components/SellerSide/SellerNotfifcations";
import SellerSettings from "./components/SellerSide/SellerSettings";
import SellerTrendingPage from "./components/SellerSide/SellerTrendingPage";
import { PageLoadingProvider } from "./utils/PageLoadingContext";
import { ChatProvider } from "./utils/ChatContext";
import ChatPage from "./components/Chat/ChatPage";
import { DarkModeProvider } from "./utils/BuyerDarkModeContext";
import { LikeBookmarkProvider } from "./utils/LikeBookmarkContext";
import { SellerDarkModeProvider } from "./utils/SellerDarkModeContext";

const AuthenticatedContent = ({ isAuthenticated, userRole, handleLogout, setIsAuthenticated, setUserRole }) => {
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
        <Route path="/register" element={<RegisterPage setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
        <Route path="/seller/login" element={<SellerLoginPage setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
        <Route path="/seller/register" element={<SellerRegisterPage setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const BuyerRoute = ({ children }) => {
    if (userRole === 'seller') return <Navigate to="/seller-home" />;
    if (userRole !== 'buyer') return <Navigate to="/login" />;
    return children;
  };

  const SellerRoute = ({ children }) => {
    if (userRole !== 'seller') return <Navigate to="/" />;
    return children;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {userRole === 'buyer' && <SidebarNav onLogout={handleLogout} />}
      {userRole === 'seller' && (
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 shrink-0">
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">Seller Dashboard</h2>
            <nav className="mt-8 space-y-2 flex-1">
              <NavLink to="/seller-home" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg font-medium`}>Dashboard</NavLink>
              <NavLink to="/seller/products" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}>My Products</NavLink>
              <NavLink to="/seller/orders" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}>Orders</NavLink>
              <NavLink to="/seller/add-product/step1" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}>Add Product</NavLink>
              <NavLink to="/seller/analytics" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}>Analytics</NavLink>
              <NavLink to="/seller/chat" className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}>Messages</NavLink>
            </nav>
            <button onClick={handleLogout} className="w-full text-left py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg mt-auto font-medium">Logout</button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${userRole === 'buyer' ? 'pb-16 md:pb-0' : 'pb-16 md:pb-0'}`}>
        <Routes>
          {/* Global Auth Routes */}
          <Route path="/login" element={<Navigate to={userRole === 'seller' ? "/seller-home" : "/"} />} />
          <Route path="/register" element={<Navigate to={userRole === 'seller' ? "/seller-home" : "/"} />} />
          <Route path="/seller/login" element={<Navigate to={userRole === 'seller' ? "/seller-home" : "/"} />} />
          <Route path="/seller/register" element={<Navigate to={userRole === 'seller' ? "/seller-home" : "/"} />} />

          {/* Buyer Routes */}
          <Route path="/" element={<BuyerRoute><HomePage /></BuyerRoute>} />
          <Route path="/cart" element={<BuyerRoute><CartPage /></BuyerRoute>} />
          <Route path="/trending" element={<BuyerRoute><TrendingPage /></BuyerRoute>} />
          <Route path="/search" element={<BuyerRoute><SearchBar /></BuyerRoute>} />
          <Route path="/settings" element={<BuyerRoute><SettingsPage /></BuyerRoute>} />
          <Route path="/notifications" element={<BuyerRoute><NotificationsPage /></BuyerRoute>} />
          <Route path="/chat" element={<BuyerRoute><ChatPage /></BuyerRoute>} />
          <Route path="/account" element={<BuyerRoute><AccountPage /></BuyerRoute>} />
          <Route path="/product/:productId" element={<BuyerRoute><Product /></BuyerRoute>} />
          <Route path="/seller/:sellerId" element={<BuyerRoute><SellerPage /></BuyerRoute>} />
          <Route path="/product/:productId/comments" element={<BuyerRoute><ProductCommentsPage /></BuyerRoute>} />

          {/* Seller Routes */}
          <Route path="/seller-home" element={<SellerRoute><SellerHomePage /></SellerRoute>} />
          <Route path="/seller/products" element={<SellerRoute><div className="p-8"><h1 className="text-2xl font-bold">My Products</h1><p>Products management page</p></div></SellerRoute>} />
          <Route path="/seller/orders" element={<SellerRoute><div className="p-8"><h1 className="text-2xl font-bold">Orders</h1><p>Orders management page</p></div></SellerRoute>} />
          <Route path="/seller/account" element={<SellerRoute><SellerAccountPage /></SellerRoute>} />
          <Route path="/seller/analytics" element={<SellerRoute><div className="p-8"><h1 className="text-2xl font-bold">Analytics</h1><p>Analytics dashboard</p></div></SellerRoute>} />
          <Route path="/seller/add-product/step1" element={<SellerRoute><AddProduct1 /></SellerRoute>} />
          <Route path="/seller/add-product/step2" element={<SellerRoute><AddProduct2 /></SellerRoute>} />
          <Route path="/seller/add-product/step3" element={<SellerRoute><AddProduct3 /></SellerRoute>} />
          <Route path="/seller/add-product" element={<Navigate to="/seller/add-product/step1" />} />
          <Route path="/seller/notifications" element={<SellerRoute><SellerNotifications /></SellerRoute>} />
          <Route path="/seller/chat" element={<SellerRoute><ChatPage /></SellerRoute>} />
          <Route path="/seller/settings" element={<SellerRoute><SellerSettings /></SellerRoute>} />
          <Route path="/seller/trending2" element={<SellerRoute><SellerTrendingPage /></SellerRoute>} />

          <Route path="*" element={<Navigate to={userRole === 'seller' ? "/seller-home" : "/"} />} />
        </Routes>
      </div>

      {userRole === 'buyer' && <BottomNav />}
      {userRole === 'seller' && <SellerBottomNav />}
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access');
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setIsAuthenticated(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/verify-token/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user || (storedUser ? JSON.parse(storedUser) : null);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            const role = user.is_seller ? 'seller' : 'buyer';
            setUserRole(role);
            localStorage.setItem('userRole', role);
            setIsAuthenticated(true);
          }
        } else {
          clearAuthData();
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setUserRole(user.is_seller ? 'seller' : 'buyer');
            setIsAuthenticated(true);
          } catch {
            clearAuthData();
            setIsAuthenticated(false);
            setUserRole(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleLogout = () => {
    clearAuthData();
    window.dispatchEvent(new Event('authStateChanged'));
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 font-medium text-gray-500">Loading TendSync...</div>;
  }

  return (
    <BrowserRouter>
      <DarkModeProvider>
        <SellerDarkModeProvider>
          <LikeBookmarkProvider>
            <ChatProvider>
              <PageLoadingProvider>
                <NotificationProvider>
                  <AddProductProvider>
                    <AuthenticatedContent
                      isAuthenticated={isAuthenticated}
                      userRole={userRole}
                      handleLogout={handleLogout}
                      setIsAuthenticated={setIsAuthenticated}
                      setUserRole={setUserRole}
                    />
                  </AddProductProvider>
                </NotificationProvider>
              </PageLoadingProvider>
            </ChatProvider>
          </LikeBookmarkProvider>
        </SellerDarkModeProvider>
      </DarkModeProvider>
    </BrowserRouter>
  );
};

export default App;