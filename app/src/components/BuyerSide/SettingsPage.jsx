// SettingsPage.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { 
  User, Moon, LogOut, Save, ArrowLeft, 
  Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Shield, Edit3, Bell,
  Globe, Smartphone, Palette, Key, AtSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useDarkMode } from '../../utils/DarkModeContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  
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
      console.log('1. Starting to fetch profile data...');
      
      try {
        console.log('2. Available tokens:', {
          accessToken: localStorage.getItem('accessToken') ? 'Present' : 'Missing',
          access: localStorage.getItem('access') ? 'Present' : 'Missing',
          refreshToken: localStorage.getItem('refreshToken') ? 'Present' : 'Missing',
          refresh: localStorage.getItem('refresh') ? 'Present' : 'Missing'
        });

        console.log('3. Making API calls to get buyer profile and verify token...');
        
        const buyerRes = await api.getBuyerProfile();
        console.log('4. Buyer profile response:', {
          status: buyerRes.status,
          hasError: buyerRes.error,
          errorMessage: buyerRes.message,
          data: buyerRes.data
        });

        const tokenRes = await api.verifyToken();
        console.log('5. Token verification response:', {
          status: tokenRes.status,
          hasError: tokenRes.error,
          errorMessage: tokenRes.message,
          data: tokenRes.data
        });

        if (buyerRes.data && tokenRes.data?.user) {
          console.log('6. Successfully received profile data');
          console.log('7. Buyer data:', buyerRes.data);
          console.log('8. User data from token:', tokenRes.data.user);
          
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
          
          console.log('9. Setting userInfo with:', userData);
          setUserInfo(userData);
          
          const profileData = {
            name: userData.name,
            phone: userData.phone === 'Not provided' ? '' : userData.phone,
            location: userData.location === 'Not set' ? '' : userData.location,
            bio: userData.bio === 'No location set' ? '' : userData.bio
          };
          console.log('10. Setting profileForm with:', profileData);
          setProfileForm(profileData);
          
          setEmailForm(prev => ({
            ...prev,
            newEmail: tokenRes.data.user.email || '',
            confirmEmail: tokenRes.data.user.email || ''
          }));
          console.log('11. Email form initialized with:', tokenRes.data.user.email);
        } else {
          console.log('6. Failed to get profile data');
          if (!buyerRes.data) console.log('   - buyerRes.data is missing');
          if (!tokenRes.data?.user) console.log('   - tokenRes.data.user is missing');
        }
      } catch (error) {
        console.error('12. ERROR fetching profile:', error);
        console.error('    Error details:', {
          message: error.message,
          stack: error.stack
        });
      } finally {
        setIsLoading(false);
        console.log('13. Profile fetch completed');
        console.log('========== FETCH PROFILE END ==========');
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
    console.log('========== VALIDATING EMAIL FORM ==========');
    console.log('Email form values:', {
      newEmail: emailForm.newEmail,
      confirmEmail: emailForm.confirmEmail,
      password: emailForm.password ? '[PRESENT]' : '[MISSING]'
    });
    
    const errors = {};
    
    if (!emailForm.newEmail) {
      errors.newEmail = 'New email is required';
      console.log('Validation failed: New email is required');
    } else if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) {
      errors.newEmail = 'Email is invalid';
      console.log('Validation failed: Email format is invalid');
    }
    
    if (!emailForm.confirmEmail) {
      errors.confirmEmail = 'Please confirm your email';
      console.log('Validation failed: Confirm email is required');
    } else if (emailForm.newEmail !== emailForm.confirmEmail) {
      errors.confirmEmail = 'Emails do not match';
      console.log('Validation failed: Emails do not match');
    }
    
    if (!emailForm.password) {
      errors.password = 'Password is required to verify your identity';
      console.log('Validation failed: Password is required');
    }
    
    setEmailErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Email form validation result:', isValid ? 'VALID' : 'INVALID');
    console.log('Errors:', errors);
    console.log('========== VALIDATION END ==========');
    
    return isValid;
  };

  const validatePasswordForm = () => {
    console.log('========== VALIDATING PASSWORD FORM ==========');
    console.log('Password form values:', {
      currentPassword: passwordForm.currentPassword ? '[PRESENT]' : '[MISSING]',
      newPassword: passwordForm.newPassword ? '[PRESENT]' : '[MISSING]',
      confirmPassword: passwordForm.confirmPassword ? '[PRESENT]' : '[MISSING]'
    });
    
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
      console.log('Validation failed: Current password is required');
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
      console.log('Validation failed: New password is required');
    } else {
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
        console.log('Validation failed: Password too short');
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      console.log('Validation failed: Confirm password is required');
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      console.log('Validation failed: Passwords do not match');
    }
    
    setPasswordErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Password form validation result:', isValid ? 'VALID' : 'INVALID');
    console.log('Errors:', errors);
    console.log('========== VALIDATION END ==========');
    
    return isValid;
  };

  const validateProfileForm = () => {
    console.log('========== VALIDATING PROFILE FORM ==========');
    console.log('Profile form values:', profileForm);
    
    const errors = {};
    if (!profileForm.name) {
      errors.name = 'Name is required';
      console.log('Validation failed: Name is required');
    }
    
    const isValid = Object.keys(errors).length === 0;
    console.log('Profile form validation result:', isValid ? 'VALID' : 'INVALID');
    console.log('Errors:', errors);
    console.log('========== VALIDATION END ==========');
    
    return isValid;
  };

  const handleEmailChange = async () => {
    console.log('========== EMAIL CHANGE ATTEMPT ==========');
    console.log('1. Starting email change process...');
    
    if (!validateEmailForm()) return;
    
    setIsSavingEmail(true);
    setEmailSuccess('');
    
    try {
      console.log('2. Preparing email change request with data:', {
        newEmail: emailForm.newEmail,
        passwordPresent: !!emailForm.password
      });
      
      console.log('3. Calling api.changeEmail()...');
      const response = await api.changeEmail(emailForm.newEmail, emailForm.password);
      
      console.log('4. Raw API response:', response);
      console.log('5. Response details:', {
        error: response.error,
        status: response.status,
        data: response.data,
        message: response.message
      });
      
      if (!response.error) {
        console.log('6. Email change SUCCESSFUL!');
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
            console.log('7. Updated user in localStorage:', user);
          } catch (e) {
            console.error('8. Failed to update user in localStorage:', e);
          }
        }
        
        console.log('9. Email update completed successfully');
        setTimeout(() => setEmailSuccess(''), 3000);
      } else if (response.status === 401) {
        console.log('6. Email change FAILED: Unauthorized - password may be incorrect');
        setEmailErrors({ password: response.data?.error || 'Current password is incorrect' });
      } else {
        console.log('6. Email change FAILED with status:', response.status);
        console.log('   Error data:', response.data);
        setEmailErrors({ general: response.data?.error || 'Failed to update email' });
      }
    } catch (error) {
      console.error('7. EXCEPTION in email change:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setEmailErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingEmail(false);
      console.log('8. Email change process completed');
      console.log('========== EMAIL CHANGE END ==========');
    }
  };

  const handlePasswordChange = async () => {
    console.log('========== PASSWORD CHANGE ATTEMPT ==========');
    console.log('1. Starting password change process...');
    
    if (!validatePasswordForm()) return;
    
    setIsSavingPassword(true);
    setPasswordSuccess('');
    
    try {
      console.log('2. Preparing password change request...');
      console.log('   Current password present:', !!passwordForm.currentPassword);
      console.log('   New password length:', passwordForm.newPassword.length);
      
      console.log('3. Calling api.changePassword()...');
      const response = await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      console.log('4. Raw API response:', response);
      console.log('5. Response details:', {
        error: response.error,
        status: response.status,
        data: response.data,
        message: response.message
      });
      
      if (!response.error) {
        console.log('6. Password change SUCCESSFUL!');
        setPasswordSuccess('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
        setTimeout(() => setPasswordSuccess(''), 3000);
        console.log('7. Password form cleared');
      } else if (response.status === 401) {
        console.log('6. Password change FAILED: Unauthorized - current password may be incorrect');
        setPasswordErrors({ currentPassword: response.data?.error || 'Current password is incorrect' });
      } else {
        console.log('6. Password change FAILED with status:', response.status);
        console.log('   Error data:', response.data);
        setPasswordErrors({ general: response.data?.error || 'Failed to update password' });
      }
    } catch (error) {
      console.error('7. EXCEPTION in password change:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setPasswordErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSavingPassword(false);
      console.log('8. Password change process completed');
      console.log('========== PASSWORD CHANGE END ==========');
    }
  };

  const handleProfileSave = async () => {
    console.log('========== PROFILE SAVE ATTEMPT ==========');
    console.log('1. Starting profile save process...');
    console.log('2. Profile form data:', profileForm);
    
    if (!validateProfileForm()) return;
    
    setIsSavingProfile(true);
    
    try {
      console.log('3. Calling API to update profile with:', profileForm);
      
      const response = await api.updateBuyerProfile({
        name: profileForm.name,
        contact: profileForm.phone,
        location: profileForm.location
      });
      
      console.log('4. API response:', response);
      
      if (!response.error) {
        console.log('5. Profile update SUCCESSFUL!');
        
        setUserInfo(prev => ({
          ...prev,
          name: profileForm.name,
          phone: profileForm.phone || 'Not provided',
          location: profileForm.location || 'Not set',
          bio: profileForm.location || 'No location set'
        }));
                
        console.log('6. Local state updated');
      } else {
        console.log('5. Profile update FAILED:', response);
        alert(`Failed to update profile: ${response.data?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('6. EXCEPTION in profile save:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
      console.log('7. Profile save process completed');
      console.log('========== PROFILE SAVE END ==========');
    }
  };
  
  const handleLogout = () => {
    console.log('========== LOGOUT ==========');
    console.log('Clearing all auth data from localStorage');
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Dispatch auth state changed event
    window.dispatchEvent(new Event('authStateChanged'));
    
    console.log('Redirecting to login page');
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
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-black">Loading settings...</div>
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
            <p className="text-[20px] sm:text-2xl font-bold text-black">Settings</p>
            <p className="text-sm text-gray-500">Manage your account preferences</p>
          </div>
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-2 border-white">
              {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userInfo.name}</h2>
              <p className="text-white/80 text-sm">@{userInfo.username}</p>
              <p className="text-white/60 text-xs mt-1">Member since {userInfo.memberSince}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('account')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
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
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('profile')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Profile Information</span>
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
                          <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => {
                              console.log('Profile: Name changed to:', e.target.value);
                              setProfileForm({ ...profileForm, name: e.target.value });
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Username</label>
                          <input
                            type="text"
                            value={`@${userInfo.username}`}
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
                          onChange={(e) => {
                            console.log('Profile: Location changed to:', e.target.value);
                            setProfileForm({ ...profileForm, location: e.target.value });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add your location"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => {
                            console.log('Profile: Phone changed to:', e.target.value);
                            setProfileForm({ ...profileForm, phone: e.target.value });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add phone number"
                        />
                      </div>
                      <button 
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  )}
                </div>

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
                          value={userInfo.email}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">New Email</label>
                        <input
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => {
                            console.log('Email: New email changed to:', e.target.value);
                            setEmailForm({ ...emailForm, newEmail: e.target.value });
                          }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                          onChange={(e) => {
                            console.log('Email: Confirm email changed to:', e.target.value);
                            setEmailForm({ ...emailForm, confirmEmail: e.target.value });
                          }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                            onChange={(e) => {
                              console.log('Email: Password field updated');
                              setEmailForm({ ...emailForm, password: e.target.value });
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              emailErrors.password ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter password to verify"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Email: Toggle password visibility');
                              setShowEmailPassword(!showEmailPassword);
                            }}
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
                        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                      >
                        {isSavingEmail ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup('security')}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
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
                            onChange={(e) => {
                              console.log('Password: Current password field updated');
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Password: Toggle current password visibility');
                              togglePasswordVisibility('current');
                            }}
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
                            onChange={(e) => {
                              console.log('Password: New password field updated, length:', e.target.value.length);
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              passwordErrors.newPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Password: Toggle new password visibility');
                              togglePasswordVisibility('new');
                            }}
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
                            onChange={(e) => {
                              console.log('Password: Confirm password field updated');
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg pr-10 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Password: Toggle confirm password visibility');
                              togglePasswordVisibility('confirm');
                            }}
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
                        className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                      >
                        {isSavingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>

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
                          onClick={toggleDarkMode}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            darkMode ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            darkMode ? 'translate-x-6' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                          onClick={() => {
                            console.log('Toggling email notifications');
                            toggleNotification('emailNotifications');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                            notificationSettings.emailNotifications ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">Push Notifications</p>
                          <p className="text-xs text-gray-500">Browser push notifications</p>
                        </div>
                        <button
                          onClick={() => {
                            console.log('Toggling push notifications');
                            toggleNotification('pushNotifications');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-300'
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
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          ring: 2px solid #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;