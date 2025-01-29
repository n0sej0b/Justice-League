import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useAuth();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // In your login handler
const handleLogin = async (credentials) => {
  try {
    const response = await login(credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setIsLoggedIn(true);
      setUser(response.user);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const response = await login(formData.username, formData.password);
    
    if (response.user && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setIsLoggedIn(true);
      setUser(response.user);
      navigate(`/profile/${response.user.id}`);
    } else {
      throw new Error('Invalid login response');
    }
  } catch (err) {
    setError(err.message || 'Login failed');
  }
};

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
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
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
