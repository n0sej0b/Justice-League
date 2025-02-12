import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUsers } from "../API/Index";
import { useAuth } from './AuthContext';
import './Navbar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

    if (showLoginForm) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLoginForm]);

  const toggleMenu = () => setIsOpen(prev => !prev);
  
  const toggleLoginForm = () => {
    setShowLoginForm(prev => !prev);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) throw new Error('Login failed');

      const { user: responseUser, token } = await response.json();
      
      const userData = {
        id: responseUser.id,
        username: responseUser.username,
        email: responseUser.email,
        is_hero: responseUser.is_hero,
        token
      };

      if (!userData.id || !userData.username || userData.is_hero === undefined) {
        throw new Error('Invalid user data received');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      login(userData);
      setShowLoginForm(false);
      setLoginData({ username: '', password: '' });
      setSuccessMessage('Login successful!');
      
      navigate(`/profile/${userData.id}`);

    } catch (error) {
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
    if (user?.id) {
      navigate(`/profile/${user.id}`);
      setIsOpen(false);
    }
  };

  const renderLoginForm = () => (
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
  );

  const renderProfileSection = () => (
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
  );

  const renderRequestsSection = () => (
    <div className="login-prompt-container">
      <div 
        className="navbar-link" 
        onClick={() => setShowLoginForm(true)}
      >
        Requests
      </div>
      <div className="login-required-message">
        Please log in to view requests
      </div>
    </div>
  );

  const renderLoginSection = () => {
    if (isLoggedIn) {
      return (
        <>
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      );
    }

    return (
      <div className="login-container" ref={loginFormRef}>
        <button onClick={toggleLoginForm} className="login-button">
          Login
        </button>
        {showLoginForm && renderLoginForm()}
      </div>
    );
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
          ) : renderProfileSection()}
        </li>
        <li className="navbar-item">
          <Link to="/heroes" className="navbar-link">Heroes</Link>
        </li>
        <li className="navbar-item">
          {isLoggedIn ? (
            <Link to="/requests" className="navbar-link">Requests</Link>
          ) : renderRequestsSection()}
        </li>
        <li className="navbar-item">
          <Link to="/register" className="navbar-link">Register</Link>
        </li>
        <li className="navbar-itemlogin-section">
          {renderLoginSection()}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
