import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { login } from '../API/Index';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value.trim()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.username || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Add console log to debug the login request
      console.log('Attempting login with:', {
        username: formData.username,
        passwordLength: formData.password.length
      });

      // Make the login request
      const response = await login({
        username: formData.username,
        password: formData.password
      });

      // Debug response
      console.log('Login response:', response);

      // Check if we have a valid response
      if (!response || !response.token) {
        throw new Error('Invalid login response');
      }

      // Create user data object from response
      const userData = {
        id: response.id,
        username: response.username,
        email: response.email,
        token: response.token
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token); // Store token separately

      // Update auth context
      setIsLoggedIn(true);
      setUser(userData);

      // Clear form
      setFormData({ username: '', password: '' });

      // Navigate to profile
      navigate(`/profile/${userData.id}`);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="username"
            placeholder="Enter your username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !formData.username || !formData.password}
          className={`submit-button ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
