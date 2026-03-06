import { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { User, Moon, LogOut, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useDarkMode } from '../../utils/DarkModeContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();   
  // Real buyer profile from backend
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    bio: ''
  });

  // Fetch real buyer data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const buyerRes = await api.getBuyerProfile();
        const tokenRes = await api.verifyToken();

        if (buyerRes.data && tokenRes.data?.user) {
          setUserInfo({
            name: buyerRes.data.name || tokenRes.data.user.username || 'User',
            email: tokenRes.data.user.email || 'No email',
            phone: buyerRes.data.contact || 'Not provided',
            bio: buyerRes.data.location || 'No location set'
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveChanges = () => {
    // Here you can save other settings (not dark mode, it's already auto-saved by context)
    alert('Settings saved successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header with Back Icon */}
      <div className="flex items-center mb-6 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-4 text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <p className="text-[20px] sm:text-[20px] font-bold mb-2 text-black">Settings</p>
          <p className="text-sm sm:text-base text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Profile Card – real backend data */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                {userInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-black text-lg sm:text-xl">{userInfo.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base">{userInfo.email}</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">{userInfo.bio}</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Edit Profile
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-black">
            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
            Account Settings
          </h2>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-black text-sm sm:text-base">Personal Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Update your personal details</p>
                </div>
                <div className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appearance */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-black">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
            Appearance
          </h2>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Moon className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="font-medium text-black text-sm sm:text-base">Dark Mode</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Toggle dark theme across the app</p>
                </div>
                <button
                  onClick={toggleDarkMode}   // 👈 use context toggle
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors duration-200 ${
                    darkMode ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transform transition-transform duration-200 ${
                    darkMode ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleSaveChanges}
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center text-red-600 hover:text-red-700 py-2 px-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors duration-200 flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;