import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const login = (userData) => {
    // Make sure userData includes the token
    if (userData && userData.token) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token); // Store token separately as well
      setUser(userData);
      setIsLoggedIn(true);
    }
  };

  const logout = useCallback(() => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Reset state
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    try {
      // Check for existing user data on mount
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      logout();
    }
  }, [logout]);

  const value = {
    isLoggedIn,
    user,
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
