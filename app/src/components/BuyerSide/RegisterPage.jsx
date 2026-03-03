import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Camera, Check } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

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

const RegisterPage = ({ setIsAuthenticated, setUserRole }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, buyerContact: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('username', formData.buyerName);
    data.append('email', formData.buyerEmail);
    data.append('password', formData.password);
    data.append('name', formData.buyerName);
    data.append('location', formData.buyerLocation);
    data.append('contact', formData.buyerContact);
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
        const loginResponse = await fetch('/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.buyerEmail, password: formData.password }),
        });

        if (loginResponse.ok) {
          const { access } = await loginResponse.json();
          localStorage.setItem('accessToken', access);
          localStorage.setItem('userRole', 'buyer');
          
          setIsAuthenticated(true);
          setUserRole('buyer');
          
          const firstName = formData.buyerName.split(' ')[0];
          toast.success(`Account created successfully! Welcome, ${firstName}!`);
          navigate('/');
        } else {
          toast.warning('Registration successful, but auto-login failed. Please login manually.');
          navigate('/login');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.non_field_errors?.[0] || 'Registration failed. Please check your details.';
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
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                <AnimatedInput
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleInputChange}
                  label="Full Name"
                  required
                  autoComplete="off"
                />

                <AnimatedInput
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleInputChange}
                  label="Email"
                  required
                  autoComplete="off"
                />

                <AnimatedInput
                  type="tel"
                  name="buyerContact"
                  value={formData.buyerContact}
                  onChange={handlePhoneChange}
                  label="Phone Number"
                  autoComplete="off"
                />

                <AnimatedInput
                  type="date"
                  name="buyerDoB"
                  value={formData.buyerDoB}
                  onChange={handleInputChange}
                  label="Date of Birth"
                  autoComplete="off"
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

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick />
    </div>
  );
};

export default RegisterPage;