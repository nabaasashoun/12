import { useState, useEffect } from 'react';
import { SellerCard, SellerCardContent } from './SellerCard';
import { User, Mail, Phone, MapPin, Edit, ShoppingCart, DollarSign, Package, TrendingUp, Wallet, Settings } from 'lucide-react';

const SellerAccountPage = () => {
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
          trustScore: profile.trust || 0,
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
          totalRevenue: 0, 
          pendingOrders: 0, 
          productsListed: statsData.total_products || 0,
          totalSales: statsData.total_sales || 0,
          followers: statsData.followers || 0,
          trustPercentage: statsData.trust_percentage || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Please login as a seller to view your account
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Seller Profile Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-white text-green-500 bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-4">
              {sellerData.businessName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{sellerData.businessName}</h1>
              <p className="text-green-100">{sellerData.email}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm">Seller since {sellerData.joinDate}</span>
                <span className="text-sm">Trust Score: {sellerData.trustScore}/100</span>
                <span className="text-sm">{sellerData.followers} followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
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
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
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
                        <p className="text-gray-500 text-sm">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalSales}</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <ShoppingCart className="text-blue-600 w-5 h-5" />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>

                <SellerCard>
                  <SellerCardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Products Listed</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.productsListed}</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Package className="text-purple-600 w-5 h-5" />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>

                <SellerCard>
                  <SellerCardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Followers</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.followers}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="text-green-600 w-5 h-5" />
                      </div>
                    </div>
                  </SellerCardContent>
                </SellerCard>
              </div>

              {/* Business Performance (dummy for now) */}
              <SellerCard>
                <SellerCardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-black">Business Performance</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-black">Trust Score</h3>
                        <p className="text-sm text-gray-600">Seller reliability</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{stats.trustPercentage}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-black">Total Orders</h3>
                        <p className="text-sm text-gray-600">All time</p>
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
                <h2 className="text-lg font-semibold mb-4 text-black">Payment History</h2>
                <p className="text-gray-500">Payment data not available yet.</p>
              </SellerCardContent>
            </SellerCard>
          )}

          {activeTab === 'orders' && (
            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-black">Recent Orders</h2>
                <p className="text-gray-500">Order data not available yet.</p>
              </SellerCardContent>
            </SellerCard>
          )}
        </div>

        {/* Right Column - Business Info  */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-black">Business Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-black">{sellerData.businessName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-black">{sellerData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-black">{sellerData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-black">{sellerData.address}</span>
                  </div>
                </div>
                <button className="mt-4 flex items-center text-green-600 hover:text-green-700">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Business Info
                </button>
              </SellerCardContent>
            </SellerCard>

            <SellerCard>
              <SellerCardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-black">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Wallet className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-black">Withdraw Funds</h3>
                      <p className="text-sm text-gray-600">Transfer to bank account</p>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <TrendingUp className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-black">View Analytics</h3>
                      <p className="text-sm text-gray-600">Detailed performance report</p>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Settings className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-black">Account Settings</h3>
                      <p className="text-sm text-gray-600">Manage account preferences</p>
                    </div>
                  </button>
                </div>
              </SellerCardContent>
            </SellerCard>
          </div>
        )}
      </div>

      <style jsx>{`
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