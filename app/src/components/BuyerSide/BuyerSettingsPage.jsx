import { useState, useEffect } from 'react';
import { BuyerCard, BuyerCardContent } from './BuyerCard';
import { 
  User, Moon, LogOut, Save, ArrowLeft, 
  Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Shield, Edit3, Bell,
  Globe, Smartphone, Palette, Key, AtSign, Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const [expandedGroups, setExpandedGroups] = useState({
    account: true,
    security: false,
    preferences: false
  });
  
  const [expandedSections, setExpandedSections] = useState({
    profile: false,
    email: false,
    password: false,
    appearance: false,
    notifications: false,
    language: false
  });
  
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    bio: '',
    username: '',
    memberSince: '',
    location: ''
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
    password: ''
  });
  const [emailErrors, setEmailErrors] = useState({});
  const [emailSuccess, setEmailSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    marketingEmails: true
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      console.log('========== FETCHING PROFILE ==========');
      
      try {
        const buyerRes = await api.getBuyerProfile();
        const tokenRes = await api.verifyToken();

        if (buyerRes.data && tokenRes.data?.user) {
          const userData = {
            name: buyerRes.data.name || tokenRes.data.user.username || 'User',
            email: tokenRes.data.user.email || 'No email',
            username: tokenRes.data.user.username || '',
            phone: buyerRes.data.contact || 'Not provided',
            bio: buyerRes.data.location || 'No location set',
            location: buyerRes.data.location || 'Not set',
            memberSince: new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })
          };
          
          setUserInfo(userData);
          
          setProfileForm({
            name: userData.name,
            phone: userData.phone === 'Not provided' ? '' : userData.phone,
            location: userData.location === 'Not set' ? '' : userData.location,
            bio: userData.bio === 'No location set' ? '' : userData.bio
          });
          
          setEmailForm(prev => ({
            ...prev,
            newEmail: tokenRes.data.user.email || '',
            confirmEmail: tokenRes.data.user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const password = passwordForm.newPassword;
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [passwordForm.newPassword]);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateEmailForm = () => {
    const errors = {};
    
    if (!emailForm.newEmail) {
      errors.newEmail = 'New email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) {
      errors.newEmail = 'Email is invalid';
    }
    
    if (!emailForm.confirmEmail) {
      errors.confirmEmail = 'Please confirm your email';
    } else if (emailForm.newEmail !== emailForm.confirmEmail) {
      errors.confirmEmail = 'Emails do not match';
    }
    
    if (!emailForm.password) {
      errors.password = 'Password is required to verify your identity';
    }
    
    setEmailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileForm.name) {
      errors.name = 'Name is required';
    }
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = async () => {
    if (!validateEmailForm()) return;
    
    setIsSavingEmail(true);
    setEmailSuccess('');
    
    try {
      const response = await api.changeEmail(emailForm.newEmail, emailForm.password);
      
      if (!response.error) {
        setEmailSuccess('Email updated successfully!');
        setEmailForm(prev => ({ ...prev, password: '' }));
        setEmailErrors({});
        setUserInfo(prev => ({ ...prev, email: emailForm.newEmail }));
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.email = emailForm.newEmail;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Failed to update user in localStorage:', e);
          }
        }
        
        setTimeout(() => setEmailSuccess(''), 3000);
      } else if (response.status === 401) {
        setEmailErrors({ password: response.data?.error || 'Current password is incorrect' });
      } else {
        setEmailErrors({ general: response.data?.error || 'Failed to update email' });
      }
    } catch (error) {
      console.error('Error changing email:', error);
      setEmailErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;
    
    setIsSavingPassword(true);
    setPasswordSuccess('');
    
    try {
      const response = await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (!response.error) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else if (response.status === 401) {
        setPasswordErrors({ currentPassword: response.data?.error || 'Current password is incorrect' });
      } else {
        setPasswordErrors({ general: response.data?.error || 'Failed to update password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleProfileSave = async () => {
    if (!validateProfileForm()) return;
    
    setIsSavingProfile(true);
    
    try {
      const response = await api.updateBuyerProfile({
        name: profileForm.name,
        contact: profileForm.phone,
        location: profileForm.location
      });
      
      if (!response.error) {
        setUserInfo(prev => ({
          ...prev,
          name: profileForm.name,
          phone: profileForm.phone || 'Not provided',
          location: profileForm.location || 'Not set',
          bio: profileForm.location || 'No location set'
        }));
      } else {
        alert(`Failed to update profile: ${response.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
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
    window.location.href = '/login';
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
  };

  const toggleNotification = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className={`flex items-center mb-6 sm:mb-8 p-4 rounded-xl shadow-sm transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <button
            onClick={() => navigate(-1)}
            className={`p-2 mr-4 rounded-lg transition-all ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className={`text-[20px] sm:text-2xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-black'
            }`}>Settings</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Manage your account preferences</p>
          </div>
          {/* Dark mode toggle button */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-colors ${
              isDarkMode 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Profile Header Card */}
        <div className={`mb-6 rounded-xl p-6 shadow-lg transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-600 to-purple-700' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-2 border-white text-white">
              {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{userInfo.name}</h2>
              <p className="text-white/80 text-sm">@{userInfo.username}</p>
              <p className="text-white/60 text-xs mt-1">Member since {userInfo.memberSince}</p>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-4">
          {/* Account Settings Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => toggleGroup('account')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 border-gray-700' 
                  : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <User className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                  Account Settings
                </span>
              </div>
              {expandedGroups.account ? (
                <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </button>
            
            {expandedGroups.account && (
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {/* Profile Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('profile')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Profile Information
                      </span>
                    </div>
                    {expandedSections.profile ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.profile && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Full Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500' 
                                : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                            } border`}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Username</label>
                          <input
                            type="text"
                            value={`@${userInfo.username}`}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-600 text-gray-400' 
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                            disabled
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Location</label>
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500' 
                              : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                          } border`}
                          placeholder="Add your location"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500' 
                              : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                          } border`}
                          placeholder="Add phone number"
                        />
                      </div>
                      <button 
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Email Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('email')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email Address
                      </span>
                    </div>
                    {expandedSections.email ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.email && (
                    <div className="mt-3 space-y-3 pl-7">
                      {emailSuccess && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${
                          isDarkMode 
                            ? 'bg-green-900/30 border border-green-800 text-green-400' 
                            : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {emailSuccess}
                        </div>
                      )}
                      {emailErrors.general && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${
                          isDarkMode 
                            ? 'bg-red-900/30 border border-red-800 text-red-400' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          {emailErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Current Email</label>
                        <input
                          type="email"
                          value={userInfo.email}
                          disabled
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-600 border-gray-600 text-gray-400' 
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>New Email</label>
                        <input
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${
                            isDarkMode 
                              ? emailErrors.newEmail 
                                ? 'bg-gray-700 border-red-600 text-gray-100' 
                                : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                              : emailErrors.newEmail 
                                ? 'bg-white border-red-300 text-black' 
                                : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                          }`}
                          placeholder="Enter new email"
                        />
                        {emailErrors.newEmail && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailErrors.newEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Confirm Email</label>
                        <input
                          type="email"
                          value={emailForm.confirmEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${
                            isDarkMode 
                              ? emailErrors.confirmEmail 
                                ? 'bg-gray-700 border-red-600 text-gray-100' 
                                : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                              : emailErrors.confirmEmail 
                                ? 'bg-white border-red-300 text-black' 
                                : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                          }`}
                          placeholder="Confirm new email"
                        />
                        {emailErrors.confirmEmail && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailErrors.confirmEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type={showEmailPassword ? 'text' : 'password'}
                            value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${
                              isDarkMode 
                                ? emailErrors.password 
                                  ? 'bg-gray-700 border-red-600 text-gray-100' 
                                  : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                                : emailErrors.password 
                                  ? 'bg-white border-red-300 text-black' 
                                  : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                            }`}
                            placeholder="Enter password to verify"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                              isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {emailErrors.password && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailErrors.password}</p>
                        )}
                      </div>
                      <button
                        onClick={handleEmailChange}
                        disabled={isSavingEmail}
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {isSavingEmail ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => toggleGroup('security')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 border-gray-700' 
                  : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <Shield className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                  Security
                </span>
              </div>
              {expandedGroups.security ? (
                <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </button>
            
            {expandedGroups.security && (
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {/* Password Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('password')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Key className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Change Password
                      </span>
                    </div>
                    {expandedSections.password ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.password && (
                    <div className="mt-3 space-y-3 pl-7">
                      {passwordSuccess && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${
                          isDarkMode 
                            ? 'bg-green-900/30 border border-green-800 text-green-400' 
                            : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {passwordSuccess}
                        </div>
                      )}
                      {passwordErrors.general && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${
                          isDarkMode 
                            ? 'bg-red-900/30 border border-red-800 text-red-400' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          {passwordErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${
                              isDarkMode 
                                ? passwordErrors.currentPassword 
                                  ? 'bg-gray-700 border-red-600 text-gray-100' 
                                  : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                                : passwordErrors.currentPassword 
                                  ? 'bg-white border-red-300 text-black' 
                                  : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                              isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${
                              isDarkMode 
                                ? passwordErrors.newPassword 
                                  ? 'bg-gray-700 border-red-600 text-gray-100' 
                                  : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                                : passwordErrors.newPassword 
                                  ? 'bg-white border-red-300 text-black' 
                                  : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                            }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                              isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-xs mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${
                              isDarkMode 
                                ? passwordErrors.confirmPassword 
                                  ? 'bg-gray-700 border-red-600 text-gray-100' 
                                  : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500'
                                : passwordErrors.confirmPassword 
                                  ? 'bg-white border-red-300 text-black' 
                                  : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                              isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      {passwordForm.newPassword && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Password Strength:
                            </span>
                            <span className={`text-xs font-medium ${
                              getPasswordStrengthColor().replace('bg-', 'text-')
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className={`h-1 w-full rounded-full overflow-hidden mb-2 ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <div 
                              className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                              style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <div className="flex items-center">
                              {passwordStrength.hasMinLength ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>8+ chars</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasUpperCase ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Uppercase</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasLowerCase ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Lowercase</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasNumber ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Number</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handlePasswordChange}
                        disabled={isSavingPassword}
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {isSavingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2FA Section */}
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Shield className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Two-Factor Authentication
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>Coming Soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferences Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => toggleGroup('preferences')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 border-gray-700' 
                  : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Palette className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                  Preferences
                </span>
              </div>
              {expandedGroups.preferences ? (
                <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </button>
            
            {expandedGroups.preferences && (
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {/* Appearance Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('appearance')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? (
                        <Sun className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      ) : (
                        <Moon className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Appearance
                      </span>
                    </div>
                    {expandedSections.appearance ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.appearance && (
                    <div className="mt-3 pl-7">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dark Mode</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Switch between light and dark themes
                          </p>
                        </div>
                        <button
                          onClick={toggleDarkMode}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            isDarkMode ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            isDarkMode ? 'translate-x-6' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('notifications')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Notifications
                      </span>
                    </div>
                    {expandedSections.notifications ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.notifications && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Notifications</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Receive updates via email
                          </p>
                        </div>
                        <button
                          onClick={() => toggleNotification('emailNotifications')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            notificationSettings.emailNotifications 
                              ? 'bg-blue-600' 
                              : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.emailNotifications ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Push Notifications</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Browser push notifications
                          </p>
                        </div>
                        <button
                          onClick={() => toggleNotification('pushNotifications')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            notificationSettings.pushNotifications 
                              ? 'bg-blue-600' 
                              : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.pushNotifications ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Language Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('language')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Language & Region
                      </span>
                    </div>
                    {expandedSections.language ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.language && (
                    <div className="mt-3 pl-7">
                      <select 
                        onChange={(e) => console.log('Language changed to:', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-blue-500'
                        }`}
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>French</option>
                        <option>Spanish</option>
                      </select>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        More languages coming soon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors border ${
              isDarkMode 
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border-red-800' 
                : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;