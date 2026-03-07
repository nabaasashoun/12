import { useState, useEffect } from 'react';
import { Card, CardContent } from '../BuyerSide/card';
import { 
  User, Moon, LogOut, Save, ArrowLeft, 
  Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Shield, Edit3, Bell,
  Globe, Smartphone, Palette, Key, AtSign, MapPin,
  Phone, FileText, Briefcase, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const SellerSettings = () => {
  const navigate = useNavigate();
  
  const [expandedGroups, setExpandedGroups] = useState({
    account: true,
    security: false,
    business: false,
    preferences: false
  });
  
  const [expandedSections, setExpandedSections] = useState({
    profile: false,
    email: false,
    password: false,
    businessInfo: false,
    appearance: false,
    notifications: false
  });
  
  const [sellerInfo, setSellerInfo] = useState({
    name: 'Loading...',
    email: '',
    username: '',
    location: '',
    contact: '',
    about: '',
    nin_number: '',
    sales: 0,
    trust: 0,
    followers: 0,
    memberSince: '',
    profile_photo: null
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    location: '',
    contact: '',
    about: '',
    nin_number: ''
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
    orderAlerts: true,
    marketingEmails: false
  });

  useEffect(() => {
    const fetchSellerProfile = async () => {
      setIsLoading(true);
      console.log('========== FETCHING SELLER PROFILE ==========');
      
      try {
        console.log('Making API call to get seller profile...');
        const response = await api.getSellerProfile();
        
        console.log('Seller profile response:', response);

        if (!response.error && response.data) {
          console.log('Successfully received seller profile data');
          console.log('Raw response data:', response.data);
          
          // Check the structure of the response
          const sellerData = response.data;
          
          // Extract data based on the actual response structure
          const sellerInfoData = {
            name: sellerData.name || 'Seller',
            email: sellerData.email || sellerData.user?.email || 'No email',
            username: sellerData.username || sellerData.user?.username || '',
            location: sellerData.location || 'Not set',
            contact: sellerData.contact || 'Not provided',
            about: sellerData.about || 'No about info',
            nin_number: sellerData.nin_number || 'Not provided',
            sales: sellerData.sales || 0,
            trust: sellerData.trust || 0,
            followers: sellerData.followers || 0,
            profile_photo: sellerData.profile_photo || null,
            memberSince: new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })
          };
          
          console.log('Processed sellerInfo:', sellerInfoData);
          setSellerInfo(sellerInfoData);
          
          // Set profile form with current values
          setProfileForm({
            name: sellerInfoData.name,
            location: sellerInfoData.location === 'Not set' ? '' : sellerInfoData.location,
            contact: sellerInfoData.contact === 'Not provided' ? '' : sellerInfoData.contact,
            about: sellerInfoData.about === 'No about info' ? '' : sellerInfoData.about,
            nin_number: sellerInfoData.nin_number === 'Not provided' ? '' : sellerInfoData.nin_number
          });
          
          setEmailForm(prev => ({
            ...prev,
            newEmail: sellerInfoData.email,
            confirmEmail: sellerInfoData.email
          }));
        } else {
          console.log('Failed to get seller profile data');
          if (response.data) {
            console.log('Error details:', response.data);
          }
        }
      } catch (error) {
        console.error('ERROR fetching seller profile:', error);
      } finally {
        setIsLoading(false);
        console.log('========== FETCH PROFILE END ==========');
      }
    };
    
    fetchSellerProfile();
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
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
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
      errors.name = 'Business name is required';
    }
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = async () => {
    console.log('========== EMAIL CHANGE ATTEMPT ==========');
    
    if (!validateEmailForm()) return;
    
    setIsSavingEmail(true);
    setEmailSuccess('');
    
    try {
      const response = await api.changeEmail(emailForm.newEmail, emailForm.password);
      
      if (!response.error) {
        setEmailSuccess('Email updated successfully!');
        setEmailForm(prev => ({ ...prev, password: '' }));
        setEmailErrors({});
        setSellerInfo(prev => ({ ...prev, email: emailForm.newEmail }));
        
        setTimeout(() => setEmailSuccess(''), 3000);
      } else if (response.status === 401) {
        setEmailErrors({ password: response.data?.error || 'Current password is incorrect' });
      } else {
        setEmailErrors({ general: response.data?.error || 'Failed to update email' });
      }
    } catch (error) {
      console.error('Error in email change:', error);
      setEmailErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    console.log('========== PASSWORD CHANGE ATTEMPT ==========');
    
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
      console.error('Error in password change:', error);
      setPasswordErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingPassword(false);
    }
  };


  const handleProfileSave = async () => {
    console.log('========== PROFILE SAVE ATTEMPT ==========');
    console.log('Current profile form data:', profileForm);
    
    if (!validateProfileForm()) return;
    
    setIsSavingProfile(true);
    
    try {
      const dataToSend = {
        name: profileForm.name,
        location: profileForm.location || '',
        contact: profileForm.contact || '',
        about: profileForm.about || '',
        nin_number: profileForm.nin_number || ''
      };
      
      console.log('Data to send to backend:', dataToSend);
      
      const response = await api.updateSellerProfile(dataToSend);
      
      console.log('Profile update response:', response);
      
      if (!response.error) {
        // Update was successful
        setSellerInfo(prev => ({
          ...prev,
          name: profileForm.name,
          location: profileForm.location || 'Not set',
          contact: profileForm.contact || 'Not provided',
          about: profileForm.about || 'No about info',
          nin_number: profileForm.nin_number || 'Not provided'
        }));
      } else {
        // Show more detailed error
        console.error('Profile update failed:', response);
        
        let errorMessage = 'Failed to update profile. ';
        if (response.data) {
          // Display validation errors from Django
          if (typeof response.data === 'object') {
            const errors = Object.entries(response.data)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            errorMessage += errors;
          } else {
            errorMessage += response.data.error || 'Unknown error';
          }
        }
        
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('Error in profile save:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const handleLogout = () => {
    console.log('========== LOGOUT ==========');
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    window.location.href = '/seller/login';
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
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-black">Loading seller settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6 sm:mb-8 bg-white p-4 rounded-xl shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="p-2 mr-4 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[20px] sm:text-2xl font-bold text-black">Seller Settings</p>
            <p className="text-sm text-gray-500">Manage your seller account and business</p>
          </div>
        </div>

        {/* Seller Profile Header */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-2 border-white">
              {sellerInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{sellerInfo.name}</h2>
              <p className="text-white/80 text-sm">@{sellerInfo.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs">
                <span className="flex items-center"><Award className="w-3 h-3 mr-1" /> {sellerInfo.trust}% Trust</span>
                <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {sellerInfo.sales} Sales</span>
                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {sellerInfo.followers} Followers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Account Settings Group */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('account')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold text-black">Account Settings</span>
              </div>
              {expandedGroups.account ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedGroups.account && (
              <div className="divide-y divide-gray-100">
                {/* Profile Information Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('profile')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Business Profile</span>
                    </div>
                    {expandedSections.profile ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.profile && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Business Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter business name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Username</label>
                          <input
                            type="text"
                            value={`@${sellerInfo.username}`}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black bg-gray-50"
                            disabled
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Location</label>
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Add your business location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={profileForm.contact}
                          onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Add phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">About Your Business</label>
                        <textarea
                          value={profileForm.about}
                          onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                          rows="3"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Tell customers about your business..."
                        />
                      </div>
                      
                      <button 
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                        className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
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
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Email Address</span>
                    </div>
                    {expandedSections.email ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.email && (
                    <div className="mt-3 space-y-3 pl-7">
                      {emailSuccess && (
                        <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {emailSuccess}
                        </div>
                      )}
                      {emailErrors.general && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          {emailErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Current Email</label>
                        <input
                          type="email"
                          value={sellerInfo.email}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">New Email</label>
                        <input
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm border rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            emailErrors.newEmail ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Enter new email"
                        />
                        {emailErrors.newEmail && (
                          <p className="mt-1 text-xs text-red-600">{emailErrors.newEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Confirm Email</label>
                        <input
                          type="email"
                          value={emailForm.confirmEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm border rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            emailErrors.confirmEmail ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Confirm new email"
                        />
                        {emailErrors.confirmEmail && (
                          <p className="mt-1 text-xs text-red-600">{emailErrors.confirmEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type={showEmailPassword ? 'text' : 'password'}
                            value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              emailErrors.password ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter password to verify"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {emailErrors.password && (
                          <p className="mt-1 text-xs text-red-600">{emailErrors.password}</p>
                        )}
                      </div>
                      <button
                        onClick={handleEmailChange}
                        disabled={isSavingEmail}
                        className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                      >
                        {isSavingEmail ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Business Information Group */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('business')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-black">Business Information</span>
              </div>
              {expandedGroups.business ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedGroups.business && (
              <div className="divide-y divide-gray-100">
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('businessInfo')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Business Details</span>
                    </div>
                    {expandedSections.businessInfo ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.businessInfo && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">NIN Number</label>
                        <input
                          type="text"
                          value={profileForm.nin_number}
                          onChange={(e) => setProfileForm({ ...profileForm, nin_number: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter NIN number"
                        />
                        <p className="text-xs text-gray-400 mt-1">Your National Identification Number (optional)</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Total Sales</p>
                          <p className="text-lg font-semibold text-black">{sellerInfo.sales}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Trust Score</p>
                          <p className="text-lg font-semibold text-black">{sellerInfo.trust}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security Group */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('security')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-semibold text-black">Security</span>
              </div>
              {expandedGroups.security ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedGroups.security && (
              <div className="divide-y divide-gray-100">
                {/* Password Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('password')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Key className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Change Password</span>
                    </div>
                    {expandedSections.password ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.password && (
                    <div className="mt-3 space-y-3 pl-7">
                      {passwordSuccess && (
                        <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {passwordSuccess}
                        </div>
                      )}
                      {passwordErrors.general && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          {passwordErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              passwordErrors.newPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                              passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      {passwordForm.newPassword && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Password Strength:</span>
                            <span className={`text-xs font-medium ${
                              getPasswordStrengthColor().replace('bg-', 'text-')
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
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
                              <span className="text-gray-600">8+ chars</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasUpperCase ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className="text-gray-600">Uppercase</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasLowerCase ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className="text-gray-600">Lowercase</span>
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasNumber ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <span className="text-gray-600">Number</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handlePasswordChange}
                        disabled={isSavingPassword}
                        className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
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
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferences Group */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('preferences')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold text-black">Preferences</span>
              </div>
              {expandedGroups.preferences ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedGroups.preferences && (
              <div className="divide-y divide-gray-100">
                {/* Appearance Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('appearance')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Moon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Appearance</span>
                    </div>
                    {expandedSections.appearance ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.appearance && (
                    <div className="mt-3 pl-7">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">Dark Mode</p>
                          <p className="text-xs text-gray-500">Switch between light and dark themes</p>
                        </div>
                        <button
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            false ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            false ? 'translate-x-6' : ''
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
                      <Bell className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Notifications</span>
                    </div>
                    {expandedSections.notifications ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.notifications && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">Email Notifications</p>
                          <p className="text-xs text-gray-500">Receive updates via email</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('emailNotifications')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            notificationSettings.emailNotifications ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.emailNotifications ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">Order Alerts</p>
                          <p className="text-xs text-gray-500">Get notified about new orders</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('orderAlerts')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            notificationSettings.orderAlerts ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.orderAlerts ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">SMS Notifications</p>
                          <p className="text-xs text-gray-500">Receive text message alerts</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('smsNotifications')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            notificationSettings.smsNotifications ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.smsNotifications ? 'translate-x-5' : ''
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
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Language & Region</span>
                    </div>
                    {expandedSections.language ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSections.language && (
                    <div className="mt-3 pl-7">
                      <select 
                        onChange={(e) => console.log('Language changed to:', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>French</option>
                        <option>Spanish</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">More languages coming soon</p>
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
            className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 py-3 px-4 rounded-xl transition-colors border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        input, textarea, select {
          color: black !important;
        }
        input::placeholder, textarea::placeholder {
          color: #9ca3af;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          ring: 2px solid #10b981;
        }
      `}</style>
    </div>
  );
};

export default SellerSettings;