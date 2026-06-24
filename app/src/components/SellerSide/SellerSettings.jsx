import { useState, useEffect } from 'react';
import { SellerCard, SellerCardContent } from './SellerCard';
import { 
  User, Moon, LogOut, Save, ArrowLeft, 
  Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Shield, Edit3, Bell,
  Globe, Smartphone, Palette, Key, AtSign, MapPin,
  Phone, FileText, Briefcase, Award, Sun,
  Users, UserPlus, LogIn, SwitchCamera, X,
  Chrome, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const SellerSettings = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useSellerDarkMode();  
  
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
    notifications: false,
    accounts: false
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
    profile_photo: null,
    user_id: null
  });

  // Account switching state
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [accountCreationStep, setAccountCreationStep] = useState('select');
  const [newAccountData, setNewAccountData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'seller'
  });
  const [accountErrors, setAccountErrors] = useState({});
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Load linked accounts from localStorage
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const saved = localStorage.getItem('linkedAccounts');
        if (saved) {
          const accounts = JSON.parse(saved);
          setLinkedAccounts(accounts);
          
          const active = accounts.find(acc => acc.isActive);
          if (active) {
            setActiveAccount(active);
          } else if (accounts.length > 0) {
            setActiveAccount(accounts[0]);
          }
        }
      } catch (e) {
        console.error('Error loading accounts:', e);
      }
    };
    loadAccounts();
  }, []);

  // Save linked accounts to localStorage
  const saveAccounts = (accounts) => {
    try {
      localStorage.setItem('linkedAccounts', JSON.stringify(accounts));
    } catch (e) {
      console.error('Error saving accounts:', e);
    }
  };

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
          
          const sellerData = response.data;
          
          // Get user ID from the response
          const userId = sellerData.user?.id || sellerData.user_id || Date.now();
          
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
            }),
            user_id: userId
          };
          
          setSellerInfo(sellerInfoData);
          
          // Add current account to linked accounts if not exists - ONLY ONCE
          const currentAccount = {
            id: userId,
            username: sellerData.username || sellerData.user?.username || '',
            email: sellerData.email || sellerData.user?.email || '',
            name: sellerInfoData.name,
            role: 'seller',
            isActive: true,
            avatar: sellerInfoData.name.split(' ').map(n => n[0]).join('').toUpperCase()
          };
          
          // Only update linked accounts on initial load or if the account doesn't exist
          if (isInitialLoad) {
            setLinkedAccounts(prev => {
              // Check if account already exists
              const exists = prev.some(acc => acc.id === currentAccount.id);
              if (!exists) {
                // If no account exists, add this one as active
                const newAccounts = [currentAccount];
                saveAccounts(newAccounts);
                return newAccounts;
              }
              // If account exists, make sure it's active and others are not
              const updated = prev.map(acc => ({
                ...acc,
                isActive: acc.id === currentAccount.id
              }));
              saveAccounts(updated);
              return updated;
            });
            setIsInitialLoad(false);
          }
          
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
        }
      } catch (error) {
        console.error('ERROR fetching seller profile:', error);
      } finally {
        setIsLoading(false);
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

  // Account switching functions
  const switchAccount = (accountId) => {
    const updated = linkedAccounts.map(acc => ({
      ...acc,
      isActive: acc.id === accountId
    }));
    setLinkedAccounts(updated);
    const active = updated.find(acc => acc.isActive);
    setActiveAccount(active);
    saveAccounts(updated);
    console.log('Switching to account:', active);
  };

  const removeAccount = (accountId) => {
    if (linkedAccounts.length <= 1) {
      alert('You must have at least one account linked.');
      return;
    }
    
    const updated = linkedAccounts.filter(acc => acc.id !== accountId);
    if (linkedAccounts.find(acc => acc.id === accountId)?.isActive) {
      updated[0].isActive = true;
      setActiveAccount(updated[0]);
    }
    setLinkedAccounts(updated);
    saveAccounts(updated);
  };

  const handleAddExistingAccount = async (credentials) => {
    setIsSubmittingAccount(true);
    setAccountErrors({});
    
    try {
      const response = await api.login(credentials.username, credentials.password);
      
      if (response.error) {
        setAccountErrors({ general: 'Invalid credentials. Please try again.' });
        return;
      }
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        
        // Check if account already exists in linked accounts
        const exists = linkedAccounts.some(acc => acc.id === user.id);
        if (exists) {
          setAccountErrors({ general: 'This account is already linked.' });
          return;
        }
        
        const newAccount = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.username,
          role: user.is_seller ? 'seller' : 'buyer',
          isActive: false,
          avatar: user.username.charAt(0).toUpperCase(),
          token: response.data.access
        };
        
        const updated = linkedAccounts.map(acc => ({ ...acc, isActive: false }));
        const newAccounts = [...updated, newAccount];
        setLinkedAccounts(newAccounts);
        saveAccounts(newAccounts);
        setActiveAccount(newAccount);
        setShowLoginModal(false);
        
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.is_seller ? 'seller' : 'buyer');
        window.dispatchEvent(new Event('authStateChanged'));
        window.location.reload();
      }
    } catch (error) {
      setAccountErrors({ general: 'Failed to add account. Please try again.' });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleCreateNewAccount = async (accountData) => {
    setIsSubmittingAccount(true);
    setAccountErrors({});
    
    try {
      const response = await api.register(
        {
          username: accountData.username,
          email: accountData.email,
          password: accountData.password,
          name: accountData.username,
        },
        accountData.role === 'seller'
      );
      
      if (response.error) {
        setAccountErrors({ general: 'Failed to create account. Please try again.' });
        return;
      }
      
      const loginResponse = await api.login(accountData.username, accountData.password);
      
      if (loginResponse.data && loginResponse.data.user) {
        const user = loginResponse.data.user;
        
        // Check if account already exists
        const exists = linkedAccounts.some(acc => acc.id === user.id);
        if (exists) {
          setAccountErrors({ general: 'This account is already linked.' });
          return;
        }
        
        const newAccount = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.username,
          role: accountData.role,
          isActive: false,
          avatar: user.username.charAt(0).toUpperCase(),
          token: loginResponse.data.access
        };
        
        const updated = linkedAccounts.map(acc => ({ ...acc, isActive: false }));
        const newAccounts = [...updated, newAccount];
        setLinkedAccounts(newAccounts);
        saveAccounts(newAccounts);
        setActiveAccount(newAccount);
        setShowCreateAccountModal(false);
        setAccountCreationStep('select');
        
        localStorage.setItem('accessToken', loginResponse.data.access);
        localStorage.setItem('access', loginResponse.data.access);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.is_seller ? 'seller' : 'buyer');
        window.dispatchEvent(new Event('authStateChanged'));
        window.location.reload();
      }
    } catch (error) {
      setAccountErrors({ general: 'Failed to create account. Please try again.' });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const validateNewAccount = () => {
    const errors = {};
    if (!newAccountData.username) errors.username = 'Username is required';
    if (!newAccountData.email) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(newAccountData.email)) errors.email = 'Invalid email format';
    if (newAccountData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (newAccountData.password !== newAccountData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
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
      
      const response = await api.updateSellerProfile(dataToSend);
      
      if (!response.error) {
        setSellerInfo(prev => ({
          ...prev,
          name: profileForm.name,
          location: profileForm.location || 'Not set',
          contact: profileForm.contact || 'Not provided',
          about: profileForm.about || 'No about info',
          nin_number: profileForm.nin_number || 'Not provided'
        }));
      } else {
        let errorMessage = 'Failed to update profile. ';
        if (response.data) {
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

  // Update active account when linkedAccounts changes
  useEffect(() => {
    if (linkedAccounts.length > 0) {
      const active = linkedAccounts.find(acc => acc.isActive);
      if (active) {
        setActiveAccount(active);
      }
    }
  }, [linkedAccounts]);

  if (isLoading) {
    return (
      <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading seller settings...</div>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same...
  // (The JSX return statement is unchanged from the previous version)
  // ... [the rest of the return JSX stays exactly the same]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className={`flex items-center mb-3 sm:mb-4 p-4 rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={() => navigate(-1)}
            className={`p-2 mr-4 rounded-lg transition-all ${isDarkMode 
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
              : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className={`text-[15px] sm:text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Settings</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-colors ${isDarkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Active Account Indicator */}
        {activeAccount && (
          <div className={`mb-4 rounded-xl p-3 flex items-center justify-between ${
            isDarkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                activeAccount.role === 'seller' ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                {activeAccount.avatar}
              </div>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {activeAccount.name}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeAccount.role === 'seller' ? 'Seller Account' : 'Buyer Account'} • {activeAccount.email}
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-200 text-green-800'
            }`}>
              Active
            </div>
          </div>
        )}

        {/* Seller Profile Header Card */}
        <div className={`mb-6 rounded-xl p-6 shadow-lg transition-colors ${isDarkMode 
          ? 'bg-gradient-to-r from-green-600 to-teal-700' 
          : 'bg-gradient-to-r from-green-500 to-teal-600'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-2 border-white text-white">
              {sellerInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{sellerInfo.name}</h2>
              <p className="text-white/80 text-sm">@{sellerInfo.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs">
                <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {sellerInfo.sales} Sales</span>
                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {sellerInfo.followers} Followers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Account Settings Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <button
              onClick={() => toggleGroup('account')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isDarkMode 
                ? 'hover:bg-gray-700 border-gray-700' 
                : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
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
                {/* Account Switching Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('accounts')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Linked Accounts ({linkedAccounts.length})
                      </span>
                    </div>
                    {expandedSections.accounts ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.accounts && (
                    <div className="mt-3 pl-7 space-y-3">
                      {/* List of linked accounts */}
                      {linkedAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            account.isActive
                              ? isDarkMode
                                ? 'bg-blue-900/30 border border-blue-700'
                                : 'bg-blue-50 border border-blue-200'
                              : isDarkMode
                                ? 'bg-gray-700/50 hover:bg-gray-700'
                                : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              account.role === 'seller' ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                              {account.avatar}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {account.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {account.role === 'seller' ? 'Seller' : 'Buyer'} • {account.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {account.isActive ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-200 text-green-800'
                              }`}>
                                Active
                              </span>
                            ) : (
                              <button
                                onClick={() => switchAccount(account.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isDarkMode
                                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                Switch
                              </button>
                            )}
                            <button
                              onClick={() => removeAccount(account.id)}
                              className={`p-1 rounded transition-colors ${
                                isDarkMode
                                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Remove account"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Account Buttons - Simplified rounded rectangles */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => {
                            setShowLoginModal(true);
                            setNewAccountData({ username: '', email: '', password: '' });
                          }}
                          className={`flex-1 py-3 px-4 rounded-full border-2 transition-all hover:scale-[1.02] text-center font-medium ${
                            isDarkMode
                              ? 'border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400'
                              : 'border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          Add Existing Account
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateAccountModal(true);
                            setNewAccountData({ username: '', email: '', password: '', confirmPassword: '', role: 'seller' });
                            setAccountCreationStep('select');
                          }}
                          className={`flex-1 py-3 px-4 rounded-full border-2 transition-all hover:scale-[1.02] text-center font-medium ${
                            isDarkMode
                              ? 'border-gray-600 hover:border-green-500 text-gray-300 hover:text-green-400'
                              : 'border-gray-300 hover:border-green-500 text-gray-600 hover:text-green-600'
                          }`}
                        >
                          Create New Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Section */}
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('profile')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Business Profile
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
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Business Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                              : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                            }`}
                            placeholder="Enter business name"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                          <input
                            type="text"
                            value={`@${sellerInfo.username}`}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDarkMode 
                              ? 'bg-gray-600 border-gray-600 text-gray-400' 
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                            disabled
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</label>
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          }`}
                          placeholder="Add your business location"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</label>
                        <input
                          type="tel"
                          value={profileForm.contact}
                          onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          }`}
                          placeholder="Add phone number"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>About Your Business</label>
                        <textarea
                          value={profileForm.about}
                          onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                          rows="3"
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          }`}
                          placeholder="Tell customers about your business..."
                        />
                      </div>
                      <button 
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
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
                        <div className={`p-2 rounded-lg text-xs flex items-center ${isDarkMode 
                          ? 'bg-green-900/30 border border-green-800 text-green-400' 
                          : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {emailSuccess}
                        </div>
                      )}
                      {emailErrors.general && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${isDarkMode 
                          ? 'bg-red-900/30 border border-red-800 text-red-400' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          {emailErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Email</label>
                        <input
                          type="email"
                          value={sellerInfo.email}
                          disabled
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${isDarkMode 
                            ? 'bg-gray-600 border-gray-600 text-gray-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Email</label>
                        <input
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          } ${emailErrors.newEmail ? 'border-red-500' : ''}`}
                          placeholder="Enter new email"
                        />
                        {emailErrors.newEmail && (
                          <p className="mt-1 text-xs text-red-600">{emailErrors.newEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Confirm Email</label>
                        <input
                          type="email"
                          value={emailForm.confirmEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          } ${emailErrors.confirmEmail ? 'border-red-500' : ''}`}
                          placeholder="Confirm new email"
                        />
                        {emailErrors.confirmEmail && (
                          <p className="mt-1 text-xs text-red-600">{emailErrors.confirmEmail}</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type={showEmailPassword ? 'text' : 'password'}
                            value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                              : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                            } ${emailErrors.password ? 'border-red-500' : ''}`}
                            placeholder="Enter password to verify"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
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
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {isSavingEmail ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  )}
                </div>

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
                        <div className={`p-2 rounded-lg text-xs flex items-center ${isDarkMode 
                          ? 'bg-green-900/30 border border-green-800 text-green-400' 
                          : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {passwordSuccess}
                        </div>
                      )}
                      {passwordErrors.general && (
                        <div className={`p-2 rounded-lg text-xs flex items-center ${isDarkMode 
                          ? 'bg-red-900/30 border border-red-800 text-red-400' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          {passwordErrors.general}
                        </div>
                      )}
                      
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${isDarkMode 
                              ? passwordErrors.currentPassword ? 'bg-gray-700 border-red-600 text-gray-100' : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500'
                              : passwordErrors.currentPassword ? 'bg-white border-red-300 text-black' : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${isDarkMode 
                              ? passwordErrors.newPassword ? 'bg-gray-700 border-red-600 text-gray-100' : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500'
                              : passwordErrors.newPassword ? 'bg-white border-red-300 text-black' : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                            }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className={`w-full px-3 py-2 text-sm rounded-lg pr-10 transition-colors border ${isDarkMode 
                              ? passwordErrors.confirmPassword ? 'bg-gray-700 border-red-600 text-gray-100' : 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500'
                              : passwordErrors.confirmPassword ? 'bg-white border-red-300 text-black' : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      {passwordForm.newPassword && (
                        <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Password Strength:
                            </span>
                            <span className={`text-xs font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className={`h-1 w-full rounded-full overflow-hidden mb-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
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
                        className={`mt-2 px-4 py-2 text-sm rounded-lg transition-colors ${isDarkMode 
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
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode 
                      ? 'bg-gray-700 text-gray-400' 
                      : 'bg-gray-100 text-gray-600'
                    }`}>Coming Soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business Information Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <button
              onClick={() => toggleGroup('business')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isDarkMode 
                ? 'hover:bg-gray-700 border-gray-700' 
                : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Briefcase className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                  Business Information
                </span>
              </div>
              {expandedGroups.business ? (
                <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </button>
            
            {expandedGroups.business && (
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                <div className="px-6 py-3">
                  <button
                    onClick={() => toggleSection('businessInfo')}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Business Details
                      </span>
                    </div>
                    {expandedSections.businessInfo ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                  
                  {expandedSections.businessInfo && (
                    <div className="mt-3 space-y-3 pl-7">
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>NIN Number</label>
                        <input
                          type="text"
                          value={profileForm.nin_number}
                          onChange={(e) => setProfileForm({ ...profileForm, nin_number: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors border ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                            : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
                          }`}
                          placeholder="Enter NIN number"
                        />
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Your National Identification Number (optional)</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Sales</p>
                          <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{sellerInfo.sales}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trust Score</p>
                          <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{sellerInfo.trust}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preferences Group */}
          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <button
              onClick={() => toggleGroup('preferences')}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isDarkMode 
                ? 'hover:bg-gray-700 border-gray-700' 
                : 'hover:bg-gray-50 border-gray-100'
              } border-b`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
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
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : ''}`} />
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
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Receive updates via email</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('emailNotifications')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${notificationSettings.emailNotifications ? 'bg-green-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${notificationSettings.emailNotifications ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order Alerts</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Get notified about new orders</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('orderAlerts')}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${notificationSettings.orderAlerts ? 'bg-green-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${notificationSettings.orderAlerts ? 'translate-x-5' : ''}`} />
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
                        className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-green-500' 
                          : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-green-500'
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
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors border ${isDarkMode 
              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border-red-800' 
              : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Add Existing Account Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowLoginModal(false)}>
          <div className={`rounded-2xl max-w-md w-full p-6 animate-scaleIn ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Add Existing Account</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to link another account</p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Google Login Option */}
              <button className={`w-full py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-blue-500 text-gray-200' 
                  : 'border-gray-300 hover:border-blue-500 text-gray-700'
              }`}>
                <Chrome className="w-6 h-6 text-blue-500" />
                <span className="font-medium">Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>or sign in with email</span>
                </div>
              </div>

              <input
                type="text"
                value={newAccountData.username}
                onChange={(e) => setNewAccountData({ ...newAccountData, username: e.target.value })}
                placeholder="Username or Email"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
              />
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={newAccountData.password}
                  onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors pr-12 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {accountErrors.general && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                  {accountErrors.general}
                </div>
              )}

              <button
                onClick={() => {
                  if (newAccountData.username && newAccountData.password) {
                    handleAddExistingAccount(newAccountData);
                  } else {
                    setAccountErrors({ general: 'Please enter your username and password' });
                  }
                }}
                disabled={isSubmittingAccount}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                {isSubmittingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowCreateAccountModal(false)}>
          <div className={`rounded-2xl max-w-md w-full p-6 animate-scaleIn ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {accountCreationStep === 'select' ? 'Create New Account' : 'Account Details'}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {accountCreationStep === 'select' ? 'Choose what type of account to create' : 'Enter your account information'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateAccountModal(false);
                  setAccountCreationStep('select');
                }}
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {accountCreationStep === 'select' ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setNewAccountData({ ...newAccountData, role: 'buyer' });
                    setAccountCreationStep('form');
                  }}
                  className={`w-full p-6 rounded-xl border-2 transition-all hover:scale-[1.02] text-left ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-blue-500 bg-gray-700/50' 
                      : 'border-gray-200 hover:border-blue-500 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                      <User className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Buyer Account</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shop and purchase products</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setNewAccountData({ ...newAccountData, role: 'seller' });
                    setAccountCreationStep('form');
                  }}
                  className={`w-full p-6 rounded-xl border-2 transition-all hover:scale-[1.02] text-left ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-purple-500 bg-gray-700/50' 
                      : 'border-gray-200 hover:border-purple-500 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                    }`}>
                      <Users className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Seller Account</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sell products and manage your store</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Account Type
                  </label>
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    newAccountData.role === 'seller'
                      ? isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                      : isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {newAccountData.role === 'seller' ? 'Seller Account' : 'Buyer Account'}
                  </div>
                </div>

                <input
                  type="text"
                  value={newAccountData.username}
                  onChange={(e) => setNewAccountData({ ...newAccountData, username: e.target.value })}
                  placeholder="Username *"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                />
                {accountErrors.username && (
                  <p className="text-xs text-red-500">{accountErrors.username}</p>
                )}

                <input
                  type="email"
                  value={newAccountData.email}
                  onChange={(e) => setNewAccountData({ ...newAccountData, email: e.target.value })}
                  placeholder="Email *"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                />
                {accountErrors.email && (
                  <p className="text-xs text-red-500">{accountErrors.email}</p>
                )}

                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={newAccountData.password}
                    onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                    placeholder="Password (min 8 chars) *"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors pr-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {accountErrors.password && (
                  <p className="text-xs text-red-500">{accountErrors.password}</p>
                )}

                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={newAccountData.confirmPassword}
                    onChange={(e) => setNewAccountData({ ...newAccountData, confirmPassword: e.target.value })}
                    placeholder="Confirm Password *"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors pr-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {accountErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{accountErrors.confirmPassword}</p>
                )}

                {accountErrors.general && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                    {accountErrors.general}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setAccountCreationStep('select')}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (validateNewAccount()) {
                        handleCreateNewAccount(newAccountData);
                      }
                    }}
                    disabled={isSubmittingAccount}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {isSubmittingAccount ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerSettings;