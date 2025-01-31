import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, deleteReview, deleteRequest } from '../API/Index';
import { useAuth } from './AuthContext';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        if (!id && !currentUser) {
          navigate('/login');
          return;
        }

        const profileId = id || currentUser?.id;
        if (!profileId) {
          throw new Error('No profile ID available');
        }

        const data = await getUserProfile(profileId);
        if (!data) {
          throw new Error('No profile data received');
        }
        
        setProfile(data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, navigate]);

  const handleDeleteReview = async (reviewId) => {
    try {
      setDeleteLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
  
      console.log('Deleting review:', {
        reviewId,
        token: token ? 'Token exists' : 'No token'
      });
  
      const result = await deleteReview(reviewId, token);
      console.log('Delete result:', result);
  
      // Update local state after successful deletion
      setProfile(prevProfile => ({
        ...prevProfile,
        Reviews: prevProfile.Reviews.filter(review => review.id !== reviewId)
      }));
  
      // Optional: Show success message
      setError(null); // Clear any existing errors
      // If you have a success message state:
      // setSuccessMessage('Review deleted successfully');
  
    } catch (error) {
      console.error('Error deleting review:', error);
      setError(error.message || 'Failed to delete review');
    } finally {
      setDeleteLoading(false);
    }
  };
  

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      setDeleteLoading(true);
      
      // Check authentication
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Please log in to delete requests');
      }

      const currentUser = JSON.parse(userStr);
      if (!currentUser.token) {
        throw new Error('Authentication token not found');
      }

      await deleteRequest(requestId);
      setProfile(prevProfile => ({
        ...prevProfile,
        sentRequests: prevProfile.sentRequests.filter(req => req.id !== requestId),
        receivedRequests: prevProfile.receivedRequests.filter(req => req.id !== requestId)
      }));
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.message || 'Failed to delete request');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!profile) return <div className="no-data-message">No profile data available</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{profile.username}'s Profile</h1>
        <p>Email: {profile.email}</p>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button 
          className={`tab-button ${activeTab === 'sent-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent-requests')}
        >
          Sent Requests
        </button>
        <button 
          className={`tab-button ${activeTab === 'received-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('received-requests')}
        >
          Received Requests
        </button>
      </div>

      <div className="tab-content">
      {activeTab === 'reviews' && (
  <div className="reviews-section">
    <h2>Reviews</h2>
    {profile.Reviews && profile.Reviews.length > 0 ? (
      <div className="reviews-grid">
        {profile.Reviews.map(review => {
          // Debug logs
          console.log('Review:', review);
          console.log('Current user:', user);
          console.log('Is logged in:', isLoggedIn);
          console.log('User matches review:', user?.id === review.userId);

          return (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <h3>Hero Review</h3>
                {isLoggedIn && user && user.id === review.user_id && ( // Changed from userId to user_id
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deleteLoading}
                    title="Delete Review"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="rating">Rating: {review.rating}/5</div>
              <p>{review.review_text}</p>
              <small>Posted on: {new Date(review.created_at).toLocaleDateString()}</small>
            </div>
          );
        })}
      </div>
    ) : (
      <p>No reviews yet</p>
    )}
  </div>
)}

      </div>
    </div>
  );
};

export default Profile;
