// SellerRegisterPage.jsx - Fully updated with real-time validation and warnings
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Eye, EyeOff, Upload, CheckCircle, XCircle, ChevronDown, 
  Check, Camera, X, RotateCw, MapPin, AlertCircle, 
  AlertTriangle, Info, User, Mail, Lock, Building, Phone, 
  FileText, CreditCard, Banknote, Smartphone, Home 
} from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ── East African Country Codes ────────────────────────────────────────────

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

// ── Validation Functions ──────────────────────────────────────────────────

const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, message: 'Username is required' };
  }
  if (username.trim().length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' };
  }
  if (username.trim().length > 30) {
    return { valid: false, message: 'Username must be less than 30 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  if (/^[0-9]/.test(username.trim())) {
    return { valid: false, message: 'Username cannot start with a number' };
  }
  return { valid: true, message: 'Username available ✓' };
};

const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Email address is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address (e.g., name@example.com)' };
  }
  const domain = email.split('@')[1];
  if (domain && domain.length > 0) {
    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
      return { valid: false, message: 'Please enter a valid email address with a proper domain' };
    }
  }
  return { valid: true, message: 'Email looks good ✓' };
};

const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (password.length > 50) {
    return { valid: false, message: 'Password must be less than 50 characters' };
  }
  const errors = [];
  if (!/[A-Z]/.test(password)) errors.push('uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('special character');
  
  if (errors.length > 0) {
    return { 
      valid: false, 
      message: `Password must contain at least one ${errors.join(', ')}`,
      strength: 'weak'
    };
  }
  
  if (password.length >= 8 && errors.length === 0) {
    return { valid: true, message: 'Strong password ✓', strength: 'strong' };
  }
  return { valid: true, message: 'Good password ✓', strength: 'good' };
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: 'Passwords match ✓' };
};

const validateBusinessName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Business name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Business name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { valid: false, message: 'Business name must be less than 100 characters' };
  }
  if (!/^[a-zA-Z0-9\s\-&.,']+$/.test(name.trim())) {
    return { valid: false, message: 'Business name contains invalid characters' };
  }
  return { valid: true, message: 'Business name looks good ✓' };
};

const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }
  if (!/^\d{7,9}$/.test(phone.trim())) {
    return { valid: false, message: 'Phone number must be 7-9 digits' };
  }
  return { valid: true, message: 'Phone number looks good ✓' };
};

const validateNIN = (nin) => {
  if (!nin || nin.trim().length === 0) {
    return { valid: true, message: 'Optional' };
  }
  if (nin.trim().length < 10) {
    return { valid: false, message: 'NIN must be at least 10 characters' };
  }
  if (!/^[A-Z0-9]{10,}$/.test(nin.trim().toUpperCase())) {
    return { valid: false, message: 'NIN should contain only letters and numbers' };
  }
  return { valid: true, message: 'NIN format looks good ✓' };
};

const validateBankAccount = (account) => {
  if (!account || account.trim().length === 0) {
    return { valid: false, message: 'Bank account number is required' };
  }
  if (!/^\d{8,}$/.test(account.trim())) {
    return { valid: false, message: 'Bank account must be at least 8 digits' };
  }
  if (account.trim().length > 20) {
    return { valid: false, message: 'Bank account must be less than 20 digits' };
  }
  return { valid: true, message: 'Account number looks good ✓' };
};

const validateCardLastFour = (card) => {
  if (!card || card.trim().length === 0) {
    return { valid: false, message: 'Last 4 digits of card are required' };
  }
  if (!/^\d{4}$/.test(card.trim())) {
    return { valid: false, message: 'Please enter exactly 4 digits' };
  }
  return { valid: true, message: '✓' };
};

const validateMobileNumber = (number) => {
  if (!number || number.trim().length === 0) {
    return { valid: false, message: 'Mobile number is required' };
  }
  if (!/^\d{7,9}$/.test(number.trim())) {
    return { valid: false, message: 'Mobile number must be 7-9 digits' };
  }
  return { valid: true, message: '✓' };
};

