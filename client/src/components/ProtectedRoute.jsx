// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn || !user) {
    console.log('Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
