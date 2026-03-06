import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Upload, CheckCircle, XCircle, ChevronDown, Check } from "lucide-react";
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

  /* Remove autofill background and any outline */
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
    border-bottom-color: #3b82f6; /* blue on focus/autofill */
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
    contact: "", // This will store only the local phone number without country code
    location: "",
    nin_number: "",
    about: "",
    profile_photo: null,
    passport_photo: null,
    id_photo: null,
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
  const [selectedCountry, setSelectedCountry] = useState(EAST_AFRICAN_COUNTRIES[0]); // Default to Uganda
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9); // Max 9 digits after country code
    setFormData(prev => ({ ...prev, contact: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      setUploadStatus(prev => ({ ...prev, [name]: true }));
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const selectCountry = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
  };

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
      if (!formData.name || !formData.contact || !formData.location) {
        setError("Business name, contact and location are required");
        return;
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

    // Check if all required documents are uploaded
    if (!allDocumentsUploaded()) {
      setError("Please upload all required documents: Profile Photo, Passport Photo, and ID Photo");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("name", formData.name);
    
    // Format phone number with country code
    const formattedPhone = `${selectedCountry.code} ${selectedCountry.dialCode} ${formData.contact}`;
    data.append("contact", formattedPhone);
    
    data.append("location", formData.location);
    if (formData.nin_number) data.append("nin_number", formData.nin_number);
    if (formData.about) data.append("about", formData.about);
    
    // Append required documents (they should all exist at this point)
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
      {/* Header Image */}
      <div className="h-48 relative overflow-hidden">
        <img
          src="https://csspicker.dev/api/image/?q=modern+architecture+purple&image_type=photo"
          alt="Header"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Registration Form Card */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative px-6 pt-8 pb-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Hello!</h1>
        <p className="text-gray-400 text-lg mb-6">Create a seller account</p>

        {/* Step indicator */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3].map((i) => (
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
              {i < 3 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    step > i ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
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

              {/* Phone Input with Country Code - Exactly like RegisterPage */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex">
                  {/* Country Code Dropdown */}
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

                    {/* Dropdown Menu */}
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

                  {/* Phone Number Input */}
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
                name="location"
                value={formData.location}
                onChange={handleChange}
                label="Business Address"
                required
                autoComplete="off"
              />

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

          {/* Step 3: Documents - Now Required */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-">
                <p className="text-blue-800 text-sm font-medium flex items-center gap-2">
                  <Upload size={16} />
                  Document verification required
                </p>
              </div>

              {/* Profile Photo - Required */}
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
                  {uploadStatus.profile_photo ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Passport Photo - Required */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Passport Photo <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${uploadStatus.passport_photo ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <input
                    name="passport_photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploadStatus.passport_photo ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* ID Photo - Required */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  ID Photo <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${uploadStatus.id_photo ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <input
                    name="id_photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploadStatus.id_photo ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-400 flex-shrink-0" />
                  )}
                </div>
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
                      <span className="text-xs text-green-600 flex items-center gap-1">Uploaded <CheckCircle size={12} /></span>
                    ) : (
                      <span className="text-xs text-red-500">Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">ID Photo:</span>
                    {uploadStatus.id_photo ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">Uploaded <CheckCircle size={12} /></span>
                    ) : (
                      <span className="text-xs text-red-500">Pending</span>
                    )}
                  </div>
                </div>
                {allDocumentsUploaded() && (
                  <div className="mt-3 p-2 bg-green-100 rounded-lg">
                    <p className="text-xs text-green-700 text-center font-medium">
                      All documents uploaded! You can now create your account.
                    </p>
                  </div>
                )}
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
            {step < 3 ? (
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
                disabled={loading || !allDocumentsUploaded()}
                className={`w-full py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  allDocumentsUploaded() && !loading
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            )}
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link to="/seller/login" className="text-indigo-600 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Are you a buyer?{" "}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;