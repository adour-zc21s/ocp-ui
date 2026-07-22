import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useStateContext } from '../contexts/ContextProvider';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const REST_API_URL = `${API_BASE_URL}/api/v1/auth/authenticate`;

const loginAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

loginAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Login axios error:', error);
    return Promise.reject(error);
  },
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { currentColor } = useStateContext();

  // --- BANNER ROTATION STATE & ASSETS ---
  const banners = [
    '/banner/banner_ocp_login1.png',
    '/banner/banner_ocp_login2.png',
    '/banner/banner_ocp_login3.png'
  ];
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Automatically cycle through banners every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 4000); // 4000ms = 4 seconds

    return () => clearInterval(interval);
  }, [banners.length]);
  // --------------------------------------

  React.useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const requestPayload = { email, password };

      console.log('Sending login request to:', REST_API_URL);
      console.log('Payload:', requestPayload);

      const response = await loginAxios.post('/api/v1/auth/authenticate', requestPayload);

      console.log('Login response:', response.data);

      const token = response.data.access_token || response.data.token || response.data.accessToken || response.data.jwt;
      const user = {
        id: response.data.id,
        email: response.data.email,
        roles: response.data.roles,
        profile_image_url: response.data.profile_image_url,
      };

      if (!token) {
        setLoading(false);
        const responseKeys = Object.keys(response.data);
        const responseStr = JSON.stringify(response.data, null, 2);
        const errorMsg = `Login successful but token not found. Response keys: ${responseKeys.join(', ')}. Full response: ${responseStr}`;
        console.error(errorMsg);
        setError(`No token in response. Check console for details. Response contains: ${responseKeys.join(', ')}`);
        return;
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      setLoading(false);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      setLoading(false);
      console.error('Login error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config,
      });

      let errorMessage = 'Login failed. Please try again.';

      if (err.response?.status === 401 || err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Invalid email or password.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Server endpoint not found. Check the API URL.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server is not responding.';
      } else if (err.message?.includes('CORS') || err.message === 'Network Error' || !err.response) {
        errorMessage = 'Cannot connect to server make sure backend is running.';
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 mb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">OCP Dash</h1>
          <p className="text-gray-600 mt-2">Welcome back</p>
          {/* <p className="text-gray-600 text-sm">String200!</p> */}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm">
            <div className="font-semibold mb-1">Login Error</div>
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-600">Error code 521 backend is down</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              <span className="block mb-2">Email Address</span>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <FiMail className="text-gray-400 mr-2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent outline-none text-gray-700"
                  required
                />
              </div>
            </label>
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              <span className="block mb-2">Password</span>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <FiLock className="text-gray-400 mr-2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent outline-none text-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
          </div>

          <div className="mb-6">
            <label htmlFor="rememberMe" className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: currentColor }}
            className="w-full text-white font-semibold py-2 rounded-lg hover:opacity-90 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
          <p className="mb-2 text-xs font-semibold">Open Class Programming</p>
        </div>
      </div>

      {/* --- ANIMATED ADS BANNER COMPONENT --- */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-3 text-center shadow-md relative overflow-hidden">
        <span className="absolute top-0 left-0 bg-gray-200 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-br uppercase tracking-wide z-20">
          Advertisement
        </span>
        
        {/* Relative positioning context with a defined height container for absolute cross-fading items */}
        <div className="mt-4 relative h-[100px] w-full overflow-hidden rounded">
          <a href="https://wa.me/+6281385229903" target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            {banners.map((src, index) => (
              <img 
                key={src}
                src={src} 
                alt={`Sponsored Banner ${index + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </a>
        </div>
      </div>
      {/* ---------------------------- */}

    </div>
  );
};

export default Login;