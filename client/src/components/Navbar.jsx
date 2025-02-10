import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUsers } from "../API/Index";
import { useAuth } from './AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const loginFormRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginFormRef.current && !loginFormRef.current.contains(event.target)) {
        setShowLoginForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(prevState => !prevState);
  };
  
  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setError(null); // Clear any previous errors
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('Login response data:', data);

      // Extract user data from nested structure
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        is_hero: data.user.is_hero,
        token: data.token
      };

      // Validate the extracted data
      if (!userData.id || !userData.username || userData.is_hero === undefined) {
        console.error('Missing required user data:', userData);
        throw new Error('Invalid user data received');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Stored token:', data.token);
      console.log('Stored user:', userData);

      // Call login from AuthContext
      login(userData);
      
      // Reset form and close
      setShowLoginForm(false);
      setLoginData({ username: '', password: '' });
      setSuccessMessage('Login successful!');

      // Navigate to profile
      navigate(`/profile/${userData.id}`);

    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    }
  };


  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user && user.id) {
      navigate(`/profile/${user.id}`);
      setIsOpen(false); // Close mobile menu after navigation
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img 
            style={{ 
              fontSize: "28px", 
              backgroundColor: "#333", 
              textAlign: "center", 
              width: '100px',
              height: '100px' 
            }} 
            src="https://cdn.freebiesupply.com/logos/large/2x/dc-logo-png-transparent.png" 
            alt="Logo" 
          />
        </Link>
      </div>

      <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
        <li className="navbar-item">
          {isLoggedIn && user?.id ? (
            <button 
              className="navbar-link"
              onClick={handleProfileClick}
            >
              Profile
            </button>
          ) : (
            <div className="login-prompt-container">
              <div 
                className="navbar-link" 
                onClick={() => setShowLoginForm(true)}
              >
                Profile
              </div>
              {!isLoggedIn && (
                <div className="login-required-message">
                  Please log in to view your profile
                </div>
              )}
            </div>
          )}
        </li>
        <li className="navbar-item">
          <Link to="/heroes" className="navbar-link">Heroes</Link>
        </li>
        <li className="navbar-item">
          <Link to="/requests" className="navbar-link">Requests</Link>
        </li>
        <li className="navbar-item">
          <Link to="/register" className="navbar-link">Register</Link>
        </li>
        <li className="navbar-itemlogin-section">
          {isLoggedIn ? (
            <>
              <span>Welcome, {user?.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <div className="login-container" ref={loginFormRef}>
              <button 
                onClick={toggleLoginForm} 
                className="login-button"
              >
                Login
              </button>
              {showLoginForm && (
                <form className="login-form" onSubmit={handleLogin}>
                  <input
                    type="text"
                    name="username"
                    value={loginData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                  <button type="submit" className="login-submit">
                    Submit
                  </button>
                  {error && <div className="error-message">{error}</div>}
                  {successMessage && <div className="success-message">{successMessage}</div>}
                </form>
              )}
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
