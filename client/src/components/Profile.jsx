import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, deleteReview, deleteRequest, updateReview, getUserRequests, getHeroRequests } from '../API/Index';
import { useAuth } from './AuthContext';
import './Profile.css';

const API_URL = 'http://localhost:3000'; 

const Profile = () => {
  // 1. All useState hooks
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReview, setEditedReview] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [heroRequests, setHeroRequests] = useState([]);

  // 2. All router and context hooks
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // 3. useEffect for profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
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

        const profileData = await getUserProfile(profileId);
        console.log('Profile Data:', profileData);
        
        if (!profileData) {
          throw new Error('No profile data received');
        }

        const userRequests = await getUserRequests(profileId);
        let heroRequests = [];
        
        if (profileData.is_hero) {
          heroRequests = await getHeroRequests(profileId);
        }

        const updatedProfile = {
          ...profileData,
          sentRequests: userRequests || [],
        };

        setProfile(updatedProfile);
        setIncomingRequests(heroRequests || []);

      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to load profile');
      }
    };

    fetchProfileData();
  }, [id, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (user?.is_hero) {
          console.log('Fetching hero requests for:', user.username);
          const heroReqs = await getHeroRequests();
          console.log('Received hero requests:', heroReqs);
          setHeroRequests(heroReqs);
        }
        
        // Fetch user's outgoing requests
        const userReqs = await getUserRequests();
        setUserRequests(userReqs);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to fetch requests');
      }
    };
  
    if (user) {
      fetchRequests();
    }
  }, [user]);

  // 4. Handler functions
  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
  
      if (!response.ok) {
        throw new Error('Failed to update request status');
      }
  
      // Remove the request from the display immediately after rejection
      if (newStatus === 'rejected') {
        setIncomingRequests(prevRequests => 
          prevRequests.filter(request => request.id !== requestId)
        );
      } else {
        // For other status updates, just update the status
        setIncomingRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId
              ? { ...request, status: newStatus }
              : request
          )
        );
      }
  
      setSuccess(`Request ${newStatus} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating request:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    }
  };
  

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await deleteReview(reviewId, token);

      setProfile(prevProfile => ({
        ...prevProfile,
        Reviews: prevProfile.Reviews.filter(review => review.id !== reviewId)
      }));

      setSuccess('Review deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error deleting review:', error);
      setError(error.message || 'Failed to delete review');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateReview = async (reviewId, updatedData) => {
    try {
      await updateReview(reviewId, {
        rating: updatedData.rating,
        review_text: updatedData.review_text
      });

      setProfile(prevProfile => ({
        ...prevProfile,
        Reviews: prevProfile.Reviews.map(review =>
          review.id === reviewId 
            ? { ...review, ...updatedData }
            : review
        )
      }));

      setIsEditing(false);
      setSelectedReview(null);
      setEditedReview(null);

    } catch (error) {
      console.error('Error updating review:', error);
      setError(error.message || 'Failed to update review');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      await deleteRequest(requestId);
      
      setProfile(prevProfile => ({
        ...prevProfile,
        sentRequests: prevProfile.sentRequests.filter(req => req.id !== requestId)
      }));
      
      setSuccess('Request deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.message || 'Failed to delete request');
      setTimeout(() => setError(null), 3000);
    }
  };

  const makeHero = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/make-hero`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update hero status');
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    } catch (error) {
      console.error('Error making user hero:', error);
      setError('Failed to update hero status');
    }
  };

  // 5. Early return for loading state
  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  // 6. Main render
  return (
    <div className="profile-container">
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="profile-header">
        <h1>{profile.username}'s Profile</h1>
        <p>Email: {profile.email}</p>
        
        {/* {!profile.is_hero && (
          <button 
            onClick={makeHero}
            className="make-hero-button"
          >
            Become a Hero
          </button>
        )} */}
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
        
        {profile.is_hero && (
          <button 
            className={`tab-button ${activeTab === 'incoming-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming-requests')}
          >
            Incoming Requests ({incomingRequests.length})
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'reviews' && (
          <div className="reviews-section">
            <h2>Reviews</h2>
            {profile.Reviews?.length > 0 ? (
              <div className="reviews-grid">
                {profile.Reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <h3>Hero Review</h3>
                      {isLoggedIn && user && user.id === review.user_id && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteReview(review.id)}
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
                ))}
              </div>
            ) : (
              <p>No reviews yet</p>
            )}
          </div>
        )}

        {activeTab === 'sent-requests' && (
          <div className="requests-section">
            <h2>Sent Requests</h2>
            {profile.sentRequests?.length > 0 ? (
              <div className="requests-grid">
                {profile.sentRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3>{request.title}</h3>
                      {isLoggedIn && user && user.id === request.user_id && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteRequest(request.id)}
                          title="Delete Request"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <p><strong>Status:</strong> {request.status}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Description:</strong> {request.description}</p>
                    <p><strong>Urgency:</strong> {request.urgency}</p>
                    <small>Requested on: {new Date(request.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p>No sent requests</p>
            )}
          </div>
        )}

        {activeTab === 'incoming-requests' && profile.is_hero && (
          <div className="requests-section">
            <h2>Incoming Requests</h2>
            {incomingRequests.length > 0 ? (
              <div className="requests-grid">
                {incomingRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3>{request.title}</h3>
                      <div className="request-status">{request.status}</div>
                    </div>
                    <p><strong>From:</strong> {request.username}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Description:</strong> {request.description}</p>
                    <p><strong>Urgency:</strong> {request.urgency}</p>
                    <p><strong>Contact:</strong> {request.contact_info}</p>
                    <small>Requested on: {new Date(request.created_at).toLocaleDateString()}</small>
                    
                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="accept-btn"
                          onClick={() => handleUpdateRequestStatus(request.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No incoming requests</p>
            )}
          </div>
        )}
      </div>

      {selectedReview && (
        <div className="review-modal-overlay" onClick={() => {
          setSelectedReview(null);
          setIsEditing(false);
          setEditedReview(null);
        }}>
          <div className="review-modal-content" onClick={e => e.stopPropagation()}>
            {/* Add your modal content here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