// ── Animated Input with Validation ──────────────────────────────────────

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
  icon: Icon,
  placeholder,
  ...props 
}) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

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
      if (result.strength) setShowStrength(true);
    }
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    setIsTouched(true);
    if (validation) {
      const result = validation(e.target.value);
      setIsValid(result.valid);
      setErrorMessage(result.message);
      if (result.strength) setShowStrength(true);
    }
    onChange(e);
  };

  const getStrengthColor = () => {
    if (!showStrength || !value) return '';
    if (errorMessage.includes('Strong')) return 'text-green-500';
    if (errorMessage.includes('Good')) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <StyledInputWrapper>
      <div className="form-control">
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
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
          <span>{errorMessage || '✓'}</span>
        </div>
      )}
      {type === 'password' && value && value.length > 0 && (
        <div className="password-strength">
          <div className={`strength-bar ${getStrengthColor()}`} style={{ width: `${Math.min(100, (value.length / 10) * 100)}%` }} />
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
    padding: 12px 0 6px 32px;
    font-size: 16px;
    color: #333;
    transition: border-color 0.3s;
  }

  .input-icon {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    transition: color 0.3s;
  }

  .form-control input:focus + label + .input-icon,
  .form-control input:focus ~ .input-icon {
    color: #3b82f6;
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
    left: 32px;
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

  .password-strength {
    margin-top: 4px;
    height: 2px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .strength-bar {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 4px;
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

// ── Validation Summary ────────────────────────────────────────────────────

const ValidationSummary = ({ errors, isVisible, onClose }) => {
  if (!isVisible || errors.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown relative">
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium text-sm">Please fix the following issues to continue:</p>
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

// ── Camera Capture Component ─────────────────────────────────────────────

const CameraCapture = ({ onCapture, onClose, documentType }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setStream(null);
      setIsCameraReady(false);
      if (window.activeCameraStream) window.activeCameraStream = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      stopCamera();
      const constraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, torch: false },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      window.activeCameraStream = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setError("");
      setIsCameraReady(true);
    } catch (err) {
      setError("Could not access camera. Please make sure you have granted camera permissions.");
      setIsCameraReady(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], `${documentType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        setTimeout(() => onCapture(file), 150);
      }, 'image/jpeg', 0.85);
    }
  };

  const toggleCamera = () => setFacingMode(prev => prev === "environment" ? "user" : "environment");

  const handleClose = () => {
    stopCamera();
    setTimeout(() => onClose(), 150);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera size={20} />
          Take {documentType === 'passport' ? 'Passport' : 'ID'} Photo
        </h3>
        <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-full">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={startCamera} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">Try Again</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain" onLoadedMetadata={() => setIsCameraReady(true)} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-indigo-400 rounded-lg w-4/5 h-3/5 opacity-50"></div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {isCameraReady && !error && (
        <div className="bg-gray-900 p-6 flex justify-center gap-6">
          <button onClick={toggleCamera} className="p-4 bg-gray-700 rounded-full hover:bg-gray-600"><RotateCw size={24} className="text-white" /></button>
          <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full hover:bg-gray-200 flex items-center justify-center border-4 border-indigo-400"><div className="w-12 h-12 bg-indigo-600 rounded-full"></div></button>
          <div className="w-16"></div>
        </div>
      )}
      <div className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>Position your {documentType === 'passport' ? 'passport' : 'ID'} clearly within the frame and tap the capture button</p>
      </div>
    </div>
  );
};

// ── Main SellerRegisterPage ──────────────────────────────────────────────

const SellerRegisterPage = ({ setIsAuthenticated, setUserRole }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    contact: "",
    nin_number: "",
    about: "",
    profile_photo: null,
    passport_photo: null,
    id_photo: null,
    locationType: "",
    locationLat: null,
    locationLng: null,
    locationAddress: "",
    paymentMethod: "",
    bankName: "",
    bankAccount: "",
    cardLastFour: "",
    mobileProvider: "",
    mobileNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    profile_photo: false,
    passport_photo: false,
    id_photo: false
  });
  const [selectedCountry, setSelectedCountry] = useState(EAST_AFRICAN_COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFor, setCameraFor] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  
  const navigate = useNavigate();

  // ── Reverse Geocode ─────────────────────────────────────────────────────

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      if (data && data.address) {
        const { road, suburb, village, town, city, county, state, district, country } = data.address;
        const area = suburb || village || town || city || road || '';
        const districtName = district || county || state || '';
        if (area && districtName) {
          return `${area}, ${districtName}`;
        } else if (area) {
          return area;
        } else if (districtName) {
          return districtName;
        }
        return data.display_name.split(',')[0];
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // ── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (window.activeCameraStream) {
        window.activeCameraStream.getTracks().forEach(track => track.stop());
        window.activeCameraStream = null;
      }
    };
  }, []);

  const forceStopCamera = () => {
    if (window.activeCameraStream) {
      window.activeCameraStream.getTracks().forEach(track => track.stop());
      window.activeCameraStream = null;
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowValidationSummary(false);
    setError("");
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, contact: value }));
    setShowValidationSummary(false);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setFormData(prev => ({ ...prev, [name]: file }));
      setUploadStatus(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleCameraCapture = (file) => {
    const fieldName = cameraFor === 'passport' ? 'passport_photo' : 'id_photo';
    setFormData(prev => ({ ...prev, [fieldName]: file }));
    setUploadStatus(prev => ({ ...prev, [fieldName]: true }));
    setShowCamera(false);
    setCameraFor(null);
    setTimeout(forceStopCamera, 200);
    toast.success(`${cameraFor === 'passport' ? 'Passport' : 'ID'} photo captured successfully!`);
  };

  const openCamera = (type) => {
    setCameraFor(type);
    setShowCamera(true);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
    setCameraFor(null);
    forceStopCamera();
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const selectCountry = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
  };

  // ── Geolocation ─────────────────────────────────────────────────────────

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    toast.info("Fetching your location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        setFormData(prev => ({
          ...prev,
          locationLat: latitude,
          locationLng: longitude,
          locationAddress: address
        }));
        setManualAddress(address);
        setAddressConfirmed(false);
        setLocationLoading(false);
        toast.success("Location captured successfully!");
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please check permissions.");
        setLocationLoading(false);
        toast.error("Unable to retrieve your location. Please check permissions.");
        console.error("Geolocation error:", error);
      }
    );
  };

  // ── Document Upload Status ─────────────────────────────────────────────

  const allDocumentsUploaded = () => {
    return uploadStatus.profile_photo && uploadStatus.passport_photo && uploadStatus.id_photo;
  };

  // ── Validation ──────────────────────────────────────────────────────────

  const validateSellerForm = () => {
    const errors = [];

    if (step === 1) {
      const usernameResult = validateUsername(formData.username);
      if (!usernameResult.valid) errors.push(`Username: ${usernameResult.message}`);
      
      const emailResult = validateEmail(formData.email);
      if (!emailResult.valid) errors.push(`Email: ${emailResult.message}`);
      
      const passwordResult = validatePassword(formData.password);
      if (!passwordResult.valid) errors.push(`Password: ${passwordResult.message}`);
      
      const confirmResult = validateConfirmPassword(formData.password, formData.confirmPassword);
      if (!confirmResult.valid) errors.push(`Confirm Password: ${confirmResult.message}`);
    }

    if (step === 2) {
      const businessResult = validateBusinessName(formData.name);
      if (!businessResult.valid) errors.push(`Business Name: ${businessResult.message}`);
      
      const phoneResult = validatePhone(formData.contact);
      if (!phoneResult.valid) errors.push(`Phone Number: ${phoneResult.message}`);
      
      const ninResult = validateNIN(formData.nin_number);
      if (!ninResult.valid) errors.push(`NIN: ${ninResult.message}`);
    }

    if (step === 3) {
      if (!allDocumentsUploaded()) {
        errors.push('All documents must be uploaded: Profile Photo, Passport Photo, and ID Photo');
      }
    }

    if (step === 4) {
      if (!formData.locationType) {
        errors.push('Please select a business location type (Static or Dynamic)');
      }
      if (!formData.locationLat || !formData.locationLng) {
        errors.push('Please fetch your location using the "Get My Current Location" button');
      }
      if (!addressConfirmed) {
        errors.push('Please confirm your location address');
      }
      if (!formData.paymentMethod) {
        errors.push('Please select a payment method');
      }
      if (formData.paymentMethod === 'bank') {
        if (!formData.bankName) errors.push('Bank name is required');
        const bankResult = validateBankAccount(formData.bankAccount);
        if (!bankResult.valid) errors.push(`Bank Account: ${bankResult.message}`);
      }
      if (formData.paymentMethod === 'card') {
        const cardResult = validateCardLastFour(formData.cardLastFour);
        if (!cardResult.valid) errors.push(`Card: ${cardResult.message}`);
      }
      if (formData.paymentMethod === 'mobile_money') {
        if (!formData.mobileProvider) errors.push('Mobile money provider is required');
        const mobileResult = validateMobileNumber(formData.mobileNumber);
        if (!mobileResult.valid) errors.push(`Mobile Number: ${mobileResult.message}`);
      }
    }

    setValidationErrors(errors);
    setShowValidationSummary(true);

    if (errors.length > 0) {
      toast.error(`Please fix ${errors.length} issue${errors.length > 1 ? 's' : ''}`);
      return false;
    }
    return true;
  };

  // ── Navigation ──────────────────────────────────────────────────────────

  const nextStep = () => {
    if (validateSellerForm()) {
      setError("");
      setStep(step + 1);
      setShowValidationSummary(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
    setShowValidationSummary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateSellerForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    forceStopCamera();
    setLoading(true);

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("name", formData.name);
    const formattedPhone = `${selectedCountry.code} ${selectedCountry.dialCode} ${formData.contact}`;
    data.append("contact", formattedPhone);
    if (formData.nin_number) data.append("nin_number", formData.nin_number);
    if (formData.about) data.append("about", formData.about);
    
    data.append("location_type", formData.locationType);
    data.append("location_lat", formData.locationLat);
    data.append("location_lng", formData.locationLng);
    data.append("location_address", formData.locationAddress);
    
    data.append("payment_method", formData.paymentMethod);
    if (formData.paymentMethod === 'bank') {
      data.append("bank_name", formData.bankName);
      data.append("bank_account", formData.bankAccount);
    } else if (formData.paymentMethod === 'card') {
      data.append("card_last_four", formData.cardLastFour);
    } else if (formData.paymentMethod === 'mobile_money') {
      data.append("mobile_provider", formData.mobileProvider);
      data.append("mobile_number", formData.mobileNumber);
    }
    
    data.append("profile_photo", formData.profile_photo);
    data.append("passport_photo", formData.passport_photo);
    data.append("id_photo", formData.id_photo);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/seller/`, {
        method: "POST",
        body: data,
      });

      const responseData = await response.json();

      if (response.ok) {
        forceStopCamera();
        toast.success("Seller account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/seller/login", {
            state: { success: "Seller account created successfully! Please login." }
          });
        }, 1500);
      } else {
        console.error("Registration error:", responseData);
        const errorMsg = responseData.detail || 
                        responseData.error || 
                        responseData.message || 
                        responseData.non_field_errors?.[0] ||
                        "Registration failed. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error. Please check if the backend server is running.");
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
          documentType={cameraFor}
        />
      )}

      <div className="h-48 relative overflow-hidden">
        <img
          src="https://csspicker.dev/api/image/?q=modern+architecture+purple&image_type=photo"
          alt="Header"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative px-6 pt-8 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Hello!</h1>
        <p className="text-gray-400 text-lg mb-6">Create a seller account</p>

        {/* Step indicator */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === i
                    ? 'bg-indigo-500 text-white'
                    : step > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > i ? <Check size={16} /> : i}
              </div>
              {i < 4 && (
                <div
                  className={`w-12 h-1 mx-1 transition-colors ${
                    step > i ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-6 px-1">
          <span className={step === 1 ? 'text-indigo-600 font-medium' : ''}>Account</span>
          <span className={step === 2 ? 'text-indigo-600 font-medium' : ''}>Business</span>
          <span className={step === 3 ? 'text-indigo-600 font-medium' : ''}>Documents</span>
          <span className={step === 4 ? 'text-indigo-600 font-medium' : ''}>Location & Payment</span>
        </div>

        {/* Validation Summary */}
        <ValidationSummary 
          errors={validationErrors} 
          isVisible={showValidationSummary}
          onClose={() => setShowValidationSummary(false)}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slideDown">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
          {/* Step 1: Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <AnimatedInput
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                label="Username"
                required
                autoComplete="off"
                icon={User}
                validation={validateUsername}
                
              />

              <AnimatedInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                label="Email address"
                required
                autoComplete="off"
                icon={Mail}
                validation={validateEmail}
               
              />

              <div className="relative">
                <AnimatedInput
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  label="Password"
                  required
                  autoComplete="new-password"
                  icon={Lock}
                  validation={validatePassword}
                  
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
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
                  onChange={handleChange}
                  label="Confirm Password"
                  required
                  autoComplete="new-password"
                  icon={Lock}
                  validation={(value) => validateConfirmPassword(formData.password, value)}
                  
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  style={{ top: 'calc(50% - 4px)' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-4">
              <AnimatedInput
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                label="Business Name"
                required
                autoComplete="off"
                icon={Building}
                validation={validateBusinessName}
               
              />

              {/* Phone Input */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
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
                        <div className="fixed inset-0 z-10" onClick={() => setIsCountryDropdownOpen(false)} />
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
                              {selectedCountry.code === country.code && <Check size={16} className="text-indigo-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handlePhoneChange}
                    placeholder="701 234 567"
                    className={`flex-1 h-[35px] text-black px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formData.contact && formData.contact.length > 0
                        ? /^\d{7,9}$/.test(formData.contact)
                          ? 'border-green-500'
                          : 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    autoComplete="off"
                    required
                  />
                </div>
                {formData.contact && formData.contact.length > 0 && !/^\d{7,9}$/.test(formData.contact) && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Phone number must be 7-9 digits
                  </p>
                )}
                {formData.contact && /^\d{7,9}$/.test(formData.contact) && (
                  <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Valid phone number format
                  </p>
                )}
              </div>

              <AnimatedInput
                type="text"
                name="nin_number"
                value={formData.nin_number}
                onChange={handleChange}
                label="NIN Number (optional)"
                autoComplete="off"
                icon={FileText}
                validation={validateNIN}
                placeholder="e.g., CM1234567890"
              />

              <AnimatedInput
                type="text"
                name="about"
                value={formData.about}
                onChange={handleChange}
                label="About your business (optional)"
                autoComplete="off"
                icon={Info}
                placeholder="Tell buyers about your business..."
              />
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Camera size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 text-sm font-medium">Document verification required</p>
                    <p className="text-blue-600 text-xs mt-1">Use camera to take clear photos of your documents</p>
                  </div>
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  uploadStatus.profile_photo ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <input
                    name="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploadStatus.profile_photo ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-400 flex-shrink-0" />
                  )}
                </div>
                {uploadStatus.profile_photo && (
                  <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Profile photo uploaded
                  </p>
                )}
              </div>

              {/* Passport Photo */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Passport Photo <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2 flex items-center gap-1"><Camera size={12} /> Camera only</span>
                </label>
                {!uploadStatus.passport_photo ? (
                  <button 
                    type="button" 
                    onClick={() => openCamera('passport')} 
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center gap-2"
                  >
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Click to open camera and take passport photo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex-1 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <span className="text-sm text-green-700">Passport photo captured</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => openCamera('passport')} 
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* ID Photo */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  ID Photo <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2 flex items-center gap-1"><Camera size={12} /> Camera only</span>
                </label>
                {!uploadStatus.id_photo ? (
                  <button 
                    type="button" 
                    onClick={() => openCamera('id')} 
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center gap-2"
                  >
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Click to open camera and take ID photo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex-1 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <span className="text-sm text-green-700">ID photo captured</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => openCamera('id')} 
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Profile Photo:</span>
                    {uploadStatus.profile_photo ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">Uploaded <CheckCircle size={12} /></span>
                    ) : (
                      <span className="text-xs text-red-500">Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Passport Photo:</span>
                    {uploadStatus.passport_photo ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">Captured <CheckCircle size={12} /></span>
                    ) : (
                      <span className="text-xs text-red-500">Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">ID Photo:</span>
                    {uploadStatus.id_photo ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">Captured <CheckCircle size={12} /></span>
                    ) : (
                      <span className="text-xs text-red-500">Pending</span>
                    )}
                  </div>
                </div>
                {allDocumentsUploaded() && (
                  <div className="mt-3 p-2 bg-green-100 rounded-lg animate-pulse">
                    <p className="text-xs text-green-700 text-center font-medium flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> All documents uploaded!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Location & Payment */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Location Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Location Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.locationType === 'static' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="locationType"
                      value="static"
                      checked={formData.locationType === 'static'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <div>
                      <span className="text-black font-medium">Static Seller</span>
                      <p className="text-xs text-gray-500">Fixed shop or office location</p>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.locationType === 'dynamic' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="locationType"
                      value="dynamic"
                      checked={formData.locationType === 'dynamic'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <div>
                      <span className="text-black font-medium">Dynamic Seller</span>
                      <p className="text-xs text-gray-500">Moves around, no fixed location</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Location Fetch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MapPin size={18} />
                  {locationLoading ? "Getting location..." : "Get My Current Location"}
                </button>
                {locationError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {locationError}
                  </p>
                )}
                {formData.locationLat && formData.locationLng && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-black font-medium flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Location captured:
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Coordinates: {formData.locationLat.toFixed(6)}, {formData.locationLng.toFixed(6)}
                    </p>
                    
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm or correct address:
                      </label>
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="e.g., Achilet D, Tororo"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black ${
                          addressConfirmed ? 'border-green-500 bg-green-50' : 'border-gray-300'
                        }`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (manualAddress.trim()) {
                              setFormData(prev => ({ ...prev, locationAddress: manualAddress }));
                              setAddressConfirmed(true);
                              toast.success("Address confirmed!");
                            } else {
                              toast.warning("Please enter or confirm your address");
                            }
                          }}
                          disabled={addressConfirmed}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            addressConfirmed
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {addressConfirmed ? 'Address Confirmed ✓' : 'Confirm Address'}
                        </button>
                        <span className="text-xs text-gray-500">
                          {addressConfirmed ? 'You can edit if needed' : 'Edit the address if it\'s wrong, then confirm'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {/* Bank Transfer */}
                  <div className={`border rounded-lg p-3 transition-colors ${
                    formData.paymentMethod === 'bank' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={formData.paymentMethod === 'bank'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div className="flex items-center gap-2">
                        <Banknote size={18} className="text-gray-600" />
                        <span className="text-black font-medium">Bank Transfer</span>
                      </div>
                    </label>
                    {formData.paymentMethod === 'bank' && (
                      <div className="ml-6 mt-3 space-y-3 animate-slideDown">
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          placeholder="Bank Name"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black ${
                            formData.bankName && formData.bankName.length > 0 ? 'border-green-500' : 'border-gray-300'
                          }`}
                        />
                        <input
                          type="text"
                          name="bankAccount"
                          value={formData.bankAccount}
                          onChange={handleChange}
                          placeholder="Account Number"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black ${
                            formData.bankAccount && /^\d{8,}$/.test(formData.bankAccount) ? 'border-green-500' : 'border-gray-300'
                          }`}
                        />
                        {formData.bankAccount && !/^\d{8,}$/.test(formData.bankAccount) && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> Account must be at least 8 digits
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Payment */}
                  <div className={`border rounded-lg p-3 transition-colors ${
                    formData.paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-600" />
                        <span className="text-black font-medium">Card Payment</span>
                      </div>
                    </label>
                    {formData.paymentMethod === 'card' && (
                      <div className="ml-6 mt-3 animate-slideDown">
                        <input
                          type="text"
                          name="cardLastFour"
                          value={formData.cardLastFour}
                          onChange={handleChange}
                          placeholder="Last 4 digits of card"
                          maxLength="4"
                          pattern="\d{4}"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black ${
                            formData.cardLastFour && /^\d{4}$/.test(formData.cardLastFour) ? 'border-green-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">We only store the last 4 digits for verification</p>
                        {formData.cardLastFour && !/^\d{4}$/.test(formData.cardLastFour) && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> Please enter exactly 4 digits
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile Money */}
                  <div className={`border rounded-lg p-3 transition-colors ${
                    formData.paymentMethod === 'mobile_money' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mobile_money"
                        checked={formData.paymentMethod === 'mobile_money'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <div className="flex items-center gap-2">
                        <Smartphone size={18} className="text-gray-600" />
                        <span className="text-black font-medium">Mobile Money</span>
                      </div>
                    </label>
                    {formData.paymentMethod === 'mobile_money' && (
                      <div className="ml-6 mt-3 space-y-3 animate-slideDown">
                        <select
                          name="mobileProvider"
                          value={formData.mobileProvider}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                        >
                          <option value="">Select Provider</option>
                          <option value="MTN">MTN</option>
                          <option value="Airtel">Airtel</option>
                          <option value="Africell">Africell</option>
                        </select>
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={formData.mobileNumber}
                          onChange={handleChange}
                          placeholder="Mobile Number"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black ${
                            formData.mobileNumber && /^\d{7,9}$/.test(formData.mobileNumber) ? 'border-green-500' : 'border-gray-300'
                          }`}
                        />
                        {formData.mobileNumber && !/^\d{7,9}$/.test(formData.mobileNumber) && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> Mobile number must be 7-9 digits
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`${step > 1 ? 'w-1/2' : 'w-full'} py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">Already have an account? <Link to="/seller/login" className="text-indigo-600 font-medium hover:underline">Sign in here</Link></p>
          <p className="text-gray-600 text-sm mt-2">Are you a buyer? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register here</Link></p>
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
        input, textarea, select {
          color: #000000 !important;
        }
        input::placeholder, textarea::placeholder {
          color: #6b7280 !important;
        }
        button.bg-indigo-500, button.bg-indigo-600, button.bg-green-600 {
          color: white !important;
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick />
    </div>
  );
};

export default SellerRegisterPage;