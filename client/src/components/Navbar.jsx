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
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const loginFormRef = useRef(null);

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
  
  const toggleLoginForm = () => setShowLoginForm(!showLoginForm);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      if (data.token) {
        login(data.user, data.token); // Use the login function from context
        setShowLoginForm(false);
        setLoginData({ email: '', password: '' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    logout(); // Use the logout function from context
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
            src="" 
            alt="Logo" 
          />
        </Link>
        <button 
          className="navbar-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
        </button>
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
          <Link to="/live-chat" className="navbar-link">Live Chat</Link>
        </li>
        <li className="navbar-item">
          <Link to="/requests" className="navbar-link">Requests</Link>
        </li>
        <li className="navbar-item">
          <Link to="/register" className="navbar-link">Register</Link>
        </li>
        <li className="navbar-item login-section">
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
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
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
