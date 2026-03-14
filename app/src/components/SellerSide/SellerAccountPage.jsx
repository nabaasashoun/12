import { useState, useEffect } from 'react';
import { SellerCard, SellerCardContent } from './SellerCard';
import { User, Mail, Phone, MapPin, Edit, ShoppingCart, DollarSign, Package, TrendingUp, Wallet, Settings, LogOut } from 'lucide-react';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';
import { useNavigate } from 'react-router-dom';

const SellerAccountPage = () => {
  const { isDarkMode } = useSellerDarkMode();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    productsListed: 0,
    totalSales: 0,
    followers: 0,
    trustPercentage: 0,
  });

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch seller profile
      const profileResponse = await fetch('/api/seller/profile/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setSellerData({
          businessName: profile.name || 'Business Name',
          email: profile.email || 'No email',
          phone: profile.contact || 'Not provided',
          address: profile.location || 'Not provided',
          joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), 
          trustScore: profile.trust || 85,
          totalSales: profile.sales || 0,
          followers: profile.followers || 0,
        });
      } else if (profileResponse.status === 401) {
        localStorage.removeItem('accessToken');
        window.location.href = '/seller/login';
        return;
      }

      // Fetch seller stats
      const statsResponse = await fetch('/api/seller/stats/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalOrders: statsData.total_orders || 0,
          totalRevenue: statsData.total_revenue || 0,
          pendingOrders: statsData.pending_orders || 0,
          productsListed: statsData.total_products || 0,
          totalSales: statsData.total_sales || 0,
          followers: statsData.followers || 0,
          trustPercentage: statsData.trust_percentage || 85,
        });
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/seller/login');
  };

  if (loading) {
    return (
      <div className={`p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDarkMode ? 'border-green-400' : 'border-green-500'}`}></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className={`p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center py-12">
          <User className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Please login as a seller to view your account
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Seller Profile Header */}
      <div className={`bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-8 ${
        isDarkMode ? 'from-green-600 to-emerald-700' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-white text-green-500 bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-4">
              {sellerData.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[25px] font-bold">{sellerData.businessName}</p>
              </div>
              <p className="text-green-100">{sellerData.email}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm">Seller since {sellerData.joinDate}</span>
                <span className="text-sm">{sellerData.followers} followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex border-b mb-6 overflow-x-auto ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {[
          { key: 'summary', label: 'Summary', icon: Package },
          { key: 'payments', label: 'Payments', icon: DollarSign },
          { key: 'orders', label: 'Orders', icon: ShoppingCart }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.key
                ? `text-green-600 border-b-2 border-green-600 ${isDarkMode ? 'text-green-400 border-green-400' : ''}`
                : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <tab.icon className={`w-5 h-5 transition-all duration-300 ${activeTab === tab.key ? 'animate-bounce-forever scale-110' : 'hover:scale-105'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${activeTab === 'summary' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {activeTab === 'summary' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SellerCard>
                  <SellerCardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Sales</p>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.totalSales}</p>
                      </div>
                      <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                        <ShoppingCart className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>

                <SellerCard>
                  <SellerCardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products Listed</p>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.productsListed}</p>
                      </div>
                      <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                        <Package className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>

                <SellerCard>
                  <SellerCardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Followers</p>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.followers}</p>
                      </div>
                      <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>
              </div>

              {/* Business Performance */}
              <SellerCard>
                <SellerCardContent className="p-6">
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Business Performance</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Trust Score</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Seller reliability</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{Math.round(stats.trustPercentage)}%</p>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Total Orders</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>All time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{stats.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                </SellerCardContent>
              </SellerCard>
            </>
          )}

          {activeTab === 'payments' && (
            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Payment History</h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Payment data not available yet.</p>
              </SellerCardContent>
            </SellerCard>
          )}

          {activeTab === 'orders' && (
            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Recent Orders</h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Order data not available yet.</p>
              </SellerCardContent>
            </SellerCard>
          )}
        </div>

        {/* Right Column - Business Info */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Business Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{sellerData.businessName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{sellerData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{sellerData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{sellerData.address}</span>
                  </div>
                </div>
                <button className={`mt-4 flex items-center ${
                  isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'
                }`}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Business Info
                </button>
              </SellerCardContent>
            </SellerCard>

            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Quick Actions</h2>
                <div className="space-y-3">
                  <button className={`w-full text-left p-3 border rounded-lg transition-colors flex items-center ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <Wallet className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Withdraw Funds</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transfer to bank account</p>
                    </div>
                  </button>
                  <button className={`w-full text-left p-3 border rounded-lg transition-colors flex items-center ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <TrendingUp className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>View Analytics</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detailed performance report</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => navigate('/seller/settings')}
                    className={`w-full text-left p-3 border rounded-lg transition-colors flex items-center ${
                      isDarkMode 
                        ? 'border-gray-700 hover:bg-gray-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Account Settings</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage account preferences</p>
                    </div>
                  </button>
                </div>
              </SellerCardContent>
            </SellerCard>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounceUpDownForever {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-2px); }
        }
        .animate-bounce-forever {
          animation: bounceUpDownForever 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-forever { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default SellerAccountPage;