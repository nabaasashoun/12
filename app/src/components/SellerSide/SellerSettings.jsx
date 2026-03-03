import { Card, CardContent } from '../BuyerSide/card';
import { User, Shield, Bell, CreditCard, HelpCircle, LogOut, Moon, Globe, Eye, MessageSquare, Smartphone, Mail, Lock, Save } from 'lucide-react';
import { useState } from 'react';

const SellerSettings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'en',
    privacyProfile: 'public',
    twoFactorAuth: false,
    activityStatus: true,
    autoPlayVideos: false,
    dataSaver: true
  });

  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    bio: 'Digital enthusiast and tech lover'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveChanges = () => {
    alert('Settings saved successfully!');
  };

  const settingsCategories = [
    {
      title: "Account Settings",
      icon: User,
      items: [
        { 
          title: "Personal Information", 
          description: "Update your personal details",
          type: 'info',
          key: 'userInfo'
        },
        { 
          title: "Change Password", 
          description: "Update your account password",
          type: 'password',
          icon: Lock
        },
        { 
          title: "Two-Factor Authentication", 
          description: "Add an extra layer of security",
          type: 'toggle',
          key: 'twoFactorAuth'
        },
        { 
          title: "Email Notifications", 
          description: "Receive email alerts and newsletters",
          type: 'toggle',
          key: 'emailNotifications',
          icon: Mail
        },
      ]
    },
    {
      title: "Privacy & Safety",
      icon: Shield,
      items: [
        { 
          title: "Privacy Settings", 
          description: "Control your privacy preferences",
          type: 'select',
          options: [
            { value: 'public', label: 'Public' },
            { value: 'friends', label: 'Friends Only' },
            { value: 'private', label: 'Private' }
          ],
          key: 'privacyProfile'
        },
        { 
          title: "Show Activity Status", 
          description: "Let others see when you're online",
          type: 'toggle',
          key: 'activityStatus',
          icon: Eye
        },
        { 
          title: "Data Saver", 
          description: "Reduce data usage",
          type: 'toggle',
          key: 'dataSaver',
          icon: Smartphone
        },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { 
          title: "Push Notifications", 
          description: "Receive push notifications",
          type: 'toggle',
          key: 'notifications'
        },
        { 
          title: "SMS Notifications", 
          description: "Receive text message notifications",
          type: 'toggle',
          key: 'smsNotifications',
          icon: MessageSquare
        },
      ]
    },
    {
      title: "Appearance",
      icon: Moon,
      items: [
        { 
          title: "Dark Mode", 
          description: "Toggle dark theme",
          type: 'toggle',
          key: 'darkMode'
        },
        { 
          title: "Language", 
          description: "Change app language",
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' }
          ],
          key: 'language'
        },
      ]
    },
    {
      title: "Payment & Billing",
      icon: CreditCard,
      items: [
        { 
          title: "Payment Methods", 
          description: "Manage your payment options",
          type: 'link'
        },
        { 
          title: "Billing History", 
          description: "View your transaction history",
          type: 'link'
        },
        { 
          title: "Auto-play Videos", 
          description: "Automatically play videos in feed",
          type: 'toggle',
          key: 'autoPlayVideos'
        },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <p className="text-[20px] sm:text-[20px] font-bold mb-2 text-black">Settings</p>
        <p className="text-sm sm:text-base text-gray-600">Manage your account settings and preferences</p>
      </div>
      
      <div className="space-y-6">
        {/* User Profile Card */}
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

        {/* Settings Categories */}
        {settingsCategories.map((category, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-black">
              <category.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
              {category.title}
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {category.items.map((item, itemIndex) => (
                <Card key={itemIndex} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          {item.icon && <item.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />}
                          <h3 className="font-medium text-black text-sm sm:text-base">{item.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                      </div>
                      
                      {item.type === 'toggle' && (
                        <button
                          onClick={() => handleSettingChange(item.key, !settings[item.key])}
                          className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors duration-200 ${
                            settings[item.key] ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transform transition-transform duration-200 ${
                            settings[item.key] ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      )}
                      
                      {item.type === 'select' && (
                        <select
                          value={settings[item.key]}
                          onChange={(e) => handleSettingChange(item.key, e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white"
                        >
                          {item.options.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {item.type === 'link' && (
                        <div className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
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
          
          <button className="flex items-center justify-center text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-200 flex-1">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Support
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

export default SellerSettings;