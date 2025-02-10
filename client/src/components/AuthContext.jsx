import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const login = (userData) => {
    console.log('Login called with:', userData);
    
    // Ensure we're storing the complete user object including is_hero
    const userToStore = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      is_hero: userData.is_hero,
      token: userData.token
    };

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userToStore));
    localStorage.setItem('token', userData.token);
    
    // Update state
    setUser(userToStore);
    setIsLoggedIn(true);

    console.log('Stored user data:', userToStore);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
  };

  const value = {
    user,
    setUser,
    isLoggedIn,
    setIsLoggedIn,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
