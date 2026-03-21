import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { NavLink } from "react-router-dom";
import SellerAccountPage from "./components/SellerSide/SellerAccountPage";
import AddProduct1 from "./components/SellerSide/AddProduct1";
import AddProduct2 from "./components/SellerSide/AddProduct2";
import AddProduct3 from "./components/SellerSide/AddProduct3";
import SellerNotifications from "./components/SellerSide/SellerNotfifcations";
import SellerSettings from "./components/SellerSide/SellerSettings";
import SellerTrendingPage from "./components/SellerSide/SellerTrendingPage";
import { PageLoadingProvider } from "./utils/PageLoadingContext";
import { DarkModeProvider } from "./utils/BuyerDarkModeContext";
import { SellerDarkModeProvider } from "./utils/SellerDarkModeContext";
import { LikeBookmarkProvider } from "./utils/LikeBookmarkContext";
import i18n from './utils/i18n';
import { I18nextProvider } from 'react-i18next';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    return localStorage.getItem('accessToken') || localStorage.getItem('access');
  };

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
      const token = getToken();
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('user');

      console.log('Token validation - token exists:', !!token);

      if (!token) {
        console.log('No token found, user not authenticated');
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

        console.log('Verify token response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Verify token response data:', data);
          
          const user = data.user || (storedUser ? JSON.parse(storedUser) : null);

          if (user) {
            if (user.is_seller && storedRole === 'buyer') {
              console.warn('User role mismatch. Logging out.');
              clearAuthData();
              setIsAuthenticated(false);
              setUserRole(null);
              setLoading(false);
              return;
            }

            if (!storedUser) {
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            const role = user.is_seller ? 'seller' : 'buyer';
            setUserRole(role);
            localStorage.setItem('userRole', role);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
            setUserRole(storedRole || 'buyer');
          }
        } else if (response.status === 401) {
          console.log('Token invalid, attempting refresh...');
          const refreshed = await refreshToken();
          if (refreshed) {
            validateToken();
            return;
          } else {
            clearAuthData();
            setIsAuthenticated(false);
            setUserRole(null);
          }
        } else {
          console.log('Token validation failed with status:', response.status);
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
        } else {
          clearAuthData();
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    const refreshToken = async () => {
      const refresh = localStorage.getItem('refreshToken') || localStorage.getItem('refresh');
      if (!refresh) return false;

      try {
        const response = await fetch('/api/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refresh }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('accessToken', data.access);
          localStorage.setItem('access', data.access);
          if (data.refresh) {
            localStorage.setItem('refreshToken', data.refresh);
            localStorage.setItem('refresh', data.refresh);
          }
          return true;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
      return false;
    };
    
    validateToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const BuyerRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    const storedUserStr = localStorage.getItem('user');
    let isSellerUser = false;
    
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        isSellerUser = storedUser.is_seller === true;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    if (isSellerUser || userRole === 'seller') {
      return <Navigate to="/seller/login" />;
    }

    if (userRole !== 'buyer') {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  const SellerRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/seller/login" />;
    
    const storedUserStr = localStorage.getItem('user');
    let isBuyerUser = false;
    
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        isBuyerUser = !storedUser.is_seller;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    if (isBuyerUser || userRole === 'buyer') {
      return <Navigate to="/" />;
    }
    
    if (userRole !== 'seller') return <Navigate to="/seller/login" />;
    
    return children;
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    window.dispatchEvent(new Event('authStateChanged'));
    window.dispatchEvent(new Event('storage'));
    
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const AuthenticatedContent = () => {
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

    if (userRole === 'buyer') {
      return (
        <DarkModeProvider>
          <div className="flex min-h-screen bg-gray-100">
            <SidebarNav onLogout={handleLogout} />
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/search" element={<SearchBar />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/product/:productId" element={<Product />} />
                <Route path="/seller/:sellerId" element={<SellerPage />} />
                <Route path="/product/:productId/comments" element={<ProductCommentsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <BottomNav />
          </div>
        </DarkModeProvider>
      );
    }

    if (userRole === 'seller') {
      return (
        <SellerDarkModeProvider>
          <div className="flex min-h-screen bg-gray-100">
            <div className="hidden md:block w-64 bg-white border-r border-gray-200">
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-800">Seller Dashboard</h2>
                <nav className="mt-8 space-y-2">
                  <NavLink 
                    to="/seller-home" 
                    className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg font-medium`}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink 
                    to="/seller/products" 
                    className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                  >
                    My Products
                  </NavLink>
                  <NavLink 
                    to="/seller/orders" 
                    className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                  >
                    Orders
                  </NavLink>
                  <NavLink 
                    to="/seller/add-product/step1" 
                    className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                  >
                    Add Product
                  </NavLink>
                  <NavLink 
                    to="/seller/analytics" 
                    className={({ isActive }) => `block py-2 px-4 ${isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                  >
                    Analytics
                  </NavLink>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
              <Routes>
                <Route path="/seller-home" element={<SellerHomePage />} />
                <Route path="/seller/products" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">My Products</h1>
                    <p>Products management page</p>
                  </div>
                } />
                <Route path="/seller/orders" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p>Orders management page</p>
                  </div>
                } />
                <Route path="/seller/account" element={<SellerAccountPage />} />
                <Route path="/seller/analytics" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p>Analytics dashboard</p>
                  </div>
                } />
                <Route path="/seller/add-product/step1" element={<AddProduct1 />} />
                <Route path="/seller/add-product/step2" element={<AddProduct2 />} />
                <Route path="/seller/add-product/step3" element={<AddProduct3 />} />
                <Route path="/seller/add-product" element={<Navigate to="/seller/add-product/step1" />} />
                <Route path="/seller/notifications" element={<SellerNotifications />} />
                <Route path="/seller/settings" element={<SellerSettings />} />
                <Route path="/seller/trending2" element={<SellerTrendingPage />} />
                <Route path="*" element={<Navigate to="/seller-home" />} />
              </Routes>
            </div>
            <SellerBottomNav />
          </div>
        </SellerDarkModeProvider>
      );
    }

    return null;
  };

  return (
    <I18nextProvider i18n={i18n}>
      <AddProductProvider>
        <PageLoadingProvider>
          <LikeBookmarkProvider> 
            <NotificationProvider> 
              <BrowserRouter>
                <AuthenticatedContent />
              </BrowserRouter>
            </NotificationProvider> 
          </LikeBookmarkProvider>  
        </PageLoadingProvider>
      </AddProductProvider>
    </I18nextProvider>
  );
};

export default App;