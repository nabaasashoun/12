import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Upload, CheckCircle, XCircle, ChevronDown, Check, Camera, X, RotateCw, MapPin } from "lucide-react";
import styled from 'styled-components';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

// Camera Component (unchanged)
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

const AnimatedInput = ({ type, name, value, onChange, label, required, autoComplete, ...props }) => {
  const labelChars = label.split('').map((char, index) => (
    <span key={index} style={{ transitionDelay: `${index * 50}ms` }}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  return (
    <StyledInputWrapper>
      <div className="form-control">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          {...props}
        />
        <label>{labelChars}</label>
      </div>
    </StyledInputWrapper>
  );
};

const StyledInputWrapper = styled.div`
  .form-control {
    position: relative;
    margin: 20px 0 30px;
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
    transition: border-color 0.2s;
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
  .form-control input:focus,
  .form-control input:valid,
  .form-control input:-webkit-autofill {
    outline: 0;
    border-bottom-color: #3b82f6;
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
  .form-control input:focus + label span,
  .form-control input:valid + label span,
  .form-control input:-webkit-autofill + label span {
    color: #3b82f6;
    transform: translateY(-24px);
  }
`;

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
    // Location fields
    locationType: "",
    locationLat: null,
    locationLng: null,
    locationAddress: "",
    // Payment fields
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
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFor, setCameraFor] = useState(null);
  
  // Location states
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  
  const navigate = useNavigate();

  // Reverse geocode using OpenStreetMap Nominatim (free, no key)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      if (data && data.address) {
        const { road, suburb, village, town, city, county, state, district, country } = data.address;
        // Try to get the most specific area first
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

  // Global cleanup
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, contact: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
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

  // Geolocation with reverse geocoding
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
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
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please check permissions.");
        setLocationLoading(false);
        console.error("Geolocation error:", error);
      }
    );
  };

  // Navigation
  const nextStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please fill all fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (step === 2) {
      if (!formData.name || !formData.contact) {
        setError("Business name and contact are required");
        return;
      }
    }
    if (step === 3) {
      if (!allDocumentsUploaded()) {
        setError("Please upload all required documents: Profile Photo, Passport Photo, and ID Photo");
        return;
      }
    }
    if (step === 4) {
      if (!formData.locationType) {
        setError("Please select your business location type");
        return;
      }
      if (!formData.locationLat || !formData.locationLng) {
        setError("Please fetch your location using the button above");
        return;
      }
      if (!addressConfirmed) {
        setError("Please confirm your location address.");
        return;
      }
      if (!formData.paymentMethod) {
        setError("Please select a payment method");
        return;
      }
      if (formData.paymentMethod === 'bank') {
        if (!formData.bankName || !formData.bankAccount) {
          setError("Please provide bank name and account number");
          return;
        }
      } else if (formData.paymentMethod === 'card') {
        if (!formData.cardLastFour || formData.cardLastFour.length < 4) {
          setError("Please provide the last 4 digits of your card");
          return;
        }
      } else if (formData.paymentMethod === 'mobile_money') {
        if (!formData.mobileProvider || !formData.mobileNumber) {
          setError("Please provide mobile money provider and number");
          return;
        }
      }
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const allDocumentsUploaded = () => {
    return uploadStatus.profile_photo && uploadStatus.passport_photo && uploadStatus.id_photo;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    forceStopCamera();
    setLoading(true);

    const data = new FormData();
    // Basic fields
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("name", formData.name);
    const formattedPhone = `${selectedCountry.code} ${selectedCountry.dialCode} ${formData.contact}`;
    data.append("contact", formattedPhone);
    if (formData.nin_number) data.append("nin_number", formData.nin_number);
    if (formData.about) data.append("about", formData.about);
    
    // Location fields
    data.append("location_type", formData.locationType);
    data.append("location_lat", formData.locationLat);
    data.append("location_lng", formData.locationLng);
    data.append("location_address", formData.locationAddress);
    
    // Payment fields
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
    
    // Documents
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
        navigate("/seller/login", {
          state: { success: "Seller account created successfully! Your documents have been submitted for verification." }
        });
      } else {
        console.error("Registration error:", responseData);
        setError(responseData.detail || responseData.error || responseData.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Step indicator (4 steps) */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === i
                    ? 'bg-indigo-500 text-white'
                    : step > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > i ? '✓' : i}
              </div>
              {i < 4 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    step > i ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
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
              />
              <AnimatedInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                label="Email address"
                required
                autoComplete="off"
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
              />

              {/* Phone Input with Country Code */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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
                    className="flex-1 h-[35px] text-black px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <AnimatedInput
                type="text"
                name="nin_number"
                value={formData.nin_number}
                onChange={handleChange}
                label="NIN Number (optional)"
                autoComplete="off"
              />

              <AnimatedInput
                type="text"
                name="about"
                value={formData.about}
                onChange={handleChange}
                label="About your business (optional)"
                autoComplete="off"
              />
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium flex items-center gap-2">
                  <Camera size={16} />
                  Document verification required - Use camera to take photos
                </p>
              </div>

              {/* Profile Photo - Regular file upload */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${uploadStatus.profile_photo ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <input
                    name="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploadStatus.profile_photo ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-400" />}
                </div>
              </div>

              {/* Passport Photo - Camera Only */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Passport Photo <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2 flex items-center gap-1"><Camera size={12} /> Camera only</span>
                </label>
                {!uploadStatus.passport_photo ? (
                  <button type="button" onClick={() => openCamera('passport')} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center gap-2">
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Click to open camera and take passport photo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex-1 flex items-center gap-2"><CheckCircle size={20} className="text-green-500" /><span className="text-sm text-green-700">Passport photo captured</span></div>
                    <button type="button" onClick={() => openCamera('passport')} className="text-xs text-indigo-600 hover:text-indigo-800">Retake</button>
                  </div>
                )}
              </div>

              {/* ID Photo - Camera Only */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  ID Photo <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2 flex items-center gap-1"><Camera size={12} /> Camera only</span>
                </label>
                {!uploadStatus.id_photo ? (
                  <button type="button" onClick={() => openCamera('id')} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center gap-2">
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Click to open camera and take ID photo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex-1 flex items-center gap-2"><CheckCircle size={20} className="text-green-500" /><span className="text-sm text-green-700">ID photo captured</span></div>
                    <button type="button" onClick={() => openCamera('id')} className="text-xs text-indigo-600 hover:text-indigo-800">Retake</button>
                  </div>
                )}
              </div>

              {/* Upload Progress Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-600">Profile Photo:</span>{uploadStatus.profile_photo ? <span className="text-xs text-green-600">Uploaded <CheckCircle size={12} /></span> : <span className="text-xs text-red-500">Pending</span>}</div>
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-600">Passport Photo:</span>{uploadStatus.passport_photo ? <span className="text-xs text-green-600">Captured <CheckCircle size={12} /></span> : <span className="text-xs text-red-500">Pending</span>}</div>
                  <div className="flex justify-between items-center"><span className="text-xs text-gray-600">ID Photo:</span>{uploadStatus.id_photo ? <span className="text-xs text-green-600">Captured <CheckCircle size={12} /></span> : <span className="text-xs text-red-500">Pending</span>}</div>
                </div>
                {allDocumentsUploaded() && (
                  <div className="mt-3 p-2 bg-green-100 rounded-lg">
                    <p className="text-xs text-green-700 text-center font-medium">All documents uploaded!</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Location Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="static"
                      checked={formData.locationType === 'static'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-black">Static Seller (fixed shop/office)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="dynamic"
                      checked={formData.locationType === 'dynamic'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-black">Dynamic Seller (moves around)</span>
                  </label>
                </div>
              </div>

              {/* Location Fetch */}
              <div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <MapPin size={18} />
                  {locationLoading ? "Getting location..." : "Get My Current Location"}
                </button>
                {locationError && <p className="text-red-500 text-sm mt-1">{locationError}</p>}
                {formData.locationLat && formData.locationLng && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-black font-medium">Location captured:</p>
                    <p className="text-sm text-black">Coordinates: {formData.locationLat.toFixed(6)}, {formData.locationLng.toFixed(6)}</p>
                    
                    {/* Manual address input */}
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm or correct address:</label>
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="e.g., Achilet D, Tororo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, locationAddress: manualAddress }));
                            setAddressConfirmed(true);
                          }}
                          disabled={addressConfirmed}
                          className={`px-3 py-1 text-sm rounded-md ${
                            addressConfirmed
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {addressConfirmed ? 'Address Confirmed ✓' : 'Confirm Address'}
                        </button>
                        <span className="text-xs text-gray-500">
                          {addressConfirmed ? 'You can still edit if needed' : 'Edit the address if it’s wrong, then confirm'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-black">Bank Transfer</span>
                  </label>
                  {formData.paymentMethod === 'bank' && (
                    <div className="ml-6 space-y-3">
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="Bank Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                      <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleChange}
                        placeholder="Account Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-black">Card Payment</span>
                  </label>
                  {formData.paymentMethod === 'card' && (
                    <div className="ml-6">
                      <input
                        type="text"
                        name="cardLastFour"
                        value={formData.cardLastFour}
                        onChange={handleChange}
                        placeholder="Last 4 digits of card"
                        maxLength="4"
                        pattern="\d{4}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">We only store the last 4 digits for verification</p>
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_money"
                      checked={formData.paymentMethod === 'mobile_money'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-black">Mobile Money</span>
                  </label>
                  {formData.paymentMethod === 'mobile_money' && (
                    <div className="ml-6 space-y-3">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </div>
                  )}
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
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
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
        input, textarea, select {
          color: #000000 !important;
        }
        input::placeholder, textarea::placeholder {
          color: #6b7280 !important;
        }
        button.bg-indigo-500, button.bg-indigo-600 {
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default SellerRegisterPage;