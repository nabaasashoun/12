import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Camera, Check, ChevronDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

// East African country codes
const EAST_AFRICAN_COUNTRIES = [
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
];

// ── Validation Functions ──────────────────────────────────────────────────────

const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Full name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { valid: true, message: '' };
};

const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Email address is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address (e.g., name@example.com)' };
  }
  return { valid: true, message: '' };
};

const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }
  if (!/^\d{7,9}$/.test(phone.trim())) {
    return { valid: false, message: 'Phone number must be 7-9 digits' };
  }
  return { valid: true, message: '' };
};

const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: '' };
};

const validateDateOfBirth = (dob) => {
  if (!dob) {
    return { valid: true, message: '' }; // Optional field
  }
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    // Age calculation
  }
  if (age < 13) {
    return { valid: false, message: 'You must be at least 13 years old' };
  }
  if (age > 120) {
    return { valid: false, message: 'Please enter a valid date of birth' };
  }
  return { valid: true, message: '' };
};

// ── Animated Input with Validation ──────────────────────────────────────────

const AnimatedInput = ({ 
  type, 
  name, 
  value, 
  onChange, 
  label, 
  required, 
  autoComplete, 
  validation,
  onBlur,
  ...props 
}) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const labelChars = label.split('').map((char, index) => (
    <span key={index} style={{ transitionDelay: `${index * 50}ms` }}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  const handleBlur = (e) => {
    setIsTouched(true);
    if (validation) {
      const result = validation(value);
      setIsValid(result.valid);
      setErrorMessage(result.message);
    }
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    setIsTouched(true);
    if (validation) {
      const result = validation(e.target.value);
      setIsValid(result.valid);
      setErrorMessage(result.message);
    }
    onChange(e);
  };

  return (
    <StyledInputWrapper>
      <div className="form-control">
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          autoComplete={autoComplete}
          className={isTouched ? (isValid ? 'valid' : 'invalid') : ''}
          {...props}
        />
        <label>{labelChars}</label>
        {required && <span className="required-star">*</span>}
      </div>
      {isTouched && !isValid && errorMessage && (
        <div className="validation-error">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
      {isTouched && isValid && value && value.length > 0 && (
        <div className="validation-success">
          <CheckCircle size={14} />
          <span>Valid</span>
        </div>
      )}
    </StyledInputWrapper>
  );
};

const StyledInputWrapper = styled.div`
  .form-control {
    position: relative;
    margin: 20px 0 10px;
    width: 100%;
  }

  .form-control input {
    background-color: transparent;
    border: 0;
    border-bottom: 2px #ccc solid;
    display: block;
    width: 100%;
    padding: 12px 0 6px;
    font-size: 16px;
    color: #333;
    transition: border-color 0.3s;
  }

  .form-control input:-webkit-autofill,
  .form-control input:-webkit-autofill:hover,
  .form-control input:-webkit-autofill:focus,
  .form-control input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #333 !important;
    caret-color: #333;
    outline: none;
  }

  .form-control input:focus {
    outline: 0;
    border-bottom-color: #3b82f6;
  }

  .form-control input.valid {
    border-bottom-color: #22c55e;
  }

  .form-control input.invalid {
    border-bottom-color: #ef4444;
  }

  .form-control input:focus + label span,
  .form-control input:valid + label span,
  .form-control input:-webkit-autofill + label span {
    color: #3b82f6;
    transform: translateY(-24px);
  }

  .form-control input.valid + label span {
    color: #22c55e;
  }

  .form-control input.invalid + label span {
    color: #ef4444;
  }

  .form-control label {
    position: absolute;
    top: 12px;
    left: 0;
    pointer-events: none;
  }

  .form-control label span {
    display: inline-block;
    font-size: 16px;
    min-width: 5px;
    color: #666;
    transition: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .required-star {
    position: absolute;
    top: 12px;
    right: -8px;
    color: #ef4444;
    font-size: 18px;
  }

  .validation-error {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
    animation: slideDown 0.3s ease-out;
  }

  .validation-success {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #22c55e;
    font-size: 12px;
    margin-top: 4px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ── Validation Summary Component ──────────────────────────────────────────

const ValidationSummary = ({ errors, isVisible }) => {
  if (!isVisible || errors.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium text-sm">Please fix the following issues:</p>
          <ul className="mt-1 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-600 text-sm flex items-start gap-1">
                <span className="text-red-400">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ── Main RegisterPage ──────────────────────────────────────────────────────

const RegisterPage = ({ setIsAuthenticated, setUserRole }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(EAST_AFRICAN_COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    buyerName: '',
    buyerLocation: '',
    buyerContact: '',
    buyerDoB: '',
    buyerEmail: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: true
  });

  // Validation functions for each field
  const nameValidation = (value) => validateName(value);
  const emailValidation = (value) => validateEmail(value);
  const phoneValidation = (value) => validatePhone(value);
  const passwordValidation = (value) => validatePassword(value);
  const confirmPasswordValidation = (value) => validateConfirmPassword(formData.password, value);
  const dobValidation = (value) => validateDateOfBirth(value);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation summary when user types
    setShowValidationSummary(false);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, buyerContact: value }));
    setShowValidationSummary(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const selectCountry = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
  };

  // Validate all fields
  const validateForm = () => {
    const errors = [];

    const nameResult = validateName(formData.buyerName);
    if (!nameResult.valid) errors.push(nameResult.message);

    const emailResult = validateEmail(formData.buyerEmail);
    if (!emailResult.valid) errors.push(emailResult.message);

    const phoneResult = validatePhone(formData.buyerContact);
    if (!phoneResult.valid) errors.push(phoneResult.message);

    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.valid) errors.push(passwordResult.message);

    const confirmResult = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmResult.valid) errors.push(confirmResult.message);

    const dobResult = validateDateOfBirth(formData.buyerDoB);
    if (!dobResult.valid) errors.push(dobResult.message);

    if (!formData.acceptTerms) {
      errors.push('You must accept the terms and conditions');
    }

    setValidationErrors(errors);
    setShowValidationSummary(true);

    if (errors.length > 0) {
      // Show first error as toast
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top to show validation summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('username', formData.buyerEmail);
    data.append('email', formData.buyerEmail);
    data.append('password', formData.password);
    data.append('name', formData.buyerName);
    data.append('location', formData.buyerLocation);
    
    const formattedPhone = `${selectedCountry.code} ${selectedCountry.dialCode} ${formData.buyerContact}`;
    data.append('contact', formattedPhone);
    
    data.append('dob', formData.buyerDoB);
    if (profilePhoto) {
      data.append('profile_photo', profilePhoto);
    }

    try {
      const response = await fetch('/api/register/buyer/', {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        toast.success('Account created successfully! Redirecting...');
        
        const loginResponse = await fetch('/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.buyerEmail, password: formData.password }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('accessToken', loginData.access);
          localStorage.setItem('userRole', 'buyer');
          
          setIsAuthenticated(true);
          setUserRole('buyer');
          
          const firstName = formData.buyerName.split(' ')[0];
          toast.success(`Welcome, ${firstName}!`);
          setTimeout(() => navigate('/'), 500);
        } else {
          toast.warning('Registration successful, but auto-login failed. Please login manually.');
          setTimeout(() => navigate('/login'), 500);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.non_field_errors?.[0] || 
                           errorData.email?.[0] ||
                           errorData.username?.[0] ||
                           'Registration failed. Please check your details.';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="h-48 relative overflow-hidden">
        <img
          src="https://csspicker.dev/api/image/?q=modern+architecture+purple&image_type=photo"
          alt="Header"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative px-6 pt-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Hello!</h1>
          <p className="text-gray-400 text-lg mb-8">Create your buyer account</p>

          {/* Validation Summary */}
          <ValidationSummary errors={validationErrors} isVisible={showValidationSummary} />

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden mb-2 bg-gray-50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG or PNG</p>
                </div>

                <AnimatedInput
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleInputChange}
                  label="Full Name"
                  required
                  autoComplete="off"
                  validation={nameValidation}
                />

                <AnimatedInput
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleInputChange}
                  label="Email"
                  required
                  autoComplete="off"
                  validation={emailValidation}
                />

                {/* Phone Input with Country Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <div className="flex">
                    <div className="relative mr-1">
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="h-[35px] px-3 text-black bg-gray-50 border border-gray-300 rounded-l-lg flex items-center gap-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <span className="text-sm">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                        <ChevronDown size={16} className="text-gray-500" />
                      </button>

                      {isCountryDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsCountryDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                            {EAST_AFRICAN_COUNTRIES.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => selectCountry(country)}
                                className="w-full text-black px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="flex-1">
                                  <span className="font-medium">{country.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">{country.dialCode}</span>
                                </span>
                                {selectedCountry.code === country.code && (
                                  <Check size={16} className="text-indigo-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <input
                      type="tel"
                      name="buyerContact"
                      value={formData.buyerContact}
                      onChange={handlePhoneChange}
                      placeholder="701 234 567"
                      className={`flex-1 h-[35px] text-black px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        formData.buyerContact && formData.buyerContact.length > 0
                          ? /^\d{7,9}$/.test(formData.buyerContact)
                            ? 'border-green-500'
                            : 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      autoComplete="off"
                      required
                    />
                  </div>
                  {formData.buyerContact && formData.buyerContact.length > 0 && !/^\d{7,9}$/.test(formData.buyerContact) && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Phone number must be 7-9 digits
                    </p>
                  )}
                </div>

                <AnimatedInput
                  type="date"
                  name="buyerDoB"
                  value={formData.buyerDoB}
                  onChange={handleInputChange}
                  label="Date of Birth"
                  autoComplete="off"
                  validation={dobValidation}
                />

                <AnimatedInput
                  type="text"
                  name="buyerLocation"
                  value={formData.buyerLocation}
                  onChange={handleInputChange}
                  label="Location"
                  autoComplete="off"
                />

                <div className="relative">
                  <AnimatedInput
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    label="Password"
                    required
                    autoComplete="new-password"
                    validation={passwordValidation}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    style={{ top: 'calc(50% - 4px)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <AnimatedInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    label="Confirm Password"
                    required
                    autoComplete="new-password"
                    validation={confirmPasswordValidation}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    style={{ top: 'calc(50% - 4px)' }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="sr-only"
                    required
                  />
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                      formData.acceptTerms ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                    }`}
                  >
                    {formData.acceptTerms && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="ml-3 text-sm text-gray-600">
                    I accept the <a href="#" className="text-indigo-600 hover:underline">terms and conditions</a> *
                  </span>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                      formData.subscribeNewsletter ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                    }`}
                  >
                    {formData.subscribeNewsletter && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="ml-3 text-sm text-gray-600">
                    Subscribe to receive exclusive offers and updates
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Are you a seller?{' '}
                    <Link to="/seller/register" className="text-green-600 font-medium hover:underline">
                      Register as Seller
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick />
    </div>
  );
};

export default RegisterPage;