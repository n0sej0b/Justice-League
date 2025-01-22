// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Register from './components/Register';
import Heroes from './components/Heroes';
import LiveChat from './components/Live Chat';
import Requests from './components/Requests';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/heroes" element={<Heroes isLoggedIn={isLoggedIn} user={user} />} />
          <Route path="/live-chat" element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <LiveChat user={user} />
            </ProtectedRoute>
          } />
          <Route path="/requests" element={<Requests />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
