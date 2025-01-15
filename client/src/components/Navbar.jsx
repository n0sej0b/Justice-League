import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
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
    setIsOpen(!isOpen);
  };

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
  };

  const handleInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Add your authentication logic here
    setIsLoggedIn(true);
    setUser({ email: loginData.email }); // Add more user data as needed
    setShowLoginForm(false);
    setLoginData({ email: '', password: '' });
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    // Add your logout logic here
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img style={{ fontSize: "28px", backgroundColor: "#333", textAlign: "center", width: '100px',height: '100px' }} src="" alt="" />
        </Link>
     
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
            <button onClick={handleLogout} className="login-button">
              Logout
            </button>
          ) : (
            <div className="login-container" ref={loginFormRef}>
              <button onClick={toggleLoginForm} className="login-button">
                Login
              </button>
              {showLoginForm && (
                <form className="login-form" onSubmit={handleLogin}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button type="submit" className="login-submit">
                    Submit
                  </button>
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
