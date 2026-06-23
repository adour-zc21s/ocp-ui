import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useStateContext } from '../contexts/ContextProvider';

const REST_API_URL = 'http://localhost:8081/api/v1/auth/authenticate';

// Create a standalone axios instance for login to avoid interceptor conflicts
const loginAxios = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add CORS credentials
  withCredentials: false,
});

// Add response interceptor to handle errors
loginAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Login axios error:', error);
    return Promise.reject(error);
  }
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

  // Check if already logged in
  React.useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
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
      // Try sending request with different possible field names
      const requestPayload = {
        email,
        password,
      };

      console.log('Sending login request to:', REST_API_URL);
      console.log('Payload:', requestPayload);

      const response = await loginAxios.post('/api/v1/auth/authenticate', requestPayload);

      console.log('Login response:', response.data);

      // Handle different response formats - API returns access_token
      const token = response.data.access_token || response.data.token || response.data.accessToken || response.data.jwt;
      const user = {
        id: response.data.id,
        email: response.data.email,
        roles: response.data.roles,
      };

      if (!token) {
        setLoading(false);
        // Show the actual response structure for debugging
        const responseKeys = Object.keys(response.data);
        const responseStr = JSON.stringify(response.data, null, 2);
        const errorMsg = `Login successful but token not found. Response keys: ${responseKeys.join(', ')}. Full response: ${responseStr}`;
        console.error(errorMsg);
        setError(`No token in response. Check console for details. Response contains: ${responseKeys.join(', ')}`);
        return;
      }

      // Store token and user info
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Use setTimeout to ensure state update completes before navigation
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
      
      // Better error message handling
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">OCP Dash</h1>
          <p className="text-gray-600 mt-2">Welcome back</p>
          <p className="text-gray-600 text-sm">String200!</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm">
            <div className="font-semibold mb-1">Login Error</div>
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-600">Tip: Check the browser console (F12) for more details</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <FiMail className="text-gray-400 mr-2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent outline-none text-gray-700"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <FiLock className="text-gray-400 mr-2" />
              <input
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
          </div>

          {/* Remember Me */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: currentColor }}
            className="w-full text-white font-semibold py-2 rounded-lg hover:opacity-90 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
          <p className="mb-2 text-xs font-semibold">Open Class Programming</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
