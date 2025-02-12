import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, deleteReview, deleteRequest, updateReview, getUserRequests, getHeroRequests } from '../API/Index';
import { useAuth } from './AuthContext';
import StarRating from './StarRating';
import './Profile.css';

const API_URL = 'http://localhost:3000';

const Profile = () => {
  // State initialization with meaningful defaults
  const initialReviewData = { rating: 0, review_text: '' };
  const initialRequestData = { title: '', description: '', location: '', urgency: '' };

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [heroRequests, setHeroRequests] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editedReviewData, setEditedReviewData] = useState(initialReviewData);
  const [editedRequestData, setEditedRequestData] = useState(initialRequestData);

  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // Fetch profile data
  const fetchProfileData = async (profileId) => {
    try {
      const profileData = await getUserProfile(profileId);
      if (!profileData) throw new Error('No profile data received');

      const userRequests = await getUserRequests(profileId);
      let heroRequests = [];
      
      if (profileData.is_hero) {
        heroRequests = await getHeroRequests(profileId);
      }

      return {
        profile: { ...profileData, sentRequests: userRequests || [] },
        heroRequests: heroRequests || []
      };
    } catch (err) {
      throw new Error(err.message || 'Failed to load profile');
    }
  };

  // Main profile data fetching effect
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        if (!id && !currentUser) {
          navigate('/login');
          return;
        }

        const profileId = id || currentUser?.id;
        if (!profileId) throw new Error('No profile ID available');

        const { profile: profileData, heroRequests } = await fetchProfileData(profileId);
        
        setProfile(profileData);
        setIncomingRequests(heroRequests);
      } catch (err) {
        setError(err.message);
      }
    };

    loadProfile();
  }, [id, navigate]);

  // Requests fetching effect
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      try {
        if (user.is_hero) {
          const heroReqs = await getHeroRequests();
          setHeroRequests(heroReqs);
        }
        
        const userReqs = await getUserRequests();
        setUserRequests(userReqs);
      } catch (err) {
        setError('Failed to fetch requests');
      }
    };

    fetchRequests();
  }, [user]);

  // Message timeout effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (success) setSuccess(null);
      if (error) setError(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, error]);

  // Handler functions
  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditedReviewData({
      rating: review.rating,
      review_text: review.review_text
    });
  };

  const handleSaveReview = async (reviewId) => {
    try {
      await updateReview(reviewId, editedReviewData);
      
      setProfile(prevProfile => ({
        ...prevProfile,
        Reviews: prevProfile.Reviews.map(review =>
          review.id === reviewId 
            ? { ...review, ...editedReviewData }
            : review
        )
      }));

      setEditingReview(null);
      setEditedReviewData(initialReviewData);
      setSuccess('Review updated successfully');
    } catch (error) {
      setError('Failed to update review');
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setEditedRequestData({
      title: request.title,
      description: request.description,
      location: request.location,
      urgency: request.urgency
    });
  };

  const handleSaveRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editedRequestData)
      });

      if (!response.ok) throw new Error('Failed to update request');

      setProfile(prevProfile => ({
        ...prevProfile,
        sentRequests: prevProfile.sentRequests.map(request =>
          request.id === requestId 
            ? { ...request, ...editedRequestData }
            : request
        )
      }));

      setEditingRequest(null);
      setEditedRequestData(initialRequestData);
      setSuccess('Request updated successfully');
    } catch (error) {
      setError('Failed to update request');
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update request status');

      setIncomingRequests(prevRequests => 
        newStatus === 'rejected'
          ? prevRequests.filter(request => request.id !== requestId)
          : prevRequests.map(request =>
              request.id === requestId
                ? { ...request, status: newStatus }
                : request
            )
      );

      setSuccess(`Request ${newStatus} successfully`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      await deleteReview(reviewId, token);

      setProfile(prevProfile => ({
        ...prevProfile,
        Reviews: prevProfile.Reviews.filter(review => review.id !== reviewId)
      }));

      setSuccess('Review deleted successfully');
    } catch (error) {
      setError(error.message || 'Failed to delete review');
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
    } catch (err) {
      setError(err.message || 'Failed to delete request');
    }
  };

  // Render functions
  const renderReviewCard = (review) => (
    <div key={review.id} className="review-card">
      <div className="review-header">
        <h3>Hero Review</h3>
        {isLoggedIn && user && user.id === review.user_id && (
          <div className="review-actions">
            {editingReview?.id === review.id ? (
              <button className="save-btn" onClick={() => handleSaveReview(review.id)}>
                Save
              </button>
            ) : (
              <button className="edit-btn" onClick={() => handleEditReview(review)}>
                Edit
              </button>
            )}
            <button
              className="delete-btn"
              onClick={() => handleDeleteReview(review.id)}
              title="Delete Review"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {renderReviewContent(review)}
    </div>
  );

  const renderReviewContent = (review) => (
    editingReview?.id === review.id ? (
      <div className="edit-review-form">
        <StarRating
          rating={editedReviewData.rating}
          onRatingChange={(rating) => 
            setEditedReviewData(prev => ({ ...prev, rating }))
          }
        />
        <textarea
          value={editedReviewData.review_text}
          onChange={(e) => 
            setEditedReviewData(prev => ({ 
              ...prev, 
              review_text: e.target.value 
            }))
          }
          className="edit-review-textarea"
        />
      </div>
    ) : (
      <>
        <div className="rating">Rating: {review.rating}/5</div>
        <p>{review.review_text}</p>
        <small>Posted on: {new Date(review.created_at).toLocaleDateString()}</small>
      </>
    )
  );

  const renderRequestCard = (request) => (
    <div key={request.id} className="request-card">
      {renderRequestHeader(request)}
      {renderRequestContent(request)}
    </div>
  );

  const renderRequestHeader = (request) => (
    <div className="request-header">
      {editingRequest?.id === request.id ? (
        <input
          type="text"
          value={editedRequestData.title}
          onChange={(e) => 
            setEditedRequestData(prev => ({ 
              ...prev, 
              title: e.target.value 
            }))
          }
          className="edit-request-input"
        />
      ) : (
        <h3>{request.title}</h3>
      )}
      {renderRequestActions(request)}
    </div>
  );

  const renderRequestActions = (request) => (
    isLoggedIn && user && user.id === request.user_id && (
      <div className="request-actions">
        {editingRequest?.id === request.id ? (
          <button
            className="save-btn"
            onClick={() => handleSaveRequest(request.id)}
          >
            Save
          </button>
        ) : (
          <button
            className="edit-btn"
            onClick={() => handleEditRequest(request)}
          >
            Edit
          </button>
        )}
        <button
          className="delete-btn"
          onClick={() => handleDeleteRequest(request.id)}
          title="Delete Request"
        >
          ×
        </button>
      </div>
    )
  );

  const renderRequestContent = (request) => (
    editingRequest?.id === request.id ? (
      <div className="edit-request-form">
        <input
          type="text"
          value={editedRequestData.location}
          onChange={(e) => 
            setEditedRequestData(prev => ({ 
              ...prev, 
              location: e.target.value 
            }))
          }
          placeholder="Location"
          className="edit-request-input"
        />
        <textarea
          value={editedRequestData.description}
          onChange={(e) => 
            setEditedRequestData(prev => ({ 
              ...prev, 
              description: e.target.value 
            }))
          }
          placeholder="Description"
          className="edit-request-textarea"
        />
        <select
          value={editedRequestData.urgency}
          onChange={(e) => 
            setEditedRequestData(prev => ({ 
              ...prev, 
              urgency: e.target.value 
            }))
          }
          className="edit-request-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    ) : (
      <>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Location:</strong> {request.location}</p>
        <p><strong>Description:</strong> {request.description}</p>
        <p><strong>Urgency:</strong> {request.urgency}</p>
        <small>Requested on: {new Date(request.created_at).toLocaleDateString()}</small>
      </>
    )
  );

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
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
                {profile.Reviews.map(renderReviewCard)}
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
                {profile.sentRequests.map(renderRequestCard)}
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
    </div>
  );
};

export default Profile;
