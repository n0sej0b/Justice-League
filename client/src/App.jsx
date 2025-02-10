// App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Register from './components/Register';
import Heroes from './components/Heroes';
import Profile from './components/Profile';
import Requests from './components/Requests';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './components/AuthContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  });

  useEffect(() => {
    // Check for token and user data in localStorage on component mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
          user={user} 
          setUser={setUser} 
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/heroes" 
            element={<Heroes isLoggedIn={isLoggedIn} user={user} />} 
          />

          {/* Protected routes */}
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <ProfileRedirect user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Requests user={user} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const ProfileRedirect = ({ user }) => {
  if (!user || !user.id) {
    console.log('No user ID found, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  console.log('Redirecting to profile with ID:', user.id);
  return <Navigate to={`/profile/${user.id}`} replace />;
};

export default App;
