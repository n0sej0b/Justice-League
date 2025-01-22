import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers } from "../API/Index";
import './Navbar.css';

const Navbar = () => {
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showLoginForm, setShowLoginForm] = useState(false);
  const loginFormRef = useRef(null);

  const checkTokenValidity = (storedToken) => {
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  };
  

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

  const toggleMenu = () => setIsOpen(!isOpen);
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
    
    try {
      console.log('Sending login data:', loginData);
  
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Handle successful login
      if (data.token) {
        // Store the token
        localStorage.setItem('token', data.token);
        // Store user data if needed
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update your app state
        setIsLoggedIn(true);
        setUser(data.user);
        setShowLoginForm(false);
        setError(null);
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      setIsLoggedIn(false);
    }
};

  
      
  
  
  
  
  
  
  useEffect(() => {
    const getUsers = async () => {
      try {
          const users = await fetchUsers();
          
          setUser(users);
      } catch (error) {
          console.error('Error in getUsers:', error);
         
          setUser([]);
          
      }
  };
  
  
    getUsers();
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
    setLoginData({ email: '', password: '' });
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
          <span className="hamburger"></span>
        </button>
      </div>

      <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
        <li className="navbar-item">
          <Link to="/" className="navbar-link">Home</Link>
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
            <button 
              onClick={handleLogout} 
              className="login-button"
            >
              Logout
            </button>
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
